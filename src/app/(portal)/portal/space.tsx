import { AreaTag } from "@/components/ui/area";
import { buttonVariants } from "@/components/ui/button";
import { SectionTitle } from "@/components/ui/page-header";
import { StatusChip, type Status } from "@/components/ui/status-chip";
import {
  chargeLabel,
  chargeState,
  dueLabel,
  methodLabel,
  totals,
  credit,
  type ChargeRow,
  type PaymentRow,
} from "@/lib/billing";
import { dayLabel, localDate } from "@/lib/dates";
import { formatARS, formatTime } from "@/lib/format";
import { firstName } from "@/lib/messages";
import type { PortalSpace } from "@/lib/portal";
import { cn } from "@/lib/utils";
import { ATTENDANCE_LABELS, type Attendance } from "@/lib/validation/lesson";

type LessonRow = PortalSpace["lessons"]["upcoming"][number];

// Cómo se ve la asistencia para el alumno: lo mismo que ve el profe, con las mismas palabras.
const ATTENDANCE_STATUS: Record<Attendance, { status: Status; cross?: boolean }> = {
  present: { status: "ok" },
  late: { status: "ok" },
  absent: { status: "debt", cross: true },
  excused: { status: "pending" },
};

function lessonWhen({ lesson }: LessonRow, timeZone: string) {
  const day = localDate(lesson.starts_at, timeZone);
  return (
    <>
      <span className="first-letter:uppercase">
        {dayLabel(day, { weekday: "long", day: "numeric", month: "long" })}
      </span>{" "}
      · <span className="num">{formatTime(lesson.starts_at, timeZone)}</span>
    </>
  );
}

// Próximas clases, con el link para entrar y lo que el profe dejó para el alumno.
function Upcoming({ rows, timeZone }: { rows: LessonRow[]; timeZone: string }) {
  return (
    <section className="space-y-3">
      <SectionTitle>Próximas clases</SectionTitle>
      {rows.length === 0 ? (
        <p className="bg-card rounded-card text-ink-3 border p-4 text-sm">
          No tenés clases agendadas por ahora.
        </p>
      ) : (
        <ul className="space-y-2">
          {rows.map((row) => {
            const { lesson } = row;
            const cancelled = lesson.status === "cancelled";
            return (
              <li key={lesson.id} className="bg-card rounded-card space-y-3 border p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className={cn("font-medium", cancelled && "text-ink-3 line-through")}>
                    {lessonWhen(row, timeZone)}
                  </p>
                  {cancelled && (
                    <StatusChip status="pending" cross>
                      Cancelada
                    </StatusChip>
                  )}
                </div>
                {lesson.topic && <p className="text-ink-2">{lesson.topic}</p>}
                {lesson.shared_notes && (
                  <p className="text-ink-2 text-sm whitespace-pre-line">{lesson.shared_notes}</p>
                )}
                {lesson.meeting_url && !cancelled && (
                  <a
                    href={lesson.meeting_url}
                    target="_blank"
                    rel="noreferrer"
                    className={cn(buttonVariants({ variant: "secondary" }), "w-full")}
                  >
                    Entrar a la clase
                  </a>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function ChargeLine({ charge, today }: { charge: ChargeRow; today: string }) {
  const state = chargeState(charge, today);
  return (
    <li className="flex items-baseline justify-between gap-3">
      <div className="min-w-0">
        <p>{chargeLabel(charge)}</p>
        <p className={cn("text-sm", state === "overdue" ? "text-debt" : "text-ink-3")}>
          {dueLabel(charge.due_on, today)}
        </p>
      </div>
      <p className="num shrink-0 font-medium">{formatARS(charge.remaining)}</p>
    </li>
  );
}

// Cuánto debe, qué cargos faltan y cómo pagar. El cobro ocurre por fuera: acá solo se ve y se avisa.
function Account({ space }: { space: PortalSpace }) {
  const { link, charges, payments, packageLeft, today } = space;
  const teacher = firstName(link.teacher_name);
  // Lo más viejo primero: es lo que más urge.
  const open = charges
    .filter((charge) => charge.remaining > 0)
    .sort((a, b) => a.due_on.localeCompare(b.due_on));
  const sums = totals(open, today);
  const balance = credit(payments);
  const hasPaymentInfo = Boolean(link.payment_alias || link.payment_link);

  // Sin cargos, pagos ni paquete no hay nada que mostrar: el profe no le cobra por la app.
  if (charges.length === 0 && payments.length === 0 && packageLeft === null) return null;

  return (
    <section className="space-y-3">
      <SectionTitle>Tu cuenta</SectionTitle>
      <div className="bg-card rounded-card space-y-4 border p-4">
        {sums.pending === 0 ? (
          <StatusChip status="ok">Estás al día</StatusChip>
        ) : (
          <div className="space-y-1">
            <p className="text-ink-3 text-sm">
              {sums.owed > 0 ? "Tenés para pagar" : "A pagar más adelante"}
            </p>
            <p className="num-kpi">{formatARS(sums.owed > 0 ? sums.owed : sums.pending)}</p>
            {sums.owed > 0 && sums.upcoming > 0 && (
              <p className="text-ink-3 text-sm">
                Y <span className="num">{formatARS(sums.upcoming)}</span> que vencen más adelante.
              </p>
            )}
          </div>
        )}

        {open.length > 0 && (
          <ul className="space-y-3 border-t pt-4">
            {open.map((charge) => (
              <ChargeLine key={charge.id} charge={charge} today={today} />
            ))}
          </ul>
        )}

        {balance > 0 && (
          <p className="text-ink-2 border-t pt-4 text-sm">
            Tenés <span className="num font-medium">{formatARS(balance)}</span> a favor: se aplica a
            tus próximos cargos.
          </p>
        )}
        {packageLeft !== null && (
          <p className="text-ink-2 border-t pt-4 text-sm">
            {packageLeft > 0
              ? `Te quedan ${packageLeft} ${packageLeft === 1 ? "clase" : "clases"} de tu paquete.`
              : "Ya usaste las clases de tu paquete."}
          </p>
        )}
      </div>

      {sums.pending > 0 && (
        <div className="bg-card rounded-card space-y-3 border p-4">
          <p className="font-medium">Cómo pagar</p>
          {hasPaymentInfo ? (
            <>
              {link.payment_alias && (
                <p className="text-ink-2 text-sm">
                  Transferí al alias{" "}
                  <span className="num bg-paper rounded-key px-1.5 py-0.5 font-medium select-all">
                    {link.payment_alias}
                  </span>
                  .
                </p>
              )}
              {link.payment_link && (
                <a
                  href={link.payment_link}
                  target="_blank"
                  rel="noreferrer"
                  className={cn(buttonVariants({ variant: "secondary" }), "w-full")}
                >
                  Pagar con MercadoPago
                </a>
              )}
              <p className="text-ink-3 text-sm">
                Cuando pagues, avisale a {teacher}: lo registra y se actualiza tu cuenta.
              </p>
            </>
          ) : (
            <p className="text-ink-2 text-sm">
              Preguntale a {teacher} cómo prefiere que le pagues.
            </p>
          )}
        </div>
      )}
    </section>
  );
}

function PastLesson({ row, timeZone }: { row: LessonRow; timeZone: string }) {
  const { lesson, attendee } = row;
  const cancelled = lesson.status === "cancelled";
  const attendance = attendee.attendance as Attendance | null;
  return (
    <li className="flex items-center justify-between gap-3">
      <span className={cn("text-sm", cancelled && "text-ink-3 line-through")}>
        {lessonWhen(row, timeZone)}
      </span>
      {cancelled ? (
        <StatusChip status="pending" cross>
          Cancelada
        </StatusChip>
      ) : attendance ? (
        <StatusChip {...ATTENDANCE_STATUS[attendance]}>{ATTENDANCE_LABELS[attendance]}</StatusChip>
      ) : null}
    </li>
  );
}

function PaymentLine({ payment }: { payment: PaymentRow }) {
  return (
    <li className="flex items-baseline justify-between gap-3 text-sm">
      <span>
        {dayLabel(payment.paid_on, { weekday: undefined })} ·{" "}
        <span className="text-ink-3">{methodLabel(payment.method)}</span>
      </span>
      <span className="num font-medium">{formatARS(payment.amount)}</span>
    </li>
  );
}

// Lo que ya pasó con este profe: las últimas clases y los pagos que registró.
function History({ space }: { space: PortalSpace }) {
  const { lessons, payments, link } = space;
  if (lessons.past.length === 0 && payments.length === 0) return null;

  return (
    <section className="space-y-3">
      <SectionTitle>Historial</SectionTitle>
      <div className="bg-card rounded-card space-y-5 border p-4">
        {lessons.past.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-ink-3 text-sm">Clases anteriores</h3>
            <ul className="space-y-3">
              {lessons.past.map((row) => (
                <PastLesson key={row.lesson.id} row={row} timeZone={link.timezone} />
              ))}
            </ul>
          </div>
        )}
        {payments.length > 0 && (
          <div className={cn("space-y-3", lessons.past.length > 0 && "border-t pt-5")}>
            <h3 className="text-ink-3 text-sm">Pagos</h3>
            <ul className="space-y-3">
              {payments.slice(0, 10).map((payment) => (
                <PaymentLine key={payment.id} payment={payment} />
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}

// Todo lo de un profe, en una columna: lo próximo primero, después la cuenta y el historial.
export function PortalSpaceView({
  space,
  showHeader,
}: {
  space: PortalSpace;
  showHeader: boolean;
}) {
  const { link, detail, area, lessons } = space;
  return (
    <div className="space-y-8">
      {showHeader && (
        <header className="space-y-1">
          <h2 className="title-section">{link.teacher_name}</h2>
          {detail && <AreaTag area={area}>{detail}</AreaTag>}
        </header>
      )}
      <Upcoming rows={lessons.upcoming} timeZone={link.timezone} />
      <Account space={space} />
      <History space={space} />
    </div>
  );
}
