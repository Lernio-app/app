import { Suspense } from "react";
import Link from "next/link";
import { EmptyState, PageContainer } from "@/components/page-header";
import { LessonItem } from "@/components/lesson-item";
import { ReminderLink } from "@/components/reminder-link";
import { addDays, localDate, localTime, spokenDay, zonedToUtc } from "@/lib/dates";
import { formatDate } from "@/lib/format";
import { extendSeries, listLessons, needsAttendance, reminderPhone } from "@/lib/lessons";
import { firstName, lessonReminderMessage, waLink } from "@/lib/messages";
import { requireWorkspace } from "@/lib/workspace";

export const metadata = { title: "Inicio" };

async function Greeting() {
  const { profile, org } = await requireWorkspace();
  const today = formatDate(
    new Date(),
    { weekday: "long", day: "numeric", month: "long" },
    org.timezone,
  );
  const first = profile.display_name.split(" ")[0];

  return (
    <header className="space-y-1">
      <p className="text-muted-foreground text-sm first-letter:uppercase">{today}</p>
      <h1 className="text-2xl md:text-3xl">Buenas, {first}</h1>
    </header>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg">{title}</h2>
      {children}
    </section>
  );
}

// Clases de hoy, las que quedaron sin asistencia y los recordatorios de mañana.
async function Agenda() {
  const { org, profile } = await requireWorkspace();
  const tz = org.timezone;
  const now = new Date();
  const today = localDate(now, tz);
  const tomorrow = addDays(today, 1);

  await extendSeries();
  const lessons = await listLessons(
    zonedToUtc(addDays(today, -14), "00:00", tz),
    zonedToUtc(addDays(today, 2), "00:00", tz),
  );

  const todays = lessons.filter((lesson) => localDate(lesson.starts_at, tz) === today);
  const toMark = lessons.filter(
    (lesson) => localDate(lesson.starts_at, tz) !== today && needsAttendance(lesson, now),
  );
  const reminders = lessons
    .filter(
      (lesson) => lesson.status === "scheduled" && localDate(lesson.starts_at, tz) === tomorrow,
    )
    .flatMap((lesson) =>
      lesson.lesson_attendees
        .filter((attendee) => attendee.reminded_at === null)
        .map((attendee) => ({ lesson, attendee })),
    );

  return (
    <>
      <Section title="Clases de hoy">
        {todays.length === 0 ? (
          <EmptyState title="No tenés clases hoy">
            <Link href="/agenda" className="text-primary underline">
              Ver la agenda
            </Link>
          </EmptyState>
        ) : (
          <ul className="space-y-2">
            {todays.map((lesson) => (
              <li key={lesson.id}>
                <LessonItem lesson={lesson} timeZone={tz} now={now} />
              </li>
            ))}
          </ul>
        )}
      </Section>

      {toMark.length > 0 && (
        <Section title="Falta marcar asistencia">
          <ul className="space-y-2">
            {toMark.map((lesson) => (
              <li key={lesson.id}>
                <LessonItem lesson={lesson} timeZone={tz} now={now} />
              </li>
            ))}
          </ul>
        </Section>
      )}

      {reminders.length > 0 && (
        <Section title="Recordatorios para mandar">
          <ul className="space-y-2">
            {reminders.map(({ lesson, attendee }) => {
              const student = attendee.students;
              const time = localTime(lesson.starts_at, tz);
              const message = lessonReminderMessage({
                studentName: student.full_name,
                teacherName: profile.display_name,
                when: spokenDay(tomorrow, today),
                time,
                meetingUrl: lesson.meeting_url,
                lateCancelHours: org.late_cancel_hours,
              });
              return (
                <li
                  key={`${lesson.id}-${attendee.student_id}`}
                  className="bg-card flex items-center justify-between gap-3 rounded-xl border p-4"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{student.full_name}</p>
                    <p className="text-muted-foreground tabular text-sm">Mañana · {time}</p>
                  </div>
                  <ReminderLink
                    href={waLink(reminderPhone(student), message)}
                    lessonId={lesson.id}
                    studentId={attendee.student_id}
                    label={`Recordar a ${firstName(student.full_name)}`}
                  />
                </li>
              );
            })}
          </ul>
        </Section>
      )}
    </>
  );
}

export default function InicioPage() {
  return (
    <PageContainer>
      <Suspense fallback={<div className="h-16" aria-hidden />}>
        <Greeting />
      </Suspense>

      {/* Primero lo académico. Los cobros se suman con F3. */}
      <Section title="Para corregir">
        <EmptyState title="Nada para corregir" />
      </Section>

      <Suspense fallback={<div className="h-48" aria-hidden />}>
        <Agenda />
      </Suspense>
    </PageContainer>
  );
}
