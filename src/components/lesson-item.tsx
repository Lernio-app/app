import Link from "next/link";
import { formatTime } from "@/lib/format";
import { attendeesOf, lessonTitle, needsAttendance, type LessonWithAttendees } from "@/lib/lessons";
import { cn } from "@/lib/utils";
import { ATTENDANCE_LABELS, type Attendance } from "@/lib/validation/lesson";

function Chip({ tone, children }: { tone: "ok" | "owed" | "muted"; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "rounded-full border px-2 py-0.5 text-xs font-medium",
        tone === "ok" && "text-status-ok",
        tone === "owed" && "text-status-owed",
        tone === "muted" && "text-status-pending",
      )}
    >
      {children}
    </span>
  );
}

// Resumen de la asistencia de una clase para la lista: "Vino", "2 de 3 vinieron", etc.
function attendanceChip(lesson: LessonWithAttendees) {
  const attendees = lesson.lesson_attendees;
  const marked = attendees.filter((a) => a.attendance !== null);
  if (marked.length === 0) return null;
  if (attendees.length === 1) {
    const value = marked[0].attendance as Attendance;
    return (
      <Chip tone={value === "present" || value === "late" ? "ok" : "muted"}>
        {ATTENDANCE_LABELS[value]}
      </Chip>
    );
  }
  const came = marked.filter((a) => a.attendance === "present" || a.attendance === "late").length;
  return (
    <Chip tone={marked.length === attendees.length ? "ok" : "owed"}>
      {came} de {attendees.length} vinieron
    </Chip>
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
      className="bg-card hover:bg-muted/50 flex gap-4 rounded-xl border p-4"
    >
      <div className="tabular w-12 shrink-0 text-sm">
        <p className="font-medium">{formatTime(lesson.starts_at, timeZone)}</p>
        <p className="text-muted-foreground">{formatTime(lesson.ends_at, timeZone)}</p>
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <p className={cn("font-medium", cancelled && "text-muted-foreground line-through")}>
          {lessonTitle(lesson)}
        </p>
        {detail && <p className="text-muted-foreground truncate text-sm">{detail}</p>}
        <div className="flex flex-wrap gap-1.5 empty:hidden">
          {cancelled && <Chip tone="muted">Cancelada</Chip>}
          {missing && <Chip tone="owed">Falta marcar asistencia</Chip>}
          {!cancelled && !missing && attendanceChip(lesson)}
          {lesson.series_id && !cancelled && <Chip tone="muted">Fija</Chip>}
        </div>
      </div>
    </Link>
  );
}
