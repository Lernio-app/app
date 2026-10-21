"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { FormState } from "@/lib/validation/workspace";

const emailSchema = z.email("Revisá el email: no parece válido.");

async function siteOrigin() {
  const h = await headers();
  return h.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export async function sendMagicLink(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = emailSchema.safeParse(String(formData.get("email") ?? "").trim());
  if (!parsed.success) {
    return { fieldErrors: { email: parsed.error.issues[0].message } };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data,
    options: { emailRedirectTo: `${await siteOrigin()}/auth/callback` },
  });

  if (error) {
    return { message: "No pudimos mandarte el link. Probá de nuevo en un rato." };
  }
  return { ok: true, message: parsed.data };
}

export async function signInWithGoogle() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${await siteOrigin()}/auth/callback` },
  });
  if (error || !data.url) redirect("/ingresar?error=google");
  redirect(data.url);
}
