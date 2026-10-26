import { cache } from "react";
import { redirect } from "next/navigation";
import { hasAcceptedLegal } from "@/lib/legal";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/workspace";

// La cuenta del alumno (o null si la persona no tiene). Se resuelve una vez por request.
export const getStudentProfile = cache(async () => {
  const user = await getUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("student_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  return data;
});

// Para las pantallas del alumno: sin sesión va a ingresar, sin cuenta de alumno a elegir rol y sin la
// versión vigente de los términos aceptada, a aceptarla. Vuelve a la pantalla de origen.
export async function requireStudent(from = "/portal") {
  const user = await getUser();
  if (!user) redirect(`/ingresar?next=${encodeURIComponent(from)}`);
  const profile = await getStudentProfile();
  if (!profile) redirect("/rol");
  if (!(await hasAcceptedLegal(user.id))) redirect(`/aceptar?next=${encodeURIComponent(from)}`);
  return { user, profile };
}

// Los espacios a los que está vinculada la cuenta.
export async function listMyLinks() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("my_student_links");
  if (error) throw new Error("No se pudieron cargar tus profes");
  return data ?? [];
}
