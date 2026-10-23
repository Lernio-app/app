import { z } from "zod";
import { parseARSToCentavos } from "@/lib/format";
import { fieldErrorsFrom } from "@/lib/validation/workspace";

export const PLAN_MODES = ["per_lesson", "package", "monthly"] as const;
export type PlanMode = (typeof PLAN_MODES)[number];

// El precio es opcional: "none" es un alumno sin precio, que no genera cobros.
export const PRICE_CHOICES = ["none", ...PLAN_MODES] as const;
export type PriceChoice = (typeof PRICE_CHOICES)[number];

export const PRICE_CHOICE_LABELS: Record<PriceChoice, string> = {
  none: "Sin precio",
  per_lesson: "Por clase",
  package: "Por paquete",
  monthly: "Por mes",
};

// Valor de la materia cuando el profe elige «Otra»: no es una materia de la lista.
export const OTHER_SUBJECT = "other";

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
    subjectChoice: z.string().trim(),
    areaId: z.string().trim(),
    subject: text(60),
    levelId: z.string().trim(),
    notes: text(2000),
    payerName: text(120),
    payerRelation: text(60),
    payerPhone: text(40),
    payerEmail: optionalEmail,
    mode: z.enum(PRICE_CHOICES, { error: "Elegí cómo le cobrás." }),
    amount: z.string().trim(),
    lessonsPerPackage: z.string().trim(),
    billingDay: z.string().trim(),
  })
  .transform((raw, ctx) => {
    const { subjectChoice, areaId, levelId, ...value } = raw;

    // Materia de la lista (con su área y, si quiere, su nivel) o «Otra» con su nombre.
    let catalog: {
      areaId: string | null;
      subjectId: string | null;
      levelId: string | null;
      subject: string | null;
    };
    if (subjectChoice === OTHER_SUBJECT) {
      if (value.subject === null) {
        ctx.addIssue({
          code: "custom",
          path: ["subject"],
          message: "Contanos qué materia es.",
        });
      }
      catalog = { areaId: null, subjectId: null, levelId: null, subject: value.subject };
    } else {
      if (!z.uuid().safeParse(subjectChoice).success) {
        ctx.addIssue({ code: "custom", path: ["subjectChoice"], message: "Elegí la materia." });
      } else if (!z.uuid().safeParse(areaId).success) {
        ctx.addIssue({
          code: "custom",
          path: ["areaId"],
          message: "Elegí para qué estudia el alumno.",
        });
      }
      catalog = {
        areaId: areaId === "" ? null : areaId,
        subjectId: subjectChoice === "" ? null : subjectChoice,
        levelId: levelId === "" ? null : levelId,
        subject: value.subject,
      };
    }

    // Sin precio: se ignoran monto, clases y día, aunque hayan quedado escritos.
    if (value.mode === "none") {
      return {
        ...value,
        ...catalog,
        mode: null,
        amount: null,
        lessonsPerPackage: null,
        billingDay: null,
      };
    }

    let amount: number | null = parseARSToCentavos(value.amount);
    if (amount === null) {
      ctx.addIssue({
        code: "custom",
        path: ["amount"],
        message: "Poné un monto, por ejemplo 18.000, o elegí «Sin precio».",
      });
      amount = 0;
    }

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
    return {
      ...value,
      ...catalog,
      mode: value.mode as PlanMode,
      amount,
      lessonsPerPackage,
      billingDay,
    };
  });

export type StudentInput = z.output<typeof studentSchema>;

// Lo que escribió el profe, tal cual, para volver a mostrarlo si hay un error.
export type StudentValues = {
  fullName: string;
  phone: string;
  email: string;
  // Id de una materia de la lista, «other» o vacío.
  subjectChoice: string;
  areaId: string;
  // Detalle de la materia (First, Análisis I) o el nombre cuando es «Otra».
  subject: string;
  levelId: string;
  notes: string;
  payerName: string;
  payerRelation: string;
  payerPhone: string;
  payerEmail: string;
  mode: PriceChoice;
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
    subjectChoice: read("subjectChoice"),
    areaId: read("areaId"),
    subject: read("subject"),
    levelId: read("levelId"),
    notes: read("notes"),
    payerName: read("payerName"),
    payerRelation: read("payerRelation"),
    payerPhone: read("payerPhone"),
    payerEmail: read("payerEmail"),
    mode: (PRICE_CHOICES as readonly string[]).includes(mode) ? (mode as PriceChoice) : "none",
    amount: read("amount"),
    lessonsPerPackage: read("lessonsPerPackage"),
    billingDay: read("billingDay"),
  };
}

export function parseStudentForm(formData: FormData) {
  return studentSchema.safeParse(submittedStudentValues(formData));
}

export { fieldErrorsFrom };

// Resumen del precio para la lista y la ficha: "$ 18.000 por clase". Sin precio vigente: "Sin precio".
export function priceSummary(
  price: {
    mode: string;
    amount: number;
    lessons_per_package: number | null;
    billing_day: number | null;
  } | null,
  formatAmount: (centavos: number) => string,
) {
  if (!price) return "Sin precio";
  const amount = formatAmount(price.amount);
  if (price.mode === "package")
    return `${amount} por paquete de ${price.lessons_per_package} clases`;
  if (price.mode === "monthly") return `${amount} por mes, el día ${price.billing_day}`;
  return `${amount} por clase`;
}
