"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { safeNext } from "@/lib/next-path";
import { createClient } from "@/lib/supabase/server";
import { siteOrigin } from "@/lib/site";
import type { FormState } from "@/lib/validation/workspace";

const emailSchema = z.email("Revisá el email: no parece válido.");

// El origen del ingreso (una invitación, el alta del profe) viaja en `next` y se vuelve a él.
async function callbackUrl(formData: FormData) {
  const next = safeNext(String(formData.get("next") ?? ""));
  const base = `${await siteOrigin()}/auth/callback`;
  return next === "/" ? base : `${base}?next=${encodeURIComponent(next)}`;
}

export async function sendMagicLink(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = emailSchema.safeParse(String(formData.get("email") ?? "").trim());
  if (!parsed.success) {
    return { fieldErrors: { email: parsed.error.issues[0].message } };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data,
    options: { emailRedirectTo: await callbackUrl(formData) },
  });

  if (error) {
    return { message: "No pudimos mandarte el link. Probá de nuevo en un rato." };
  }
  return { ok: true, message: parsed.data };
}

export async function signInWithGoogle(formData: FormData) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: await callbackUrl(formData) },
  });
  if (error || !data.url) redirect("/ingresar?error=google");
  redirect(data.url);
}
