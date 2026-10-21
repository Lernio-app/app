import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/types";

export type PricePlan = Tables<"price_plans">;
export type StudentContact = Tables<"student_contacts">;
export type Student = Tables<"students">;

export type StudentListItem = Student & { price_plans: PricePlan[] };
export type StudentDetail = Student & {
  price_plans: PricePlan[];
  student_contacts: StudentContact[];
};

// El plan vigente es el que no tiene fecha de cierre.
export function currentPlan(plans: PricePlan[]): PricePlan | null {
  return plans.find((plan) => plan.ended_on === null) ?? null;
}

export function payerContact(contacts: StudentContact[]): StudentContact | null {
  return contacts.find((contact) => contact.is_payer) ?? null;
}

// Evita que % y _ del texto buscado funcionen como comodines.
function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

// Las pantallas llaman antes a requireWorkspace(), que fija el request como dinámico.
export async function listStudents({
  query,
  archived,
}: {
  query?: string;
  archived?: boolean;
}): Promise<StudentListItem[]> {
  const supabase = await createClient();
  let request = supabase.from("students").select("*, price_plans(*)").order("full_name");
  request = archived ? request.not("archived_at", "is", null) : request.is("archived_at", null);
  const text = query?.trim();
  if (text) request = request.ilike("full_name", `%${escapeLike(text)}%`);

  const { data, error } = await request;
  if (error) throw new Error("No se pudo cargar la lista de alumnos");
  return data ?? [];
}

export async function getStudent(id: string): Promise<StudentDetail | null> {
  if (!z.uuid().safeParse(id).success) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("students")
    .select("*, price_plans(*), student_contacts(*)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error("No se pudo cargar al alumno");
  return data;
}
