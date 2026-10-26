"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/workspace";

// Registro propio del alumno: crea su cuenta de alumno, sin profe todavía.
export async function chooseStudent() {
  if (!(await getUser())) redirect("/ingresar");

  const supabase = await createClient();
  const { error } = await supabase.rpc("ensure_student_profile");
  if (error) redirect("/rol");

  redirect("/portal");
}
