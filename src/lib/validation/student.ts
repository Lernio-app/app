import { z } from "zod";
import { parseARSToCentavos } from "@/lib/format";
import { fieldErrorsFrom } from "@/lib/validation/workspace";

export const PLAN_MODES = ["per_lesson", "package", "monthly"] as const;
export type PlanMode = (typeof PLAN_MODES)[number];

export const PLAN_MODE_LABELS: Record<PlanMode, string> = {
  per_lesson: "Por clase",
  package: "Por paquete",
  monthly: "Por mes",
};

const text = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Usá hasta ${max} caracteres.`)
    .transform((value) => (value === "" ? null : value));

const optionalEmail = text(200).refine(
  (value) => value === null || z.email().safeParse(value).success,
  "Revisá el email: no parece válido.",
);

export const studentSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(1, "Poné el nombre del alumno.")
      .max(120, "Usá hasta 120 caracteres."),
    phone: text(40),
    email: optionalEmail,
    subject: text(60),
    level: text(60),
    notes: text(2000),
    payerName: text(120),
    payerRelation: text(60),
    payerPhone: text(40),
    payerEmail: optionalEmail,
    mode: z.enum(PLAN_MODES, { error: "Elegí cómo le cobrás." }),
    amount: z
      .string()
      .trim()
      .transform((value, ctx) => {
        const centavos = parseARSToCentavos(value);
        if (centavos === null) {
          ctx.addIssue({ code: "custom", message: "Poné un monto, por ejemplo 18.000." });
          return z.NEVER;
        }
        return centavos;
      }),
    lessonsPerPackage: z.string().trim(),
    billingDay: z.string().trim(),
  })
  .transform((value, ctx) => {
    let lessonsPerPackage: number | null = null;
    let billingDay: number | null = null;

    if (value.mode === "package") {
      const n = Number(value.lessonsPerPackage);
      if (!Number.isInteger(n) || n < 1 || n > 100) {
        ctx.addIssue({
          code: "custom",
          path: ["lessonsPerPackage"],
          message: "Poné cuántas clases trae el paquete (de 1 a 100).",
        });
      } else {
        lessonsPerPackage = n;
      }
    }
    if (value.mode === "monthly") {
      const n = Number(value.billingDay);
      if (!Number.isInteger(n) || n < 1 || n > 28) {
        ctx.addIssue({
          code: "custom",
          path: ["billingDay"],
          message: "Poné el día del mes para cobrar (de 1 a 28).",
        });
      } else {
        billingDay = n;
      }
    }
    return { ...value, lessonsPerPackage, billingDay };
  });

export type StudentInput = z.output<typeof studentSchema>;

// Lo que escribió el profe, tal cual, para volver a mostrarlo si hay un error.
export type StudentValues = {
  fullName: string;
  phone: string;
  email: string;
  subject: string;
  level: string;
  notes: string;
  payerName: string;
  payerRelation: string;
  payerPhone: string;
  payerEmail: string;
  mode: PlanMode;
  amount: string;
  lessonsPerPackage: string;
  billingDay: string;
};

export function submittedStudentValues(formData: FormData): StudentValues {
  const read = (key: string) => String(formData.get(key) ?? "");
  const mode = read("mode");
  return {
    fullName: read("fullName"),
    phone: read("phone"),
    email: read("email"),
    subject: read("subject"),
    level: read("level"),
    notes: read("notes"),
    payerName: read("payerName"),
    payerRelation: read("payerRelation"),
    payerPhone: read("payerPhone"),
    payerEmail: read("payerEmail"),
    mode: (PLAN_MODES as readonly string[]).includes(mode) ? (mode as PlanMode) : "per_lesson",
    amount: read("amount"),
    lessonsPerPackage: read("lessonsPerPackage"),
    billingDay: read("billingDay"),
  };
}

export function parseStudentForm(formData: FormData) {
  return studentSchema.safeParse(submittedStudentValues(formData));
}

export { fieldErrorsFrom };

// Resumen del plan para la lista y la ficha: "$ 18.000 por clase".
export function planSummary(
  plan: {
    mode: string;
    amount: number;
    lessons_per_package: number | null;
    billing_day: number | null;
  },
  formatAmount: (centavos: number) => string,
) {
  const amount = formatAmount(plan.amount);
  if (plan.mode === "package") return `${amount} por paquete de ${plan.lessons_per_package} clases`;
  if (plan.mode === "monthly") return `${amount} por mes, el día ${plan.billing_day}`;
  return `${amount} por clase`;
}
