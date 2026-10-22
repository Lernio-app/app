import { dayLabel, daysBetween, monthOf, monthsBack } from "@/lib/dates";
import { formatARS } from "@/lib/format";
import { debtMessage, firstName, waLink } from "@/lib/messages";

// Cargos y pagos tal como los devuelven las vistas, sin nulos. Los montos son centavos de peso.
export type ChargeRow = {
  id: string;
  student_id: string;
  source: string;
  lesson_id: string | null;
  period: string | null;
  description: string | null;
  amount: number;
  paid: number;
  remaining: number;
  due_on: string;
};

export type PaymentRow = {
  id: string;
  student_id: string;
  amount: number;
  method: string;
  paid_on: string;
  reference: string | null;
  unallocated: number;
  voided_at: string | null;
};

export const METHODS = ["transfer", "cash", "mercadopago", "other"] as const;
export type Method = (typeof METHODS)[number];

export const METHOD_LABELS: Record<Method, string> = {
  transfer: "Transferencia",
  cash: "Efectivo",
  mercadopago: "MercadoPago",
  other: "Otro",
};

export function methodLabel(method: string) {
  return METHOD_LABELS[method as Method] ?? method;
}

export type ChargeState = "paid" | "overdue" | "due" | "upcoming";

// Un cargo pasa a vencido cuando su fecha se cumple: vence hoy, está vencido desde mañana.
export function chargeState(charge: Pick<ChargeRow, "remaining" | "due_on">, today: string) {
  if (charge.remaining <= 0) return "paid";
  if (charge.due_on < today) return "overdue";
  if (charge.due_on === today) return "due";
  return "upcoming";
}

// Cómo se llama un cargo en las listas: "Clase del 3 de septiembre", "Mensualidad de octubre"…
export function chargeLabel(
  charge: Pick<ChargeRow, "source" | "description" | "period" | "due_on">,
) {
  switch (charge.source) {
    case "lesson":
      return `Clase del ${dayLabel(charge.due_on, { weekday: undefined })}`;
    case "monthly":
      return charge.period
        ? `Mensualidad de ${dayLabel(`${charge.period}-01`, { weekday: undefined, day: undefined })}`
        : "Mensualidad";
    case "package":
      return charge.description ?? "Paquete de clases";
    default:
      return charge.description ?? "Cargo";
  }
}

// Cuándo vence un cargo, dicho para una lista: "vencido hace 5 días", "vence hoy", "vence el 12 de noviembre".
export function dueLabel(dueOn: string, today: string) {
  const days = daysBetween(dueOn, today);
  if (days > 1) return `vencido hace ${days} días`;
  if (days === 1) return "vencido ayer";
  if (days === 0) return "vence hoy";
  return `vence el ${dayLabel(dueOn, { weekday: undefined })}`;
}

const sum = (rows: { remaining: number }[]) =>
  rows.reduce((total, row) => total + row.remaining, 0);

export type Totals = {
  pending: number; // todo lo que falta cobrar, incluso a futuro
  owed: number; // lo ya exigible: vence hoy o antes
  overdue: number; // lo vencido: la fecha ya pasó
  upcoming: number; // cuentas a cobrar: vencen después de hoy
};

export function totals(charges: ChargeRow[], today: string): Totals {
  const open = charges.filter((charge) => charge.remaining > 0);
  return {
    pending: sum(open),
    owed: sum(open.filter((charge) => charge.due_on <= today)),
    overdue: sum(open.filter((charge) => charge.due_on < today)),
    upcoming: sum(open.filter((charge) => charge.due_on > today)),
  };
}

export type Debtor = {
  studentId: string;
  owed: number;
  overdue: number;
  since: string; // el vencimiento más viejo sin pagar
  charges: ChargeRow[]; // los cargos exigibles, del más viejo al más nuevo
};

// Quién debe y desde cuándo: alumnos con cargos pendientes que ya vencieron o vencen hoy.
export function debtors(charges: ChargeRow[], today: string): Debtor[] {
  const byStudent = new Map<string, ChargeRow[]>();
  for (const charge of charges) {
    if (charge.remaining <= 0 || charge.due_on > today) continue;
    byStudent.set(charge.student_id, [...(byStudent.get(charge.student_id) ?? []), charge]);
  }

  return [...byStudent.entries()]
    .map(([studentId, rows]) => {
      const sorted = [...rows].sort((a, b) => a.due_on.localeCompare(b.due_on));
      return {
        studentId,
        owed: sum(sorted),
        overdue: sum(sorted.filter((charge) => charge.due_on < today)),
        since: sorted[0].due_on,
        charges: sorted,
      };
    })
    .sort((a, b) => a.since.localeCompare(b.since) || b.owed - a.owed);
}

export type Collected = {
  total: number;
  thisMonth: number;
  byMonth: { month: string; amount: number }[]; // últimos meses, del más viejo al más nuevo
  byStudent: { studentId: string; amount: number }[]; // de más a menos
};

// Estadísticas de lo cobrado: salen de los pagos, sin guardar totales. Los pagos anulados no cuentan.
export function collected(payments: PaymentRow[], today: string, months = 6): Collected {
  const valid = payments.filter((payment) => payment.voided_at === null);
  const month = monthOf(today);

  const perMonth = new Map<string, number>();
  const perStudent = new Map<string, number>();
  let total = 0;
  for (const payment of valid) {
    total += payment.amount;
    const key = monthOf(payment.paid_on);
    perMonth.set(key, (perMonth.get(key) ?? 0) + payment.amount);
    perStudent.set(payment.student_id, (perStudent.get(payment.student_id) ?? 0) + payment.amount);
  }

  return {
    total,
    thisMonth: perMonth.get(month) ?? 0,
    byMonth: monthsBack(today, months).map((key) => ({
      month: key,
      amount: perMonth.get(key) ?? 0,
    })),
    byStudent: [...perStudent.entries()]
      .map(([studentId, amount]) => ({ studentId, amount }))
      .sort((a, b) => b.amount - a.amount),
  };
}

// Saldo a favor de un alumno: pagos que todavía no cubren ningún cargo.
export function credit(payments: PaymentRow[]) {
  return payments
    .filter((payment) => payment.voided_at === null)
    .reduce((total, payment) => total + payment.unallocated, 0);
}

// Precio nuevo tras un aumento, redondeado a los $ 50 más cercanos, que es como se ponen los precios.
export const PRICE_ROUNDING = 5000;

export function increasedAmount(amount: number, percent: number) {
  const raw = (amount * (100 + percent)) / 100;
  const rounded = Math.round(raw / PRICE_ROUNDING) * PRICE_ROUNDING;
  return percent > 0 ? Math.max(rounded, amount) : Math.max(rounded, PRICE_ROUNDING);
}

// A quién y a qué teléfono va el aviso de deuda: al responsable de pago si tiene teléfono; si no,
// al propio alumno.
export function debtRecipient(student: {
  full_name: string;
  phone: string | null;
  student_contacts: { name: string; phone: string | null; is_payer: boolean }[];
}) {
  const payer = student.student_contacts.find((contact) => contact.is_payer && contact.phone);
  if (payer) return { name: payer.name, phone: payer.phone, forStudent: student.full_name };
  return { name: student.full_name, phone: student.phone, forStudent: null };
}

// Link de WhatsApp con el aviso de deuda escrito: monto, desde cuándo y cómo pagar.
export function debtNoticeUrl({
  student,
  owed,
  since,
  teacherName,
  paymentAlias,
  paymentLink,
}: {
  student: Parameters<typeof debtRecipient>[0];
  owed: number;
  since: string;
  teacherName: string;
  paymentAlias: string | null;
  paymentLink: string | null;
}) {
  const recipient = debtRecipient(student);
  const text = debtMessage({
    recipientName: recipient.name,
    forStudent: recipient.forStudent,
    teacherName,
    amount: formatARS(owed),
    since: dayLabel(since, { weekday: undefined }),
    paymentAlias,
    paymentLink,
  });
  return waLink(recipient.phone, text);
}

export { firstName };
