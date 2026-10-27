import { z } from "zod";

// Formulario de Contacto del sitio. Los motivos se corresponden con `contact_messages.topic`.
export const CONTACT_TOPICS = [
  { value: "profe", label: "Doy clases y tengo una consulta" },
  { value: "clases", label: "Busco clases" },
  { value: "datos", label: "Mis datos personales" },
  { value: "otro", label: "Otra cosa" },
] as const;

export const contactSchema = z.object({
  name: z.string().trim().min(1, "Contanos cómo te llamás.").max(120, "Usá hasta 120 caracteres."),
  email: z.email("Revisá el email: falta algo.").trim().max(254, "Usá hasta 254 caracteres."),
  topic: z.enum(["profe", "clases", "datos", "otro"], "Elegí sobre qué nos escribís."),
  message: z
    .string()
    .trim()
    .min(10, "Contanos un poco más, así te podemos responder.")
    .max(4000, "Usá hasta 4000 caracteres."),
});

export type ContactValues = { name: string; email: string; topic: string; message: string };

export type ContactState = {
  ok?: boolean;
  message?: string;
  fieldErrors?: Partial<Record<keyof ContactValues, string>>;
  values?: ContactValues;
};
