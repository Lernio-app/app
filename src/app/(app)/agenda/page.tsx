import { Suspense } from "react";
import Link from "next/link";
import { EmptyState, PageContainer, PageHeader } from "@/components/page-header";
import { LessonItem } from "@/components/lesson-item";
import { buttonVariants } from "@/components/ui/button";
import {
  addDays,
  dayLabel,
  isYmd,
  localDate,
  weekDays,
  weekLabel,
  weekRange,
  weekdayName,
} from "@/lib/dates";
import { extendSeries, listLessons, listSeries } from "@/lib/lessons";
import { requireWorkspace } from "@/lib/workspace";
import { cn } from "@/lib/utils";
import { EndSeriesButton } from "./end-series-button";

export const metadata = { title: "Agenda" };

const nav =
  "rounded-lg border px-3 py-2 text-sm font-medium hover:bg-muted min-h-11 flex items-center";

async function Week({ searchParams }: { searchParams: PageProps<"/agenda">["searchParams"] }) {
  const { org } = await requireWorkspace();
  const params = await searchParams;

  const now = new Date();
  const today = localDate(now, org.timezone);
  const requested =
    typeof params.semana === "string" && isYmd(params.semana) ? params.semana : today;
  const { monday, from, to } = weekRange(requested, org.timezone);
  const days = weekDays(monday);

  await extendSeries();
  const [lessons, series] = await Promise.all([listLessons(from, to), listSeries()]);

  const byDay = new Map<string, typeof lessons>();
  for (const lesson of lessons) {
    const day = localDate(lesson.starts_at, org.timezone);
    byDay.set(day, [...(byDay.get(day) ?? []), lesson]);
  }

  const isCurrent = days.includes(today);

  return (
    <>
      <nav aria-label="Semana" className="flex items-center gap-2">
        <Link
          href={`/agenda?semana=${addDays(monday, -7)}`}
          className={nav}
          aria-label="Semana anterior"
        >
          ←
        </Link>
        <p className="flex-1 text-center text-sm font-medium">{weekLabel(monday)}</p>
        <Link
          href={`/agenda?semana=${addDays(monday, 7)}`}
          className={nav}
          aria-label="Semana siguiente"
        >
          →
        </Link>
        {!isCurrent && (
          <Link href="/agenda" className={nav}>
            Hoy
          </Link>
        )}
      </nav>

      <div className="space-y-5">
        {days.map((day) => {
          const items = byDay.get(day) ?? [];
          const isToday = day === today;
          return (
            <section key={day} aria-label={dayLabel(day)} className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <h2 className={cn("text-base first-letter:uppercase", isToday && "text-primary")}>
                  {dayLabel(day, { month: undefined })}
                  {isToday && <span className="text-primary ml-2 text-sm font-medium">Hoy</span>}
                </h2>
                <Link
                  href={`/agenda/nueva?fecha=${day}`}
                  className="text-muted-foreground hover:text-foreground flex min-h-11 items-center text-sm"
                >
                  + Clase
                </Link>
              </div>
              {items.length === 0 ? (
                <p className="text-muted-foreground text-sm">Sin clases.</p>
              ) : (
                <ul className="space-y-2">
                  {items.map((lesson) => (
                    <li key={lesson.id}>
                      <LessonItem lesson={lesson} timeZone={org.timezone} now={now} />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>

      <section className="space-y-3 border-t pt-6">
        <div className="space-y-1">
          <h2 className="text-lg">Horarios fijos</h2>
          <p className="text-muted-foreground text-sm">
            Clases que se repiten todas las semanas. Se agendan las próximas 8 semanas solas.
          </p>
        </div>
        {series.length === 0 ? (
          <EmptyState title="No tenés horarios fijos">
            Al crear una clase, marcá «Se repite todas las semanas».
          </EmptyState>
        ) : (
          <ul className="space-y-2">
            {series.map((item) => {
              const names = item.series_students.map((s) => s.students.full_name).join(", ");
              const start = item.start_time.slice(0, 5);
              return (
                <li key={item.id} className="bg-card flex items-center gap-3 rounded-xl border p-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium first-letter:uppercase">
                      {weekdayName(item.weekday)} <span className="tabular">{start}</span>
                    </p>
                    <p className="text-muted-foreground truncate text-sm">
                      {names} · {item.duration_min} min
                    </p>
                  </div>
                  <EndSeriesButton seriesId={item.id} />
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}

export default function AgendaPage(props: PageProps<"/agenda">) {
  return (
    <PageContainer>
      <div className="flex items-start justify-between gap-3">
        <PageHeader title="Agenda" description="Tus clases de la semana." />
        <Link href="/agenda/nueva" className={cn(buttonVariants({ size: "lg" }), "h-11 shrink-0")}>
          Nueva clase
        </Link>
      </div>
      <Suspense fallback={<div className="h-96" aria-hidden />}>
        <Week searchParams={props.searchParams} />
      </Suspense>
    </PageContainer>
  );
}
