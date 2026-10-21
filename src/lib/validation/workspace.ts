import { z } from "zod";

export const SUBJECT_OPTIONS = [
  "Inglés e idiomas",
  "Ingreso y universidad",
  "Apoyo escolar",
  "Música",
] as const;

export const LEVEL_OPTIONS = ["Primaria", "Secundaria", "Universidad", "Adultos"] as const;

// "Matemática, Física" -> ["Matemática", "Física"]. Sin vacíos ni repetidos.
export function splitList(raw: string): string[] {
  const seen = new Set<string>();
  for (const item of raw.split(/[,;\n]/)) {
    const value = item.trim();
    if (value) seen.add(value);
  }
  return [...seen];
}

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
  subjects: z.array(z.string().trim().min(1).max(60)).max(20),
  levels: z.array(z.string().trim().min(1).max(60)).max(20),
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

// Lee el FormData de onboarding/ajustes: casillas sugeridas + "otras" separadas por coma.
export function parseWorkspaceForm(formData: FormData) {
  const read = (key: string) => String(formData.get(key) ?? "");
  const fromChecks = (key: string) => formData.getAll(key).map(String);

  return workspaceSchema.safeParse({
    displayName: read("displayName"),
    subjects: [...new Set([...fromChecks("subjects"), ...splitList(read("subjectsOther"))])],
    levels: [...new Set([...fromChecks("levels"), ...splitList(read("levelsOther"))])],
    phone: read("phone"),
    paymentAlias: read("paymentAlias"),
    paymentLink: read("paymentLink"),
    lateCancelHours: read("lateCancelHours") || "24",
  });
}

export type WorkspaceDefaults = {
  displayName: string;
  phone: string;
  subjects: string[];
  levels: string[];
  paymentAlias: string;
  paymentLink: string;
  lateCancelHours: number;
};

export type FormState = {
  ok?: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
  // Lo que escribió el profe, para no perderlo cuando React reinicia el formulario tras un error.
  values?: WorkspaceDefaults;
};

// Valores del formulario tal como se escribieron (sin validar), para volver a mostrarlos.
export function submittedValues(formData: FormData): WorkspaceDefaults {
  const read = (key: string) => String(formData.get(key) ?? "");
  const checked = (key: string) => formData.getAll(key).map(String);
  return {
    displayName: read("displayName"),
    phone: read("phone"),
    subjects: [...new Set([...checked("subjects"), ...splitList(read("subjectsOther"))])],
    levels: [...new Set([...checked("levels"), ...splitList(read("levelsOther"))])],
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
