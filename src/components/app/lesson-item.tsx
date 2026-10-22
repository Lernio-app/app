import Link from "next/link";
import { formatTime } from "@/lib/format";
import { attendeesOf, lessonTitle, needsAttendance, type LessonWithAttendees } from "@/lib/lessons";
import { StatusChip, type Status } from "@/components/ui/status-chip";
import { cn } from "@/lib/utils";
import { ATTENDANCE_LABELS, type Attendance } from "@/lib/validation/lesson";

// Vino o llegó tarde: al día. Faltó sin avisar: ámbar con x. Avisó: pendiente (§2.3).
const ATTENDANCE_STATUS: Record<Attendance, { status: Status; cross?: boolean }> = {
  present: { status: "ok" },
  late: { status: "ok" },
  absent: { status: "debt", cross: true },
  excused: { status: "pending" },
};

// Resumen de la asistencia de una clase para la lista: "Vino", "2 de 3 vinieron", etc.
function attendanceChip(lesson: LessonWithAttendees) {
  const attendees = lesson.lesson_attendees;
  const marked = attendees.filter((a) => a.attendance !== null);
  if (marked.length === 0) return null;
  if (attendees.length === 1) {
    const value = marked[0].attendance as Attendance;
    return <StatusChip {...ATTENDANCE_STATUS[value]}>{ATTENDANCE_LABELS[value]}</StatusChip>;
  }
  const came = marked.filter((a) => a.attendance === "present" || a.attendance === "late").length;
  return (
    <StatusChip status={marked.length === attendees.length ? "ok" : "pending"}>
      {came} de {attendees.length} vinieron
    </StatusChip>
  );
}

// Una clase en las listas de la agenda, el inicio y la ficha. Todo el renglón abre la clase.
export function LessonItem({
  lesson,
  timeZone,
  now,
}: {
  lesson: LessonWithAttendees;
  timeZone: string;
  now: Date;
}) {
  const cancelled = lesson.status === "cancelled";
  const missing = needsAttendance(lesson, now);
  const attendees = attendeesOf(lesson);
  const detail =
    lesson.topic ??
    [attendees[0]?.students.subject, attendees[0]?.students.level].filter(Boolean).join(" · ");

  return (
    <Link
      href={`/agenda/${lesson.id}`}
      className="bg-card hover:bg-paper rounded-card flex gap-4 border p-4"
    >
      <div className="num w-12 shrink-0 text-sm">
        <p className="font-medium">{formatTime(lesson.starts_at, timeZone)}</p>
        <p className="text-ink-3">{formatTime(lesson.ends_at, timeZone)}</p>
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <p className={cn("font-medium", cancelled && "text-ink-3 line-through")}>
          {lessonTitle(lesson)}
        </p>
        {detail && <p className="text-ink-3 truncate text-sm">{detail}</p>}
        <div className="flex flex-wrap items-center gap-1.5 empty:hidden">
          {cancelled && (
            <StatusChip status="pending" cross>
              Cancelada
            </StatusChip>
          )}
          {missing && <StatusChip status="pending">Falta marcar asistencia</StatusChip>}
          {!cancelled && !missing && attendanceChip(lesson)}
          {/* "Fija" no es un estado: va como metadato, sin chip. */}
          {lesson.series_id && !cancelled && <span className="label-mono text-ink-3">Fija</span>}
        </div>
      </div>
    </Link>
  );
}
