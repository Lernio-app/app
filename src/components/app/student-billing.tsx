import Link from "next/link";
import { ChargeItem } from "@/components/app/charge-item";
import { RecordMenu } from "@/components/app/record-menu";
import { buttonVariants } from "@/components/ui/button";
import { renewPackage } from "@/app/(app)/cobros/actions";
import { Button } from "@/components/ui/button";
import { StatusChip } from "@/components/ui/status-chip";
import { credit, debtNoticeUrl, debtors, totals } from "@/lib/billing";
import {
  generateMonthlyCharges,
  listBillingStudents,
  listPayments,
  listStudentCharges,
  packageBalances,
} from "@/lib/billing-data";
import { dayLabel } from "@/lib/dates";
import { formatARS } from "@/lib/format";
import { currentPlan, type StudentDetail } from "@/lib/students";
import { cn } from "@/lib/utils";
import { SectionTitle } from "@/components/ui/page-header";

// Cuándo se avisa que el paquete se acaba, en clases que quedan.
export const PACKAGE_WARNING = 2;

// La cuenta de un alumno en su ficha: cuánto debe y desde cuándo, su paquete, sus cargos y su saldo
// a favor, con «Cobrado» en cada cargo pendiente.
export async function StudentBilling({
  student,
  today,
  teacherName,
  paymentAlias,
  paymentLink,
}: {
  student: StudentDetail;
  today: string;
  teacherName: string;
  paymentAlias: string | null;
  paymentLink: string | null;
}) {
  await generateMonthlyCharges();
  const [charges, payments, balances, people] = await Promise.all([
    listStudentCharges(student.id),
    listPayments(student.id),
    packageBalances(),
    listBillingStudents(),
  ]);

  const owing = debtors(charges, today)[0];
  const sums = totals(charges, today);
  const free = credit(payments);
  const open = charges.filter((charge) => charge.remaining > 0).reverse();
  const settled = charges.filter((charge) => charge.remaining <= 0).slice(0, 5);

  const plan = currentPlan(student.price_plans);
  const left = balances.get(student.id);
  const showPackage = plan?.mode === "package" && left !== undefined;
  const person = people.get(student.id);

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <SectionTitle>Cobros</SectionTitle>
        <Link
          href={`/cobros/nuevo?alumno=${student.id}`}
          className="text-primary flex min-h-11 items-center text-sm font-medium"
        >
          + Cargo
        </Link>
      </div>

      <div className="bg-card rounded-card space-y-3 border p-4">
        {owing ? (
          <div>
            <p className="text-ink-3 text-sm">Debe</p>
            <p className="num-kpi text-debt">{formatARS(owing.owed)}</p>
            <p className="text-debt text-sm">
              Desde el {dayLabel(owing.since, { weekday: undefined })}
            </p>
          </div>
        ) : (
          <StatusChip status="ok">Al día</StatusChip>
        )}
        {sums.upcoming > 0 && (
          <p className="text-ink-3 num text-sm">
            A cobrar más adelante: {formatARS(sums.upcoming)}
          </p>
        )}
        {free > 0 && <p className="text-ok num text-sm">Saldo a favor: {formatARS(free)}</p>}
        {showPackage && (
          <div className="flex items-center justify-between gap-3 border-t pt-3">
            <p
              className={cn(
                "text-sm",
                left <= PACKAGE_WARNING ? "text-debt font-medium" : "text-ink-3",
              )}
            >
              {left <= 0
                ? "Se terminó el paquete"
                : `Quedan ${left} ${left === 1 ? "clase" : "clases"} del paquete`}
            </p>
            {left <= PACKAGE_WARNING && (
              <form action={renewPackage}>
                <input type="hidden" name="studentId" value={student.id} />
                <Button type="submit" variant="secondary">
                  Renovar paquete
                </Button>
              </form>
            )}
          </div>
        )}
        <RecordMenu studentId={student.id}>
          {owing && person && (
            <a
              href={debtNoticeUrl({
                student: person,
                owed: owing.owed,
                since: owing.since,
                teacherName,
                paymentAlias,
                paymentLink,
              })}
              target="_blank"
              rel="noreferrer"
              className={buttonVariants({ variant: "secondary" })}
            >
              Avisar por WhatsApp
            </a>
          )}
        </RecordMenu>
      </div>

      {open.length > 0 && (
        <ul className="space-y-2">
          {open.map((charge) => (
            <li key={charge.id}>
              <ChargeItem charge={charge} today={today} />
            </li>
          ))}
        </ul>
      )}

      {settled.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-ink-3 text-sm">Cobrados</h3>
          <ul className="space-y-2">
            {settled.map((charge) => (
              <li key={charge.id}>
                <ChargeItem charge={charge} today={today} actions={false} />
              </li>
            ))}
          </ul>
        </div>
      )}

      {charges.length === 0 && (
        <p className="text-ink-3 text-sm">
          Todavía no tiene cargos. Se generan solos con las clases y las mensualidades, o los cargás
          a mano.
        </p>
      )}
    </section>
  );
}
