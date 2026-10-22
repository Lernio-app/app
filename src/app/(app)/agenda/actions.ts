"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { isoWeekday } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";
import {
  ATTENDANCE_VALUES,
  fieldErrorsFrom,
  parseCancelForm,
  parseLessonForm,
  parseMoveForm,
  parseNotesForm,
  submittedLessonValues,
  type Attendance,
  type LessonValues,
} from "@/lib/validation/lesson";
import type { FormState } from "@/lib/validation/workspace";
import { requireWorkspace } from "@/lib/workspace";

export type LessonFormState = FormState<LessonValues>;
export type SimpleState = { ok?: boolean; message?: string; fieldErrors?: Record<string, string> };

const idSchema = z.uuid();

function refresh() {
  revalidatePath("/agenda", "layout");
  revalidatePath("/");
}

// Los errores de las funciones de la base llegan como un código en el mensaje.
function friendly(error: { message?: string } | null, fallback: string) {
  switch (error?.message) {
    case "student_not_found":
      return "Alguno de los alumnos ya no está disponible. Revisá la lista.";
    case "lesson_not_found":
      return "No encontramos la clase.";
    case "lesson_cancelled":
      return "La clase está cancelada.";
    case "no_students":
      return "Elegí al menos un alumno.";
    default:
      return fallback;
  }
}

export async function createLesson(
  _prev: LessonFormState,
  formData: FormData,
): Promise<LessonFormState> {
  await requireWorkspace();

  const parsed = parseLessonForm(formData);
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFrom(parsed.error), values: submittedLessonValues(formData) };
  }
  const input = parsed.data;

  const supabase = await createClient();
  const { error } = input.repeat
    ? await supabase.rpc("create_lesson_series", {
        p_weekday: isoWeekday(input.date),
        p_start: input.start,
        p_duration_min: input.durationMin,
        p_student_ids: input.studentIds,
        p_starts_on: input.date,
        p_ends_on: input.endsOn ?? undefined,
        p_meeting_url: input.meetingUrl ?? undefined,
      })
    : await supabase.rpc("create_lesson", {
        p_date: input.date,
        p_start: input.start,
        p_duration_min: input.durationMin,
        p_student_ids: input.studentIds,
        p_meeting_url: input.meetingUrl ?? undefined,
        p_topic: input.topic ?? undefined,
      });

  if (error) {
    return {
      message: friendly(error, "No pudimos guardar la clase. Probá de nuevo en un rato."),
      values: submittedLessonValues(formData),
    };
  }

  refresh();
  redirect(`/agenda?semana=${input.date}`);
}

// Un toque en la asistencia. Devuelve si la clase se cobra para mostrarlo enseguida.
export async function setAttendance(
  lessonId: string,
  studentId: string,
  attendance: Attendance | null,
  billable?: boolean,
): Promise<{ ok: true; billable: boolean } | { ok: false; message: string }> {
  await requireWorkspace();

  const parsed = z
    .object({
      lessonId: idSchema,
      studentId: idSchema,
      attendance: z.enum(ATTENDANCE_VALUES).nullable(),
      billable: z.boolean().optional(),
    })
    .safeParse({ lessonId, studentId, attendance, billable });
  if (!parsed.success) return { ok: false, message: "No pudimos marcar la asistencia." };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("set_attendance", {
    p_lesson_id: parsed.data.lessonId,
    p_student_id: parsed.data.studentId,
    p_attendance: parsed.data.attendance ?? undefined,
    p_billable: parsed.data.billable,
  });
  if (error) {
    return {
      ok: false,
      message: friendly(error, "No pudimos marcar la asistencia. Probá de nuevo."),
    };
  }

  refresh();
  return { ok: true, billable: data ?? true };
}

export async function moveLesson(_prev: SimpleState, formData: FormData): Promise<SimpleState> {
  await requireWorkspace();
  const id = idSchema.safeParse(String(formData.get("lessonId") ?? ""));
  if (!id.success) return { message: "No encontramos la clase." };

  const parsed = parseMoveForm(formData);
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.rpc("move_lesson", {
    p_lesson_id: id.data,
    p_date: parsed.data.date,
    p_start: parsed.data.start,
    p_duration_min: parsed.data.durationMin,
  });
  if (error) return { message: friendly(error, "No pudimos mover la clase. Probá de nuevo.") };

  refresh();
  return { ok: true };
}

export async function cancelLesson(_prev: SimpleState, formData: FormData): Promise<SimpleState> {
  await requireWorkspace();
  const id = idSchema.safeParse(String(formData.get("lessonId") ?? ""));
  if (!id.success) return { message: "No encontramos la clase." };

  const parsed = parseCancelForm(formData);
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.rpc("cancel_lesson", {
    p_lesson_id: id.data,
    p_by: parsed.data.by,
    p_reason: parsed.data.reason ?? undefined,
  });
  if (error) return { message: friendly(error, "No pudimos cancelar la clase. Probá de nuevo.") };

  refresh();
  return { ok: true };
}

export async function restoreLesson(formData: FormData) {
  await requireWorkspace();
  const id = idSchema.safeParse(String(formData.get("lessonId") ?? ""));
  if (!id.success) redirect("/agenda");

  const supabase = await createClient();
  await supabase.rpc("restore_lesson", { p_lesson_id: id.data });

  refresh();
}

export async function saveLessonNotes(
  _prev: SimpleState,
  formData: FormData,
): Promise<SimpleState> {
  await requireWorkspace();
  const id = idSchema.safeParse(String(formData.get("lessonId") ?? ""));
  if (!id.success) return { message: "No encontramos la clase." };

  const parsed = parseNotesForm(formData);
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase
    .from("lessons")
    .update({
      topic: parsed.data.topic,
      meeting_url: parsed.data.meetingUrl,
      shared_notes: parsed.data.sharedNotes,
      private_notes: parsed.data.privateNotes,
    })
    .eq("id", id.data);
  if (error) return { message: "No pudimos guardar los cambios. Probá de nuevo." };

  refresh();
  return { ok: true };
}

// Cambia los alumnos de una clase (para sumar a alguien a una clase grupal, por ejemplo).
export async function setLessonStudents(
  _prev: SimpleState,
  formData: FormData,
): Promise<SimpleState> {
  await requireWorkspace();
  const id = idSchema.safeParse(String(formData.get("lessonId") ?? ""));
  const studentIds = z
    .array(z.uuid())
    .min(1, "Elegí al menos un alumno.")
    .safeParse(formData.getAll("studentIds").map(String));
  if (!id.success) return { message: "No encontramos la clase." };
  if (!studentIds.success) return { fieldErrors: { studentIds: "Elegí al menos un alumno." } };

  const supabase = await createClient();
  const { error } = await supabase.rpc("set_lesson_students", {
    p_lesson_id: id.data,
    p_student_ids: studentIds.data,
  });
  if (error) return { message: friendly(error, "No pudimos cambiar los alumnos. Probá de nuevo.") };

  refresh();
  return { ok: true };
}

// El profe mandó el recordatorio por WhatsApp: se anota para no mostrarlo de nuevo.
export async function markReminded(formData: FormData) {
  await requireWorkspace();
  const lessonId = idSchema.safeParse(String(formData.get("lessonId") ?? ""));
  const studentId = idSchema.safeParse(String(formData.get("studentId") ?? ""));
  if (!lessonId.success || !studentId.success) return;

  const supabase = await createClient();
  await supabase
    .from("lesson_attendees")
    .update({ reminded_at: new Date().toISOString() })
    .eq("lesson_id", lessonId.data)
    .eq("student_id", studentId.data);

  refresh();
}

export async function endSeries(formData: FormData) {
  await requireWorkspace();
  const id = idSchema.safeParse(String(formData.get("seriesId") ?? ""));
  if (!id.success) redirect("/agenda");

  const supabase = await createClient();
  await supabase.rpc("end_lesson_series", { p_series_id: id.data });

  refresh();
}
