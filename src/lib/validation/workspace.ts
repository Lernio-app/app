import { z } from "zod";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Usá hasta ${max} caracteres.`)
    .transform((value) => (value === "" ? null : value));

export const workspaceSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, "Contanos cómo te llamás.")
    .max(120, "Usá hasta 120 caracteres."),
  subjectIds: z.array(z.uuid()).max(30),
  phone: optionalText(40),
  paymentAlias: optionalText(120),
  paymentLink: optionalText(500).refine(
    (value) => value === null || /^https?:\/\/\S+$/.test(value),
    "El link de pago tiene que empezar con https://",
  ),
  lateCancelHours: z.coerce
    .number({ error: "Poné un número de horas." })
    .int("Poné un número entero de horas.")
    .min(0, "No puede ser negativo.")
    .max(168, "Hasta 168 horas (una semana)."),
});

export type WorkspaceInput = z.infer<typeof workspaceSchema>;

// Lee el FormData de onboarding/ajustes: las materias son los ids de las casillas marcadas.
export function parseWorkspaceForm(formData: FormData) {
  const read = (key: string) => String(formData.get(key) ?? "");
  const fromChecks = (key: string) => formData.getAll(key).map(String);

  return workspaceSchema.safeParse({
    displayName: read("displayName"),
    subjectIds: [...new Set(fromChecks("subjects"))],
    phone: read("phone"),
    paymentAlias: read("paymentAlias"),
    paymentLink: read("paymentLink"),
    lateCancelHours: read("lateCancelHours") || "24",
  });
}

export type WorkspaceDefaults = {
  displayName: string;
  phone: string;
  subjectIds: string[];
  paymentAlias: string;
  paymentLink: string;
  lateCancelHours: number;
};

export type FormState<V = WorkspaceDefaults> = {
  ok?: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
  // Lo que escribió el profe, para no perderlo cuando React reinicia el formulario tras un error.
  values?: V;
};

// Valores del formulario tal como se escribieron (sin validar), para volver a mostrarlos.
export function submittedValues(formData: FormData): WorkspaceDefaults {
  const read = (key: string) => String(formData.get(key) ?? "");
  const checked = (key: string) => formData.getAll(key).map(String);
  return {
    displayName: read("displayName"),
    phone: read("phone"),
    subjectIds: [...new Set(checked("subjects"))],
    paymentAlias: read("paymentAlias"),
    paymentLink: read("paymentLink"),
    lateCancelHours: Number(read("lateCancelHours")) || 0,
  };
}

// Errores de zod -> { campo: primer mensaje }
export function fieldErrorsFrom(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!(key in out)) out[key] = issue.message;
  }
  return out;
}
