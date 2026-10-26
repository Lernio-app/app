"use server";

import { redirect } from "next/navigation";
import { LEGAL_REQUIRED_MESSAGE } from "@/components/app/legal-check";
import { acceptLegal } from "@/lib/legal";
import { createClient } from "@/lib/supabase/server";
import type { FormState } from "@/lib/validation/workspace";
import { getUser } from "@/lib/workspace";

// Los códigos de la base llegan en el mensaje del error.
const ERRORS: Record<string, string> = {
  invitation_used: "Esta invitación ya se usó. Pedile a tu profe que te mande una nueva.",
  invitation_expired: "Esta invitación venció. Pedile a tu profe que te mande una nueva.",
  invitation_unavailable: "Esta invitación ya no está disponible. Pedile a tu profe una nueva.",
  invitation_not_found: "No encontramos esta invitación. Revisá que el link esté completo.",
  already_linked: "Este alumno ya tiene una cuenta vinculada. Hablá con tu profe.",
};

export async function activateAccount(_prev: FormState, formData: FormData): Promise<FormState> {
  const token = String(formData.get("token") ?? "");
  if (!(await getUser())) redirect(`/ingresar?next=${encodeURIComponent(`/invitacion/${token}`)}`);

  // Los términos se aceptan al activar la cuenta, antes de vincularla.
  if (formData.get("legal") !== "on") return { fieldErrors: { legal: LEGAL_REQUIRED_MESSAGE } };
  if (!(await acceptLegal())) {
    return { message: "No pudimos guardar tu aceptación. Probá de nuevo en un rato." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("accept_student_invitation", { p_token: token });
  if (error) {
    const code = Object.keys(ERRORS).find((key) => error.message.includes(key));
    return {
      message: code ? ERRORS[code] : "No pudimos activar tu cuenta. Probá de nuevo en un rato.",
    };
  }

  redirect("/portal");
}
