"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { trackEvent } from "@/lib/events";
import { waLink, welcomeMessage } from "@/lib/messages";
import { siteOrigin } from "@/lib/site";
import { currentPlan, getStudent, payerContact } from "@/lib/students";
import { createClient } from "@/lib/supabase/server";
import {
  fieldErrorsFrom,
  parseStudentForm,
  submittedStudentValues,
  type StudentValues,
} from "@/lib/validation/student";
import type { FormState } from "@/lib/validation/workspace";
import { requireWorkspace } from "@/lib/workspace";

// Lo que se le muestra al profe para mandarle el link al alumno. El token en claro solo existe acá.
export type LinkShareData = {
  studentId: string;
  studentName: string;
  link: string;
  message: string;
  whatsappUrl: string;
};

export type StudentFormState = FormState<StudentValues> & { created?: LinkShareData };
export type LinkState = { share?: LinkShareData; message?: string };

async function buildShare(
  student: { id: string; full_name: string; phone: string | null },
  fallbackPhone: string | null,
  teacherName: string,
  token: string,
): Promise<LinkShareData> {
  const link = `${await siteOrigin()}/a/${token}`;
  const message = welcomeMessage({ studentName: student.full_name, teacherName, link });
  return {
    studentId: student.id,
    studentName: student.full_name,
    link,
    message,
    whatsappUrl: waLink(student.phone ?? fallbackPhone, message),
  };
}

export async function createStudent(
  _prev: StudentFormState,
  formData: FormData,
): Promise<StudentFormState> {
  const { profile } = await requireWorkspace();

  const parsed = parseStudentForm(formData);
  if (!parsed.success) {
    return {
      fieldErrors: fieldErrorsFrom(parsed.error),
      values: submittedStudentValues(formData),
    };
  }
  const input = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_student", {
    p_full_name: input.fullName,
    p_phone: input.phone ?? undefined,
    p_email: input.email ?? undefined,
    p_area_id: input.areaId ?? undefined,
    p_subject_id: input.subjectId ?? undefined,
    p_subject: input.subject ?? undefined,
    p_level_id: input.levelId ?? undefined,
    p_notes: input.notes ?? undefined,
    p_payer_name: input.payerName ?? undefined,
    p_payer_relation: input.payerRelation ?? undefined,
    p_payer_phone: input.payerPhone ?? undefined,
    p_payer_email: input.payerEmail ?? undefined,
    p_mode: input.mode ?? undefined,
    p_amount: input.amount ?? undefined,
    p_lessons_per_package: input.lessonsPerPackage ?? undefined,
    p_billing_day: input.billingDay ?? undefined,
  });

  const created = data?.[0];
  if (error || !created) {
    return {
      message: "No pudimos guardar al alumno. Probá de nuevo en un rato.",
      values: submittedStudentValues(formData),
    };
  }

  revalidatePath("/alumnos");
  return {
    ok: true,
    created: await buildShare(
      { id: created.student_id, full_name: input.fullName, phone: input.phone },
      input.payerPhone,
      profile.display_name,
      created.token,
    ),
  };
}

export async function updateStudent(
  _prev: StudentFormState,
  formData: FormData,
): Promise<StudentFormState> {
  const { org, userId } = await requireWorkspace();
  const id = String(formData.get("studentId") ?? "");
  const student = await getStudent(id);
  if (!student) redirect("/alumnos");

  const parsed = parseStudentForm(formData);
  if (!parsed.success) {
    return {
      fieldErrors: fieldErrorsFrom(parsed.error),
      values: submittedStudentValues(formData),
    };
  }
  const input = parsed.data;
  const fail = (message: string): StudentFormState => ({
    message,
    values: submittedStudentValues(formData),
  });

  const supabase = await createClient();

  const { error: studentError } = await supabase
    .from("students")
    .update({
      full_name: input.fullName,
      phone: input.phone,
      email: input.email,
      area_id: input.areaId,
      subject_id: input.subjectId,
      subject: input.subject,
      level_id: input.levelId,
      notes: input.notes,
    })
    .eq("id", student.id);
  if (studentError) return fail("No pudimos guardar los cambios. Probá de nuevo en un rato.");

  // Responsable de pago: se edita el que ya existe o se crea uno nuevo.
  const payer = payerContact(student.student_contacts);
  if (input.payerName) {
    const fields = {
      name: input.payerName,
      relation: input.payerRelation,
      phone: input.payerPhone,
      email: input.payerEmail,
      is_payer: true,
      gets_reports: true,
    };
    const { error } = payer
      ? await supabase.from("student_contacts").update(fields).eq("id", payer.id)
      : await supabase
          .from("student_contacts")
          .insert({ ...fields, org_id: org.id, student_id: student.id });
    if (error) return fail("No pudimos guardar al responsable de pago.");
  } else if (payer) {
    // Los contactos no se borran: se deja de marcar como responsable de pago.
    await supabase
      .from("student_contacts")
      .update({ is_payer: false, gets_reports: false })
      .eq("id", payer.id);
  }

  // Precio: solo si cambió, para no llenar el historial. Sin modalidad se quita el vigente.
  const price = currentPlan(student.price_plans);
  const priceChanged =
    input.mode === null
      ? price !== null
      : !price ||
        price.mode !== input.mode ||
        price.amount !== input.amount ||
        price.lessons_per_package !== input.lessonsPerPackage ||
        price.billing_day !== input.billingDay;
  if (priceChanged) {
    const { error } = await supabase.rpc("set_price_plan", {
      p_student_id: student.id,
      p_mode: input.mode ?? undefined,
      p_amount: input.amount ?? undefined,
      p_lessons_per_package: input.lessonsPerPackage ?? undefined,
      p_billing_day: input.billingDay ?? undefined,
    });
    if (error) return fail("No pudimos guardar el precio.");
  }

  await trackEvent(supabase, { orgId: org.id, userId }, "student_updated");
  revalidatePath("/alumnos", "layout");
  redirect(`/alumnos/${student.id}`);
}

const idSchema = z.uuid();

async function setArchived(formData: FormData, archived: boolean) {
  const { org, userId } = await requireWorkspace();
  const parsed = idSchema.safeParse(String(formData.get("studentId") ?? ""));
  if (!parsed.success) redirect("/alumnos");

  const supabase = await createClient();
  const { error } = await supabase
    .from("students")
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq("id", parsed.data);
  if (!error) {
    await trackEvent(
      supabase,
      { orgId: org.id, userId },
      archived ? "student_archived" : "student_restored",
    );
  }
  revalidatePath("/alumnos", "layout");
  redirect(archived ? "/alumnos" : `/alumnos/${parsed.data}`);
}

export async function archiveStudent(formData: FormData) {
  await setArchived(formData, true);
}

export async function restoreStudent(formData: FormData) {
  await setArchived(formData, false);
}

// Revoca el link vigente y emite uno nuevo. El anterior deja de funcionar.
export async function regenerateLink(_prev: LinkState, formData: FormData): Promise<LinkState> {
  const { profile } = await requireWorkspace();
  const student = await getStudent(String(formData.get("studentId") ?? ""));
  if (!student) return { message: "No encontramos al alumno." };

  const supabase = await createClient();
  const { data: token, error } = await supabase.rpc("issue_student_link", {
    p_student_id: student.id,
  });
  if (error || !token) return { message: "No pudimos generar el link. Probá de nuevo en un rato." };

  const payer = payerContact(student.student_contacts);
  return {
    share: await buildShare(student, payer?.phone ?? null, profile.display_name, token),
  };
}
