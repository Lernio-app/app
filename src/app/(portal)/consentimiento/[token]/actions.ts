"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { LEGAL_REQUIRED_MESSAGE } from "@/components/app/legal-check";
import { LEGAL_VERSION } from "@/lib/legal";
import { createClient } from "@/lib/supabase/server";
import type { FormState } from "@/lib/validation/workspace";

const CONSENT_REQUIRED_MESSAGE = "Para seguir tenés que dar tu consentimiento.";

// Los códigos de la base llegan en el mensaje del error.
const ERRORS: Record<string, string> = {
  consent_revoked: "Este pedido ya no vale. Pedile al profe que te mande uno nuevo.",
  consent_expired: "Este pedido venció. Pedile al profe que te mande uno nuevo.",
  consent_unavailable: "Este pedido ya no está disponible. Pedile al profe que te mande uno nuevo.",
  consent_not_found: "No encontramos este pedido. Revisá que el link esté completo.",
  invalid_email: "Revisá el email: no parece válido.",
};

const optionalEmail = z
  .string()
  .trim()
  .max(200)
  .refine((value) => value === "" || z.email().safeParse(value).success);

// El responsable de pago da el consentimiento sin cuenta: la aceptación de los términos queda
// guardada con el consentimiento, con su versión.
export async function giveConsent(_prev: FormState, formData: FormData): Promise<FormState> {
  const token = String(formData.get("token") ?? "");

  const fieldErrors: Record<string, string> = {};
  if (formData.get("consent") !== "on") fieldErrors.consent = CONSENT_REQUIRED_MESSAGE;
  if (formData.get("legal") !== "on") fieldErrors.legal = LEGAL_REQUIRED_MESSAGE;
  const email = optionalEmail.safeParse(String(formData.get("minorEmail") ?? ""));
  if (!email.success) fieldErrors.minorEmail = ERRORS.invalid_email;
  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };

  const supabase = await createClient();
  const { error } = await supabase.rpc("give_minor_consent", {
    p_token: token,
    p_legal_version: LEGAL_VERSION,
    p_minor_email: email.success && email.data ? email.data : undefined,
  });
  if (error) {
    const code = Object.keys(ERRORS).find((key) => error.message.includes(key));
    return {
      message: code
        ? ERRORS[code]
        : "No pudimos guardar tu consentimiento. Probá de nuevo en un rato.",
    };
  }

  redirect(`/consentimiento/${token}`);
}

// Retira el consentimiento desde el mismo link: la cuenta del menor deja de ver al profe.
export async function revokeConsent(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const supabase = await createClient();
  await supabase.rpc("revoke_minor_consent", { p_token: token });
  redirect(`/consentimiento/${token}`);
}
