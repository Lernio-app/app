import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/types";

export type Lesson = Tables<"lessons">;
export type LessonAttendee = Tables<"lesson_attendees">;
export type LessonSeries = Tables<"lesson_series">;

type StudentRef = Pick<Tables<"students">, "id" | "full_name" | "phone" | "subject" | "level">;
type ContactRef = Pick<Tables<"student_contacts">, "phone" | "is_payer">;

export type LessonWithAttendees = Lesson & {
  lesson_attendees: (LessonAttendee & {
    students: StudentRef & { student_contacts: ContactRef[] };
  })[];
};

export type SeriesWithStudents = LessonSeries & {
  series_students: { students: Pick<Tables<"students">, "id" | "full_name"> }[];
};

const LESSON_SELECT =
  "*, lesson_attendees(*, students(id, full_name, phone, subject, level, student_contacts(phone, is_payer)))";

// Las pantallas llaman antes a requireWorkspace(), que fija el request como dinámico.

// Completa las próximas 8 semanas de los horarios fijos. Es idempotente; si falla, la agenda se
// muestra igual con lo que ya existe.
export async function extendSeries() {
  const supabase = await createClient();
  await supabase.rpc("extend_lesson_series");
}

// Clases de un rango [from, to), sin archivadas, en orden de hora.
export async function listLessons(from: Date, to: Date): Promise<LessonWithAttendees[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lessons")
    .select(LESSON_SELECT)
    .is("archived_at", null)
    .gte("starts_at", from.toISOString())
    .lt("starts_at", to.toISOString())
    .order("starts_at");
  if (error) throw new Error("No se pudo cargar la agenda");
  return data ?? [];
}

export async function getLesson(id: string): Promise<LessonWithAttendees | null> {
  if (!z.uuid().safeParse(id).success) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lessons")
    .select(LESSON_SELECT)
    .eq("id", id)
    .is("archived_at", null)
    .maybeSingle();
  if (error) throw new Error("No se pudo cargar la clase");
  return data;
}

// Horarios fijos vigentes.
export async function listSeries(): Promise<SeriesWithStudents[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lesson_series")
    .select("*, series_students(students(id, full_name))")
    .is("archived_at", null)
    .order("weekday")
    .order("start_time");
  if (error) throw new Error("No se pudieron cargar los horarios fijos");
  return data ?? [];
}

// Clases de un alumno, las más cercanas a hoy primero (próximas y pasadas por separado).
export async function listStudentLessons(studentId: string, now: Date) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lesson_attendees")
    .select("*, lessons!inner(*)")
    .eq("student_id", studentId)
    .is("lessons.archived_at", null);
  if (error) throw new Error("No se pudieron cargar las clases del alumno");

  // El orden de una tabla embebida no ordena las filas de afuera: se ordena acá.
  const rows = (data ?? [])
    .map((row) => ({ attendee: row, lesson: row.lessons }))
    .sort(
      (a, b) => new Date(a.lesson.starts_at).getTime() - new Date(b.lesson.starts_at).getTime(),
    );
  const nowMs = now.getTime();
  return {
    upcoming: rows.filter(({ lesson }) => new Date(lesson.ends_at).getTime() >= nowMs).slice(0, 5),
    past: rows
      .filter(({ lesson }) => new Date(lesson.ends_at).getTime() < nowMs)
      .reverse()
      .slice(0, 10),
  };
}

export function attendeesOf(lesson: LessonWithAttendees) {
  return [...lesson.lesson_attendees].sort((a, b) =>
    a.students.full_name.localeCompare(b.students.full_name, "es"),
  );
}

export function lessonTitle(lesson: LessonWithAttendees) {
  return attendeesOf(lesson)
    .map((attendee) => attendee.students.full_name)
    .join(", ");
}

// Una clase pasada con alguien sin marcar necesita que el profe cargue la asistencia.
export function needsAttendance(lesson: LessonWithAttendees, now: Date) {
  return (
    lesson.status === "scheduled" &&
    new Date(lesson.ends_at).getTime() <= now.getTime() &&
    lesson.lesson_attendees.some((attendee) => attendee.attendance === null)
  );
}

// Teléfono para el recordatorio: el del alumno o, si no tiene, el del responsable de pago.
export function reminderPhone(student: { phone: string | null; student_contacts: ContactRef[] }) {
  return student.phone ?? student.student_contacts.find((c) => c.is_payer)?.phone ?? null;
}
