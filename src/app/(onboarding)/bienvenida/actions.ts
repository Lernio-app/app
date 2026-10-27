"use server";

import { redirect } from "next/navigation";
import { LEGAL_REQUIRED_MESSAGE } from "@/components/app/legal-check";
import { acceptLegal } from "@/lib/legal";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/workspace";
import {
  fieldErrorsFrom,
  parseWorkspaceForm,
  submittedValues,
  type FormState,
} from "@/lib/validation/workspace";

export async function createWorkspace(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getUser();
  if (!user) redirect("/ingresar");

  const parsed = parseWorkspaceForm(formData);
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFrom(parsed.error), values: submittedValues(formData) };
  }
  const input = parsed.data;

  // La aceptación va antes del alta: sin ella no se cargan datos, y repetirla no cambia nada.
  if (formData.get("legal") !== "on") {
    return { fieldErrors: { legal: LEGAL_REQUIRED_MESSAGE }, values: submittedValues(formData) };
  }
  if (!(await acceptLegal())) {
    return {
      message: "No pudimos guardar tu aceptación. Probá de nuevo en un rato.",
      values: submittedValues(formData),
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("create_workspace", {
    p_name: input.displayName,
    p_display_name: input.displayName,
    p_subject_ids: input.subjectIds,
    p_payment_alias: input.paymentAlias ?? undefined,
    p_payment_link: input.paymentLink ?? undefined,
    p_late_cancel_hours: input.lateCancelHours,
  });

  if (error && !error.message.includes("workspace_exists")) {
    return { message: "No pudimos crear tu espacio. Probá de nuevo en un rato." };
  }

  if (input.phone && !error) {
    await supabase.from("teacher_profiles").update({ phone: input.phone }).eq("user_id", user.id);
  }

  redirect("/app");
}
