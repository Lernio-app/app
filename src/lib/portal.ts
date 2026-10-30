import { cache } from "react";
import { redirect } from "next/navigation";
import { listPayments, listStudentCharges, packageBalances } from "@/lib/billing-data";
import type { ChargeRow, PaymentRow } from "@/lib/billing";
import { localDate } from "@/lib/dates";
import { hasAcceptedLegal } from "@/lib/legal";
import { listStudentLessons } from "@/lib/lessons";
import { CATALOG_SELECT, studentAreaKey, studentDetailLine } from "@/lib/students";
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

// Todo lo que el portal muestra de una ficha vinculada: sus clases, su cuenta y su historial. Las
// consultas usan la sesión del alumno: RLS le deja leer solo lo suyo.
export type PortalSpace = {
  link: Awaited<ReturnType<typeof listMyLinks>>[number];
  detail: string;
  area: ReturnType<typeof studentAreaKey>;
  today: string;
  lessons: Awaited<ReturnType<typeof listStudentLessons>>;
  charges: ChargeRow[];
  payments: PaymentRow[];
  packageLeft: number | null;
  // El profe archivó al alumno: solo lectura y sin próximas clases.
  archived: boolean;
};

export async function loadPortalSpaces(): Promise<PortalSpace[]> {
  // Un profe puede haber archivado al alumno: el espacio se sigue viendo en solo lectura, con el
  // historial y lo que deba, pero sin próximas clases (la base ya no se las deja leer).
  const links = await listMyLinks();
  if (links.length === 0) return [];

  const supabase = await createClient();
  const { data: students } = await supabase
    .from("students")
    .select(`id, subject, ${CATALOG_SELECT}`)
    .in(
      "id",
      links.map((link) => link.student_id),
    );
  const byId = new Map((students ?? []).map((student) => [student.id, student]));
  const packages = await packageBalances();
  const now = new Date();

  return Promise.all(
    links.map(async (link) => {
      const student = byId.get(link.student_id);
      const [lessons, charges, payments] = await Promise.all([
        listStudentLessons(link.student_id, now),
        listStudentCharges(link.student_id),
        listPayments(link.student_id),
      ]);
      return {
        link,
        detail: student ? studentDetailLine(student) : "",
        area: student ? studentAreaKey(student) : "otra",
        today: localDate(now, link.timezone),
        lessons: link.archived ? { ...lessons, upcoming: [] } : lessons,
        archived: link.archived,
        charges,
        payments: payments.filter((payment) => payment.voided_at === null),
        packageLeft: packages.get(link.student_id) ?? null,
      };
    }),
  );
}
