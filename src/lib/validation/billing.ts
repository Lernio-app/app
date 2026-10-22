import { z } from "zod";
import { isYmd } from "@/lib/dates";
import { METHODS } from "@/lib/billing";
import { parseARSToCentavos } from "@/lib/format";
import { fieldErrorsFrom } from "@/lib/validation/workspace";

// La base guarda los montos en un entero de 32 bits: hasta $ 20 millones por cargo o pago.
const MAX_CENTAVOS = 2_000_000_000;

const amount = z
  .string()
  .trim()
  .transform((value, ctx) => {
    const centavos = parseARSToCentavos(value);
    if (centavos === null || centavos <= 0 || centavos > MAX_CENTAVOS) {
      ctx.addIssue({ code: "custom", message: "Poné un monto, por ejemplo 18.000." });
      return z.NEVER;
    }
    return centavos;
  });

const text = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Usá hasta ${max} caracteres.`)
    .transform((value) => (value === "" ? null : value));

const day = (message: string) => z.string().trim().refine(isYmd, message);
const method = z.enum(METHODS, { error: "Elegí cómo te pagaron." });
const id = (message: string) => z.uuid(message);

export const paymentSchema = z.object({
  studentId: id("Elegí el alumno."),
  amount,
  method,
  paidOn: day("Poné la fecha del pago."),
  reference: text(200),
});

export const chargeSchema = z.object({
  studentId: id("Elegí el alumno."),
  amount,
  description: text(200),
  dueOn: day("Poné la fecha de vencimiento."),
});

export const markPaidSchema = z.object({
  chargeId: id("No encontramos el cargo."),
  method,
  paidOn: day("Poné la fecha del cobro."),
});

// "10" o "7,5". Un aumento va del 1 al 200 por ciento.
const percent = z
  .string()
  .trim()
  .transform((value, ctx) => {
    const n = Number(value.replace(",", "."));
    if (!Number.isFinite(n) || n < 1 || n > 200) {
      ctx.addIssue({ code: "custom", message: "Poné un porcentaje entre 1 y 200." });
      return z.NEVER;
    }
    return Math.round(n * 100) / 100;
  });

export const increaseSchema = z.object({
  percent,
  studentIds: z
    .array(z.uuid())
    .min(1, "Elegí al menos un alumno.")
    .max(200, "Demasiados alumnos juntos."),
});

function read(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

export function parsePaymentForm(formData: FormData) {
  return paymentSchema.safeParse({
    studentId: read(formData, "studentId"),
    amount: read(formData, "amount"),
    method: read(formData, "method"),
    paidOn: read(formData, "paidOn"),
    reference: read(formData, "reference"),
  });
}

export function parseChargeForm(formData: FormData) {
  return chargeSchema.safeParse({
    studentId: read(formData, "studentId"),
    amount: read(formData, "amount"),
    description: read(formData, "description"),
    dueOn: read(formData, "dueOn"),
  });
}

export function parseMarkPaidForm(formData: FormData) {
  return markPaidSchema.safeParse({
    chargeId: read(formData, "chargeId"),
    method: read(formData, "method"),
    paidOn: read(formData, "paidOn"),
  });
}

export function parseIncreaseForm(formData: FormData) {
  return increaseSchema.safeParse({
    percent: read(formData, "percent"),
    studentIds: formData.getAll("studentIds").map(String),
  });
}

// Lo que escribió el profe, tal cual, para volver a mostrarlo si hay un error.
export function submittedFields(formData: FormData, keys: string[]) {
  return Object.fromEntries(keys.map((key) => [key, read(formData, key)]));
}

export type BillingFormState = {
  ok?: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
};

export { fieldErrorsFrom };
