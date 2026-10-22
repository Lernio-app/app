import { createClient } from "@/lib/supabase/server";
import type { ChargeRow, PaymentRow } from "@/lib/billing";

// Las pantallas llaman antes a requireWorkspace(), que fija el request como dinámico.

const CHARGE_COLUMNS =
  "id, student_id, source, lesson_id, period, description, amount, paid, remaining, due_on";
const PAYMENT_COLUMNS =
  "id, student_id, amount, method, paid_on, reference, unallocated, voided_at";

// Las vistas tipan todo como posible nulo; las columnas que se piden nunca lo son.
type RawCharge = Record<keyof ChargeRow, string | number | null>;
type RawPayment = Record<keyof PaymentRow, string | number | null>;

function toCharge(row: RawCharge): ChargeRow {
  return {
    id: row.id as string,
    student_id: row.student_id as string,
    source: row.source as string,
    lesson_id: row.lesson_id as string | null,
    period: row.period as string | null,
    description: row.description as string | null,
    amount: Number(row.amount),
    paid: Number(row.paid),
    remaining: Number(row.remaining),
    due_on: row.due_on as string,
  };
}

function toPayment(row: RawPayment): PaymentRow {
  return {
    id: row.id as string,
    student_id: row.student_id as string,
    amount: Number(row.amount),
    method: row.method as string,
    paid_on: row.paid_on as string,
    reference: row.reference as string | null,
    unallocated: Number(row.unallocated),
    voided_at: row.voided_at as string | null,
  };
}

// Crea las mensualidades que ya tocan. Es idempotente; si falla, se muestra lo que ya existe.
export async function generateMonthlyCharges() {
  const supabase = await createClient();
  await supabase.rpc("generate_monthly_charges");
}

// Cargos con algo por cobrar, del vencimiento más viejo al más nuevo.
export async function listOpenCharges(): Promise<ChargeRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("charge_balances")
    .select(CHARGE_COLUMNS)
    .eq("status", "active")
    .gt("remaining", 0)
    .order("due_on")
    .order("created_at");
  if (error) throw new Error("No se pudieron cargar los cobros");
  return (data ?? []).map((row) => toCharge(row as RawCharge));
}

// Todos los cargos de un alumno, pagos y pendientes, del más nuevo al más viejo.
export async function listStudentCharges(studentId: string): Promise<ChargeRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("charge_balances")
    .select(CHARGE_COLUMNS)
    .eq("student_id", studentId)
    .eq("status", "active")
    .order("due_on", { ascending: false })
    .limit(60);
  if (error) throw new Error("No se pudieron cargar los cargos del alumno");
  return (data ?? []).map((row) => toCharge(row as RawCharge));
}

// Pagos, los más nuevos primero. Incluye los anulados para poder mostrarlos tachados.
export async function listPayments(studentId?: string): Promise<PaymentRow[]> {
  const supabase = await createClient();
  let request = supabase
    .from("payment_balances")
    .select(PAYMENT_COLUMNS)
    .order("paid_on", { ascending: false })
    .order("created_at", { ascending: false });
  if (studentId) request = request.eq("student_id", studentId);
  const { data, error } = await request;
  if (error) throw new Error("No se pudieron cargar los pagos");
  return (data ?? []).map((row) => toPayment(row as RawPayment));
}

// Clases que le quedan a cada alumno en su paquete. Solo figuran los que ya tuvieron uno.
export async function packageBalances(): Promise<Map<string, number>> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("package_ledger").select("student_id, delta");
  if (error) throw new Error("No se pudieron cargar los paquetes");
  const balances = new Map<string, number>();
  for (const row of data ?? []) {
    balances.set(row.student_id, (balances.get(row.student_id) ?? 0) + row.delta);
  }
  return balances;
}

export type BillingStudent = {
  id: string;
  full_name: string;
  phone: string | null;
  archived_at: string | null;
  student_contacts: { name: string; phone: string | null; is_payer: boolean }[];
};

// Alumnos con lo mínimo para nombrarlos y avisarles: archivados incluidos, porque pueden deber.
export async function listBillingStudents(): Promise<Map<string, BillingStudent>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("students")
    .select("id, full_name, phone, archived_at, student_contacts(name, phone, is_payer)")
    .order("full_name");
  if (error) throw new Error("No se pudieron cargar los alumnos");
  return new Map((data ?? []).map((student) => [student.id, student]));
}

// Cargo activo que generó cada alumno en una clase, por el id del alumno.
export async function lessonCharges(lessonId: string): Promise<Map<string, number>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("charge_balances")
    .select("student_id, amount")
    .eq("lesson_id", lessonId)
    .eq("status", "active");
  if (error) throw new Error("No se pudieron cargar los cargos de la clase");
  return new Map((data ?? []).map((row) => [row.student_id as string, Number(row.amount)]));
}
