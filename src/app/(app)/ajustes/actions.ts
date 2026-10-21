"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { trackEvent } from "@/lib/events";
import { requireWorkspace } from "@/lib/workspace";
import {
  fieldErrorsFrom,
  parseWorkspaceForm,
  submittedValues,
  type FormState,
} from "@/lib/validation/workspace";

export async function saveSettings(_prev: FormState, formData: FormData): Promise<FormState> {
  const { userId, org, profile } = await requireWorkspace();

  const parsed = parseWorkspaceForm(formData);
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFrom(parsed.error), values: submittedValues(formData) };
  }
  const input = parsed.data;

  const supabase = await createClient();

  const { error: profileError } = await supabase
    .from("teacher_profiles")
    .update({
      display_name: input.displayName,
      phone: input.phone,
      subjects: input.subjects,
      levels: input.levels,
    })
    .eq("id", profile.id);

  const { error: orgError } = await supabase
    .from("organizations")
    .update({
      payment_alias: input.paymentAlias,
      payment_link: input.paymentLink,
      late_cancel_hours: input.lateCancelHours,
    })
    .eq("id", org.id);

  if (profileError || orgError) {
    return { message: "No pudimos guardar los cambios. Probá de nuevo en un rato." };
  }

  await trackEvent(supabase, { orgId: org.id, userId }, "settings_updated");
  revalidatePath("/", "layout");
  return { ok: true, message: "Listo, guardamos los cambios." };
}
