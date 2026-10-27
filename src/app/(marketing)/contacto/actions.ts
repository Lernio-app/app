"use server";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { contactSchema, type ContactState } from "@/lib/validation/contact";

// Huella de la dirección de red: se guarda el hash, nunca la dirección (ficha de la bandeja de
// Contacto). La sal evita que se pueda revertir comparando contra todas las direcciones posibles.
async function ipHash() {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "desconocida";
  const salt = process.env.CONTACT_IP_SALT ?? "lernio-contacto";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

export async function sendContactMessage(
  _prev: ContactState,
  formData: FormData,
): Promise<ContactState> {
  const values = {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    topic: String(formData.get("topic") ?? ""),
    message: String(formData.get("message") ?? ""),
  };

  // Campo trampa: solo lo completan los robots. Se responde como si hubiera salido bien.
  if (String(formData.get("sitio_web") ?? "") !== "") return { ok: true };

  const parsed = contactSchema.safeParse(values);
  if (!parsed.success) {
    const fieldErrors: ContactState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof NonNullable<ContactState["fieldErrors"]>;
      fieldErrors[key] ??= issue.message;
    }
    return { fieldErrors, values };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("submit_contact_message", {
    p_name: parsed.data.name,
    p_email: parsed.data.email,
    p_topic: parsed.data.topic,
    p_message: parsed.data.message,
    p_ip_hash: await ipHash(),
  });

  if (error?.message === "rate_limited") {
    return {
      message: "Recibimos varios mensajes tuyos en poco tiempo. Probá de nuevo en una hora.",
      values,
    };
  }
  if (error) {
    return { message: "No pudimos mandar tu mensaje. Probá de nuevo en un rato.", values };
  }
  return { ok: true };
}
