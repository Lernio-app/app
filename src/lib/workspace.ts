import { cache } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/types";

export type Workspace = {
  userId: string;
  email: string | undefined;
  org: Tables<"organizations">;
  profile: Tables<"teacher_profiles">;
  role: string;
};

// Usuario con sesión (o null). Se resuelve una vez por request.
export const getUser = cache(async () => {
  // La sesión depende del request: se resuelve en runtime, nunca en el prerender.
  await connection();
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user;
});

// Espacio de trabajo del profe (o null si todavía no lo creó). Se resuelve una vez por request.
export const getWorkspace = cache(async (): Promise<Workspace | null> => {
  const user = await getUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data: membership } = await supabase
    .from("memberships")
    .select("role, organizations(*)")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  const org = membership?.organizations;
  if (!membership || !org) return null;

  const { data: profile } = await supabase
    .from("teacher_profiles")
    .select("*")
    .eq("org_id", org.id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!profile) return null;

  return { userId: user.id, email: user.email, org, profile, role: membership.role };
});

// Para las pantallas del profe: sin sesión va a ingresar, sin espacio va a la bienvenida.
export async function requireWorkspace(): Promise<Workspace> {
  const user = await getUser();
  if (!user) redirect("/ingresar");
  const workspace = await getWorkspace();
  if (!workspace) redirect("/bienvenida");
  return workspace;
}
