"use server";

import { redirect } from "next/navigation";
import { LEGAL_REQUIRED_MESSAGE } from "@/components/app/legal-check";
import { acceptLegal } from "@/lib/legal";
import { createClient } from "@/lib/supabase/server";
import { parseAccountForm } from "@/lib/validation/account";
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
  const user = await getUser();
  if (!user) redirect(`/ingresar?next=${encodeURIComponent(`/invitacion/${token}`)}`);

  // El alumno confirma su nombre y su teléfono (F1-5) y acepta los términos, todo antes de vincular.
  const account = parseAccountForm(formData);
  const fieldErrors: Record<string, string> = account.success ? {} : { ...account.fieldErrors };
  if (formData.get("legal") !== "on") fieldErrors.legal = LEGAL_REQUIRED_MESSAGE;
  if (!account.success || fieldErrors.legal) return { fieldErrors };
  if (!(await acceptLegal())) {
    return { message: "No pudimos guardar tu aceptación. Probá de nuevo en un rato." };
  }

  // Los datos quedan en su cuenta, no en la ficha del profe. Si la cuenta todavía no existe se crea
  // primero; la vinculación respeta lo que se acaba de guardar.
  const supabase = await createClient();
  const { error: ensureError } = await supabase.rpc("ensure_student_profile");
  const { error: profileError } = ensureError
    ? { error: ensureError }
    : await supabase
        .from("student_profiles")
        .update({ display_name: account.data.fullName, phone: account.data.phone })
        .eq("user_id", user.id);
  if (profileError) {
    return { message: "No pudimos guardar tus datos. Probá de nuevo en un rato." };
  }

  const { error } = await supabase.rpc("accept_student_invitation", { p_token: token });
  if (error) {
    const code = Object.keys(ERRORS).find((key) => error.message.includes(key));
    return {
      message: code ? ERRORS[code] : "No pudimos activar tu cuenta. Probá de nuevo en un rato.",
    };
  }

  redirect("/portal");
}
