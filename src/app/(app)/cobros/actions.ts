"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { increasedAmount } from "@/lib/billing";
import { currentPlan, listStudents } from "@/lib/students";
import { createClient } from "@/lib/supabase/server";
import {
  fieldErrorsFrom,
  parseChargeForm,
  parseIncreaseForm,
  parseMarkPaidForm,
  parsePaymentForm,
  submittedFields,
  type BillingFormState,
} from "@/lib/validation/billing";
import { requireWorkspace } from "@/lib/workspace";

const idSchema = z.uuid();

// Cobros toca a casi todas las pantallas: la lista, la ficha del alumno, el Inicio y la agenda.
function refresh() {
  revalidatePath("/cobros", "layout");
  revalidatePath("/alumnos", "layout");
  revalidatePath("/agenda", "layout");
  revalidatePath("/app");
}

// Los errores de las funciones de la base llegan como un código en el mensaje.
function friendly(error: { message?: string } | null, fallback: string) {
  switch (error?.message) {
    case "student_not_found":
      return "No encontramos al alumno.";
    case "charge_not_found":
      return "No encontramos el cargo.";
    case "exceeds_charge":
      return "El pago es mayor a lo que falta de ese cargo.";
    case "already_paid":
      return "Ese cargo ya está cobrado.";
    case "charge_void":
      return "Ese cargo ya está anulado.";
    case "lesson_charge":
      return "El cargo de una clase se corrige desde la asistencia de esa clase.";
    case "payment_void":
      return "Ese pago ya está anulado.";
    case "not_a_package":
      return "El alumno no tiene precio por paquete.";
    default:
      return fallback;
  }
}

const PAYMENT_FIELDS = ["studentId", "amount", "method", "paidOn", "reference"];
const CHARGE_FIELDS = ["studentId", "amount", "description", "dueOn"];

// «Cobrado»: paga lo que falta de un cargo.
export async function markPaid(
  _prev: BillingFormState,
  formData: FormData,
): Promise<BillingFormState> {
  await requireWorkspace();
  const parsed = parseMarkPaidForm(formData);
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.rpc("mark_charge_paid", {
    p_charge_id: parsed.data.chargeId,
    p_method: parsed.data.method,
    p_paid_on: parsed.data.paidOn,
  });
  if (error) return { message: friendly(error, "No pudimos registrar el cobro. Probá de nuevo.") };

  refresh();
  return { ok: true };
}

// Pago a mano de un alumno: cubre sus cargos del más viejo al más nuevo.
export async function recordPayment(
  _prev: BillingFormState,
  formData: FormData,
): Promise<BillingFormState> {
  await requireWorkspace();
  const parsed = parsePaymentForm(formData);
  if (!parsed.success) {
    return {
      fieldErrors: fieldErrorsFrom(parsed.error),
      values: submittedFields(formData, PAYMENT_FIELDS),
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("record_payment", {
    p_student_id: parsed.data.studentId,
    p_amount: parsed.data.amount,
    p_method: parsed.data.method,
    p_paid_on: parsed.data.paidOn,
    p_reference: parsed.data.reference ?? undefined,
  });
  if (error) {
    return {
      message: friendly(error, "No pudimos registrar el pago. Probá de nuevo."),
      values: submittedFields(formData, PAYMENT_FIELDS),
    };
  }

  refresh();
  redirect("/cobros");
}

// Cargo a mano, con vencimiento. Con una fecha futura es una cuenta a cobrar.
export async function createCharge(
  _prev: BillingFormState,
  formData: FormData,
): Promise<BillingFormState> {
  await requireWorkspace();
  const parsed = parseChargeForm(formData);
  if (!parsed.success) {
    return {
      fieldErrors: fieldErrorsFrom(parsed.error),
      values: submittedFields(formData, CHARGE_FIELDS),
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("create_charge", {
    p_student_id: parsed.data.studentId,
    p_amount: parsed.data.amount,
    p_description: parsed.data.description ?? "",
    p_due_on: parsed.data.dueOn,
  });
  if (error) {
    return {
      message: friendly(error, "No pudimos guardar el cargo. Probá de nuevo."),
      values: submittedFields(formData, CHARGE_FIELDS),
    };
  }

  refresh();
  redirect("/cobros");
}

export async function voidCharge(formData: FormData) {
  await requireWorkspace();
  const id = idSchema.safeParse(String(formData.get("chargeId") ?? ""));
  if (!id.success) return;
  const supabase = await createClient();
  await supabase.rpc("void_charge", { p_charge_id: id.data });
  refresh();
}

export async function voidPayment(formData: FormData) {
  await requireWorkspace();
  const id = idSchema.safeParse(String(formData.get("paymentId") ?? ""));
  if (!id.success) return;
  const supabase = await createClient();
  await supabase.rpc("void_payment", { p_payment_id: id.data });
  refresh();
}

export async function renewPackage(formData: FormData) {
  await requireWorkspace();
  const id = idSchema.safeParse(String(formData.get("studentId") ?? ""));
  if (!id.success) return;
  const supabase = await createClient();
  await supabase.rpc("renew_package", { p_student_id: id.data });
  refresh();
}

// Aumento de precios. Los montos nuevos se calculan acá, a partir del precio vigente de cada alumno,
// y no se toman de lo que mandó el navegador.
export async function applyIncrease(
  _prev: BillingFormState,
  formData: FormData,
): Promise<BillingFormState> {
  await requireWorkspace();
  const parsed = parseIncreaseForm(formData);
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };

  const students = await listStudents({});
  const changes = students
    .filter((student) => parsed.data.studentIds.includes(student.id))
    .flatMap((student) => {
      const plan = currentPlan(student.price_plans);
      return plan && plan.amount > 0
        ? [{ studentId: student.id, amount: increasedAmount(plan.amount, parsed.data.percent) }]
        : [];
    });
  if (changes.length === 0) {
    return { message: "Ninguno de los alumnos elegidos tiene un precio para aumentar." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("apply_price_changes", { p_changes: changes });
  if (error) return { message: friendly(error, "No pudimos aplicar el aumento. Probá de nuevo.") };

  refresh();
  redirect("/cobros");
}
