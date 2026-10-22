import { Suspense } from "react";
import Link from "next/link";
import { ChargeItem } from "@/components/charge-item";
import { ConfirmForm } from "@/components/confirm-form";
import { EmptyState, PageContainer, PageHeader } from "@/components/page-header";
import { buttonVariants } from "@/components/ui/button";
import {
  collected,
  debtNoticeUrl,
  debtors,
  methodLabel,
  totals,
  type ChargeRow,
} from "@/lib/billing";
import {
  generateMonthlyCharges,
  listBillingStudents,
  listOpenCharges,
  listPayments,
} from "@/lib/billing-data";
import { dayLabel, localDate } from "@/lib/dates";
import { formatARS } from "@/lib/format";
import { cn } from "@/lib/utils";
import { requireWorkspace } from "@/lib/workspace";
import { voidPayment } from "./actions";

export const metadata = { title: "Cobros" };

function Stat({
  label,
  value,
  note,
  tone,
}: {
  label: string;
  value: number;
  note?: string;
  tone?: "owed";
}) {
  return (
    <div className="bg-card rounded-xl border p-4">
      <p className="text-muted-foreground text-sm">{label}</p>
      <p
        className={cn(
          "tabular text-2xl font-bold",
          tone === "owed" && value > 0 && "text-status-owed",
        )}
      >
        {formatARS(value)}
      </p>
      {note && <p className="text-muted-foreground tabular text-sm">{note}</p>}
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="space-y-1">
        <h2 className="text-lg">{title}</h2>
        {description && <p className="text-muted-foreground text-sm">{description}</p>}
      </div>
      {children}
    </section>
  );
}

function monthName(month: string, thisYear: string) {
  const sameYear = month.startsWith(thisYear);
  return dayLabel(`${month}-01`, {
    weekday: undefined,
    day: undefined,
    ...(sameYear ? {} : { year: "numeric" }),
  });
}

async function Cobros() {
  const { org, profile } = await requireWorkspace();
  const tz = org.timezone;
  const today = localDate(new Date(), tz);

  await generateMonthlyCharges();
  const [charges, payments, students] = await Promise.all([
    listOpenCharges(),
    listPayments(),
    listBillingStudents(),
  ]);

  const sums = totals(charges, today);
  const stats = collected(payments, today);
  const owing = debtors(charges, today);
  const upcoming: ChargeRow[] = charges.filter((charge) => charge.due_on > today);
  const nameOf = (id: string) => students.get(id)?.full_name ?? "Alumno";
  const recent = payments.slice(0, 8);
  const thisYear = today.slice(0, 4);
  const maxMonth = Math.max(...stats.byMonth.map((entry) => entry.amount), 1);

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Stat
            label="Cobrado"
            value={stats.total}
            note={`${formatARS(stats.thisMonth)} este mes`}
          />
        </div>
        <Stat label="Por cobrar" value={sums.pending} />
        <Stat label="Vencido" value={sums.overdue} tone="owed" />
      </div>

      <div className="flex flex-wrap gap-2">
        <Link href="/cobros/pago" className={cn(buttonVariants({ size: "lg" }), "h-11")}>
          Registrar pago
        </Link>
        <Link
          href="/cobros/nuevo"
          className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-11")}
        >
          Nuevo cargo
        </Link>
        <Link
          href="/cobros/aumento"
          className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-11")}
        >
          Aumentar precios
        </Link>
      </div>

      <Section
        title="Quién debe"
        description="Lo que ya venció o vence hoy, con el más antiguo primero."
      >
        {owing.length === 0 ? (
          <EmptyState title="Nadie te debe nada">Estás al día con todos tus alumnos.</EmptyState>
        ) : (
          <ul className="space-y-3">
            {owing.map((debtor) => {
              const student = students.get(debtor.studentId);
              return (
                <li key={debtor.studentId} className="space-y-3">
                  <div className="bg-card space-y-3 rounded-xl border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link
                          href={`/alumnos/${debtor.studentId}`}
                          className="font-medium hover:underline"
                        >
                          {nameOf(debtor.studentId)}
                        </Link>
                        <p className="text-status-owed text-sm">
                          Debe desde el {dayLabel(debtor.since, { weekday: undefined })}
                        </p>
                      </div>
                      <p className="tabular text-status-owed text-lg font-bold">
                        {formatARS(debtor.owed)}
                      </p>
                    </div>
                    {student && (
                      <a
                        href={debtNoticeUrl({
                          student,
                          owed: debtor.owed,
                          since: debtor.since,
                          teacherName: profile.display_name,
                          paymentAlias: org.payment_alias,
                          paymentLink: org.payment_link,
                        })}
                        target="_blank"
                        rel="noreferrer"
                        className={cn(
                          buttonVariants({ variant: "outline", size: "lg" }),
                          "h-11 w-full",
                        )}
                      >
                        Avisar por WhatsApp
                      </a>
                    )}
                  </div>
                  <details className="group">
                    <summary className="text-muted-foreground flex min-h-11 cursor-pointer list-none items-center gap-2 px-1 text-sm [&::-webkit-details-marker]:hidden">
                      <span aria-hidden className="transition-transform group-open:rotate-90">
                        ›
                      </span>
                      {debtor.charges.length === 1
                        ? "Ver el cargo"
                        : `Ver los ${debtor.charges.length} cargos`}
                    </summary>
                    <ul className="space-y-2 pt-1">
                      {debtor.charges.map((charge) => (
                        <li key={charge.id}>
                          <ChargeItem charge={charge} today={today} />
                        </li>
                      ))}
                    </ul>
                  </details>
                </li>
              );
            })}
          </ul>
        )}
      </Section>

      <Section
        title="Cuentas a cobrar"
        description="Cargos con vencimiento futuro. Pasan a vencidos cuando llega la fecha."
      >
        {upcoming.length === 0 ? (
          <EmptyState title="No hay cuentas a cobrar">
            Cargá un cargo con fecha de vencimiento desde «Nuevo cargo».
          </EmptyState>
        ) : (
          <ul className="space-y-2">
            {upcoming.map((charge) => (
              <li key={charge.id} className="space-y-1">
                <Link
                  href={`/alumnos/${charge.student_id}`}
                  className="text-muted-foreground px-1 text-sm hover:underline"
                >
                  {nameOf(charge.student_id)}
                </Link>
                <ChargeItem charge={charge} today={today} />
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Cobrado por mes">
        <ul className="bg-card divide-y rounded-xl border">
          {[...stats.byMonth].reverse().map((entry) => (
            <li key={entry.month} className="space-y-2 p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="first-letter:uppercase">{monthName(entry.month, thisYear)}</span>
                <span className="tabular font-medium">{formatARS(entry.amount)}</span>
              </div>
              <div className="bg-muted h-1.5 overflow-hidden rounded-full" aria-hidden>
                <div
                  className="bg-primary h-full rounded-full"
                  style={{ width: `${Math.round((entry.amount / maxMonth) * 100)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Cobrado por alumno">
        {stats.byStudent.length === 0 ? (
          <EmptyState title="Todavía no registraste cobros" />
        ) : (
          <ul className="bg-card divide-y rounded-xl border">
            {stats.byStudent.map((entry) => (
              <li key={entry.studentId} className="flex items-center justify-between gap-3 p-4">
                <Link href={`/alumnos/${entry.studentId}`} className="hover:underline">
                  {nameOf(entry.studentId)}
                </Link>
                <span className="tabular font-medium">{formatARS(entry.amount)}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section
        title="Últimos pagos"
        description="Si te equivocaste, deshacé el pago: queda anulado y el cargo vuelve a figurar pendiente."
      >
        {recent.length === 0 ? (
          <EmptyState title="Todavía no hay pagos" />
        ) : (
          <ul className="space-y-2">
            {recent.map((payment) => {
              const voided = payment.voided_at !== null;
              return (
                <li
                  key={payment.id}
                  className="bg-card flex items-center justify-between gap-3 rounded-xl border p-4"
                >
                  <div className={cn("min-w-0", voided && "text-muted-foreground")}>
                    <p className={cn("truncate font-medium", voided && "line-through")}>
                      {nameOf(payment.student_id)}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      {methodLabel(payment.method)} ·{" "}
                      {dayLabel(payment.paid_on, { weekday: undefined })}
                      {voided && " · Anulado"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <span
                      className={cn(
                        "tabular font-semibold",
                        voided && "text-muted-foreground line-through",
                      )}
                    >
                      {formatARS(payment.amount)}
                    </span>
                    {!voided && (
                      <ConfirmForm
                        action={voidPayment}
                        fields={{ paymentId: payment.id }}
                        message="¿Deshacer este pago? Queda anulado y el cargo vuelve a figurar pendiente."
                        label="Deshacer"
                      />
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Section>
    </>
  );
}

export default function CobrosPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Cobros"
        description="Quién te debe, cuánto y desde cuándo, y lo que ya cobraste."
      />
      <Suspense fallback={<div className="h-96" aria-hidden />}>
        <Cobros />
      </Suspense>
    </PageContainer>
  );
}
