"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { findDuplicates, type DuplicateMatch } from "@/lib/duplicates";
import { trackEvent } from "@/lib/events";
import { consentMessage, waLink, welcomeMessage } from "@/lib/messages";
import { siteOrigin } from "@/lib/site";
import {
  currentPlan,
  getStudent,
  listStudentsForDuplicateCheck,
  payerContact,
  studentDetailLine,
} from "@/lib/students";
import { createClient } from "@/lib/supabase/server";
import {
  fieldErrorsFrom,
  parseStudentForm,
  submittedStudentValues,
  type StudentInput,
  type StudentValues,
} from "@/lib/validation/student";
import type { FormState } from "@/lib/validation/workspace";
import { requireWorkspace } from "@/lib/workspace";

// Lo que se le muestra al profe para mandar un link: la invitación al alumno o el pedido de
// consentimiento a su responsable de pago. El token en claro solo existe acá.
export type LinkShareData = {
  kind: "invitation" | "consent";
  studentId: string;
  studentName: string;
  link: string;
  message: string;
  whatsappUrl: string;
};

// Un alumno cargado sin link para mandar: un menor de 13 años no tiene cuenta, y uno de 13 o más
// necesita primero un responsable de pago al que pedirle el consentimiento.
export type NoLinkData = {
  kind: "none";
  studentId: string;
  studentName: string;
  reason: "under_13" | "no_payer";
};

// Un alumno ya cargado que se parece al que se está dando de alta, con su materia a la vista.
export type PossibleDuplicate = DuplicateMatch & { detail: string };

export type StudentFormState = FormState<StudentValues> & {
  created?: LinkShareData | NoLinkData;
  // El alta se frenó para que el profe confirme: no bloquea, «Cargar igual» la repite.
  duplicates?: PossibleDuplicate[];
};
export type LinkState = { share?: LinkShareData; message?: string };

async function buildShare(
  student: { id: string; full_name: string; phone: string | null },
  fallbackPhone: string | null,
  teacherName: string,
  token: string,
): Promise<LinkShareData> {
  const link = `${await siteOrigin()}/invitacion/${token}`;
  const message = welcomeMessage({ studentName: student.full_name, teacherName, link });
  return {
    kind: "invitation",
    studentId: student.id,
    studentName: student.full_name,
    link,
    message,
    whatsappUrl: waLink(student.phone ?? fallbackPhone, message),
  };
}

// Pedido de consentimiento para el responsable de pago: el mensaje va a su WhatsApp, no al del menor.
async function buildConsentShare(
  student: { id: string; full_name: string },
  payer: { name: string; phone: string | null },
  teacherName: string,
  token: string,
): Promise<LinkShareData> {
  const link = `${await siteOrigin()}/consentimiento/${token}`;
  const message = consentMessage({
    payerName: payer.name,
    studentName: student.full_name,
    teacherName,
    link,
  });
  return {
    kind: "consent",
    studentId: student.id,
    studentName: student.full_name,
    link,
    message,
    whatsappUrl: waLink(payer.phone, message),
  };
}

// La base repite la regla del teléfono (ADR-0013) por si algo llega sin pasar por el formulario.
function phoneRuleError(message: string | undefined): Pick<StudentFormState, "fieldErrors"> | null {
  if (message?.includes("invalid_phone")) {
    return { fieldErrors: { phone: "No entendimos el teléfono. Revisalo e intentá de nuevo." } };
  }
  if (message?.includes("phone_required")) {
    return { fieldErrors: { phone: "Poné el WhatsApp del alumno." } };
  }
  return null;
}

async function possibleDuplicates(input: StudentInput): Promise<PossibleDuplicate[]> {
  const existing = await listStudentsForDuplicateCheck();
  const matches = findDuplicates(
    {
      fullName: input.fullName,
      phone: input.phone,
      subjectId: input.subjectId,
      subject: input.subject,
    },
    existing,
  );
  const details = new Map(existing.map((student) => [student.id, student.detail]));
  return matches.map((match) => ({ ...match, detail: details.get(match.id) ?? "" }));
}

// Alta rápida desde «Nueva clase» (F2-3): nombre, teléfono y materia. Crea un alumno adulto, sin
// precio ni responsable de pago; lo demás y la invitación se completan después en la ficha.
export type QuickStudentResult = {
  student?: { id: string; name: string; detail: string };
  fieldErrors?: Record<string, string>;
  message?: string;
  duplicates?: PossibleDuplicate[];
};

export async function quickCreateStudent(formData: FormData): Promise<QuickStudentResult> {
  await requireWorkspace();

  // Solo se leen los campos del alta rápida: el resto del formulario completo queda vacío.
  const basic = new FormData();
  for (const key of ["fullName", "phone", "subjectChoice", "areaId", "subject", "levelId"]) {
    basic.set(key, String(formData.get(key) ?? ""));
  }
  const parsed = parseStudentForm(basic);
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };
  const input = parsed.data;

  if (formData.get("confirmDuplicates") !== "1") {
    const duplicates = await possibleDuplicates(input);
    if (duplicates.length > 0) return { duplicates };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_student", {
    p_full_name: input.fullName,
    p_phone: input.phone ?? undefined,
    p_area_id: input.areaId ?? undefined,
    p_subject_id: input.subjectId ?? undefined,
    p_subject: input.subject ?? undefined,
    p_level_id: input.levelId ?? undefined,
    p_is_minor: false,
  });
  const phoneError = phoneRuleError(error?.message);
  if (phoneError) return { fieldErrors: phoneError.fieldErrors };
  const created = data?.[0];
  if (error || !created) {
    return { message: "No pudimos cargar al alumno. Probá de nuevo en un rato." };
  }

  revalidatePath("/alumnos");
  const student = await getStudent(created.student_id);
  return {
    student: {
      id: created.student_id,
      name: input.fullName,
      detail: student ? studentDetailLine(student) : "",
    },
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

  // Aviso de posible duplicado (F1-6): el profe lo confirma con «Cargar igual».
  if (formData.get("confirmDuplicates") !== "1") {
    const duplicates = await possibleDuplicates(input);
    if (duplicates.length > 0) {
      return { duplicates, values: submittedStudentValues(formData) };
    }
  }

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
    p_is_minor: input.isMinor,
    p_minor_13_plus: input.minor13Plus ?? undefined,
  });

  const created = data?.[0];
  const phoneError = phoneRuleError(error?.message);
  if (phoneError) return { ...phoneError, values: submittedStudentValues(formData) };
  if (error || !created) {
    return {
      message: "No pudimos guardar al alumno. Probá de nuevo en un rato.",
      values: submittedStudentValues(formData),
    };
  }

  revalidatePath("/alumnos");
  const student = { id: created.student_id, full_name: input.fullName };

  // Un adulto recibe su invitación. Un menor, no: primero va el consentimiento de su responsable.
  if (!input.isMinor && created.token) {
    return {
      ok: true,
      created: await buildShare(
        { ...student, phone: input.phone },
        input.payerPhone,
        profile.display_name,
        created.token,
      ),
    };
  }
  const none = (reason: NoLinkData["reason"]): StudentFormState => ({
    ok: true,
    created: { kind: "none", studentId: student.id, studentName: input.fullName, reason },
  });
  if (!input.minor13Plus) return none("under_13");
  if (!input.payerName) return none("no_payer");

  const { data: consentToken } = await supabase.rpc("request_minor_consent", {
    p_student_id: student.id,
  });
  if (!consentToken) return none("no_payer");
  return {
    ok: true,
    created: await buildConsentShare(
      student,
      { name: input.payerName, phone: input.payerPhone },
      profile.display_name,
      consentToken,
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
      is_minor: input.isMinor,
      minor_13_plus: input.minor13Plus,
    })
    .eq("id", student.id);
  if (studentError?.message.includes("student_linked")) {
    return fail(
      "Este alumno ya tiene su cuenta vinculada. Para marcarlo como menor o cambiarle la edad, primero deshacé el vínculo desde su ficha.",
    );
  }
  const phoneError = phoneRuleError(studentError?.message);
  if (phoneError) return { ...phoneError, values: submittedStudentValues(formData) };
  if (studentError) return fail("No pudimos guardar los cambios. Probá de nuevo en un rato.");

  // Notas del profe: viven aparte. Una nota vacía no crea fila; si ya había una, queda en blanco.
  const { error: notesError } = input.notes
    ? await supabase
        .from("student_notes")
        .upsert(
          { org_id: org.id, student_id: student.id, body: input.notes },
          { onConflict: "student_id" },
        )
    : await supabase.from("student_notes").update({ body: "" }).eq("student_id", student.id);
  if (notesError) return fail("No pudimos guardar las notas.");

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

// Revoca la invitación vigente y emite una nueva. La anterior deja de funcionar.
export async function regenerateLink(_prev: LinkState, formData: FormData): Promise<LinkState> {
  const { profile } = await requireWorkspace();
  const student = await getStudent(String(formData.get("studentId") ?? ""));
  if (!student) return { message: "No encontramos al alumno." };

  const supabase = await createClient();
  const { data: token, error } = await supabase.rpc("issue_student_invitation", {
    p_student_id: student.id,
  });
  if (error?.message.includes("already_linked")) {
    return {
      message: "Este alumno ya activó su cuenta. Para invitarlo de nuevo, deshacé el vínculo.",
    };
  }
  if (error?.message.includes("consent_required") || error?.message.includes("minor_under_13")) {
    return {
      message: "Un menor recibe la invitación recién cuando su responsable da el consentimiento.",
    };
  }
  if (error || !token) {
    return { message: "No pudimos generar la invitación. Probá de nuevo en un rato." };
  }

  const payer = payerContact(student.student_contacts);
  revalidatePath(`/alumnos/${student.id}`);
  return {
    share: await buildShare(student, payer?.phone ?? null, profile.display_name, token),
  };
}

// Pide el consentimiento al responsable de pago de un menor: devuelve el link para mandárselo. Deja
// sin efecto el pedido anterior.
export async function requestConsent(_prev: LinkState, formData: FormData): Promise<LinkState> {
  const { profile } = await requireWorkspace();
  const student = await getStudent(String(formData.get("studentId") ?? ""));
  if (!student) return { message: "No encontramos al alumno." };

  const payer = payerContact(student.student_contacts);
  const supabase = await createClient();
  const { data: token, error } = await supabase.rpc("request_minor_consent", {
    p_student_id: student.id,
  });
  if (error?.message.includes("no_payer") || !payer) {
    return { message: "Cargá al responsable de pago para pedirle el consentimiento." };
  }
  if (error?.message.includes("minor_under_13")) {
    return { message: "Un alumno menor de 13 años no tiene cuenta." };
  }
  if (error?.message.includes("consent_given")) {
    return { message: "El consentimiento ya está dado." };
  }
  if (error || !token) {
    return { message: "No pudimos armar el pedido. Probá de nuevo en un rato." };
  }

  revalidatePath(`/alumnos/${student.id}`);
  return {
    share: await buildConsentShare(student, payer, profile.display_name, token),
  };
}

// Deshace el vínculo con la cuenta del alumno: vuelve a figurar pendiente y se lo puede invitar de nuevo.
export async function unlinkStudent(formData: FormData) {
  await requireWorkspace();
  const parsed = idSchema.safeParse(String(formData.get("studentId") ?? ""));
  if (!parsed.success) redirect("/alumnos");

  const supabase = await createClient();
  await supabase.rpc("unlink_student", { p_student_id: parsed.data });

  revalidatePath("/alumnos", "layout");
  redirect(`/alumnos/${parsed.data}`);
}
