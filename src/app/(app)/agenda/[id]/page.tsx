import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageContainer } from "@/components/page-header";
import { ReminderLink } from "@/components/reminder-link";
import { Button, buttonVariants } from "@/components/ui/button";
import { lessonCharges } from "@/lib/billing-data";
import { dayLabel, localDate, localTime, spokenDay } from "@/lib/dates";
import { formatTime } from "@/lib/format";
import { attendeesOf, getLesson, lessonTitle, reminderPhone } from "@/lib/lessons";
import { firstName, lessonReminderMessage, waLink } from "@/lib/messages";
import { listStudents } from "@/lib/students";
import { cn } from "@/lib/utils";
import type { Attendance } from "@/lib/validation/lesson";
import { requireWorkspace } from "@/lib/workspace";
import { restoreLesson } from "../actions";
import { AttendanceList } from "./attendance-list";
import { CancelForm, MoveForm, NotesForm, StudentsForm } from "./lesson-forms";

export const metadata = { title: "Clase" };

function Collapsible({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details className="group bg-card rounded-xl border">
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-4 font-medium [&::-webkit-details-marker]:hidden">
        {title}
        <span
          aria-hidden
          className="text-muted-foreground transition-transform group-open:rotate-90"
        >
          ›
        </span>
      </summary>
      <div className="border-t p-4">{children}</div>
    </details>
  );
}

async function Clase({ params }: { params: PageProps<"/agenda/[id]">["params"] }) {
  const { org, profile } = await requireWorkspace();
  const { id } = await params;
  const lesson = await getLesson(id);
  if (!lesson) notFound();

  const tz = org.timezone;
  const now = new Date();
  const today = localDate(now, tz);
  const attendees = attendeesOf(lesson);
  const day = localDate(lesson.starts_at, tz);
  const start = localTime(lesson.starts_at, tz);
  const minutes = Math.round(
    (new Date(lesson.ends_at).getTime() - new Date(lesson.starts_at).getTime()) / 60000,
  );
  const cancelled = lesson.status === "cancelled";
  const upcoming = !cancelled && new Date(lesson.starts_at).getTime() > now.getTime();

  const [active, charges] = await Promise.all([listStudents({}), lessonCharges(lesson.id)]);
  const options = new Map(active.map((s) => [s.id, s.full_name]));
  for (const a of attendees) options.set(a.student_id, a.students.full_name);

  return (
    <>
      <header className="space-y-1">
        <Link
          href={`/agenda?semana=${day}`}
          className="text-muted-foreground text-sm hover:underline"
        >
          ← Agenda
        </Link>
        <h1 className="text-2xl md:text-3xl">{lessonTitle(lesson)}</h1>
        <p className="text-muted-foreground first-letter:uppercase">
          {dayLabel(day)} ·{" "}
          <span className="tabular">
            {start} a {formatTime(lesson.ends_at, tz)}
          </span>
        </p>
        {lesson.topic && <p>{lesson.topic}</p>}
      </header>

      {cancelled && (
        <section className="bg-card space-y-3 rounded-xl border p-4">
          <p className="font-medium">
            Clase cancelada por {lesson.cancelled_by === "student" ? "el alumno" : "vos"}.
          </p>
          {lesson.cancel_reason && (
            <p className="text-muted-foreground text-sm">{lesson.cancel_reason}</p>
          )}
          {lesson.cancelled_by === "student" && (
            <p className="text-muted-foreground text-sm">
              {attendees.some((a) => a.billable)
                ? "Avisó fuera de tu regla, así que se cobra."
                : "Avisó a tiempo, así que no se cobra."}
            </p>
          )}
          <form action={restoreLesson}>
            <input type="hidden" name="lessonId" value={lesson.id} />
            <Button type="submit" variant="outline" size="lg" className="h-11">
              Deshacer cancelación
            </Button>
          </form>
        </section>
      )}

      {lesson.meeting_url && !cancelled && (
        <a
          href={lesson.meeting_url}
          target="_blank"
          rel="noreferrer"
          className={cn(buttonVariants({ size: "lg" }), "h-12 w-full")}
        >
          Entrar a la clase
        </a>
      )}

      {!cancelled && (
        <section className="space-y-3">
          <h2 className="text-lg">Asistencia</h2>
          <AttendanceList
            lessonId={lesson.id}
            rows={attendees.map((a) => ({
              studentId: a.student_id,
              name: a.students.full_name,
              attendance: a.attendance as Attendance | null,
              billable: a.billable,
              charge: charges.get(a.student_id) ?? null,
            }))}
          />
        </section>
      )}

      {upcoming && (
        <section className="space-y-3">
          <div className="space-y-1">
            <h2 className="text-lg">Recordatorio</h2>
            <p className="text-muted-foreground text-sm">
              Se abre WhatsApp con el mensaje escrito; vos lo enviás.
            </p>
          </div>
          <ul className="space-y-2">
            {attendees.map((a) => {
              const message = lessonReminderMessage({
                studentName: a.students.full_name,
                teacherName: profile.display_name,
                when: spokenDay(day, today),
                time: start,
                meetingUrl: lesson.meeting_url,
                lateCancelHours: org.late_cancel_hours,
              });
              const sent = a.reminded_at !== null;
              return (
                <li key={a.student_id} className="flex flex-wrap items-center gap-3">
                  <ReminderLink
                    href={waLink(reminderPhone(a.students), message)}
                    lessonId={lesson.id}
                    studentId={a.student_id}
                    label={`${sent ? "Mandar de nuevo a" : "Recordar a"} ${firstName(a.students.full_name)}`}
                    sent={sent}
                  />
                  {sent && <span className="text-status-ok text-sm">Ya se lo mandaste.</span>}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-lg">Detalles</h2>
        <NotesForm
          lessonId={lesson.id}
          topic={lesson.topic ?? ""}
          meetingUrl={lesson.meeting_url ?? ""}
          sharedNotes={lesson.shared_notes ?? ""}
          privateNotes={lesson.private_notes ?? ""}
        />
      </section>

      <section className="space-y-2">
        <Collapsible title="Alumnos de la clase">
          <StudentsForm
            lessonId={lesson.id}
            options={[...options].map(([optionId, name]) => ({ id: optionId, name }))}
            selected={attendees.map((a) => a.student_id)}
          />
        </Collapsible>
        {!cancelled && (
          <Collapsible title="Mover la clase">
            <MoveForm lessonId={lesson.id} date={day} start={start} durationMin={minutes} />
          </Collapsible>
        )}
        {!cancelled && (
          <Collapsible title="Cancelar la clase">
            <CancelForm
              lessonId={lesson.id}
              lateCancelHours={org.late_cancel_hours}
              canStudentCancel={attendees.length === 1}
            />
          </Collapsible>
        )}
        {lesson.series_id && (
          <p className="text-muted-foreground px-1 pt-1 text-sm">
            Es parte de un horario fijo. Moverla o cancelarla afecta solo a esta clase.
          </p>
        )}
      </section>
    </>
  );
}

export default function ClasePage(props: PageProps<"/agenda/[id]">) {
  return (
    <PageContainer>
      <Suspense fallback={<div className="h-96" aria-hidden />}>
        <Clase params={props.params} />
      </Suspense>
    </PageContainer>
  );
}
