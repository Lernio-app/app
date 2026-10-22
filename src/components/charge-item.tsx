import { CobradoButton } from "@/app/(app)/cobros/cobrado-button";
import { voidCharge } from "@/app/(app)/cobros/actions";
import { ConfirmForm } from "@/components/confirm-form";
import { chargeLabel, chargeState, dueLabel, type ChargeRow } from "@/lib/billing";
import { formatARS } from "@/lib/format";
import { cn } from "@/lib/utils";

// Un cargo en las listas: qué es, cuándo vence, cuánto falta y «Cobrado». Los cargos de una clase no
// se anulan acá: se corrigen en la asistencia de esa clase.
export function ChargeItem({
  charge,
  today,
  actions = true,
}: {
  charge: ChargeRow;
  today: string;
  actions?: boolean;
}) {
  const state = chargeState(charge, today);
  const partial = charge.paid > 0 && charge.remaining > 0;

  return (
    <div className="bg-card space-y-3 rounded-xl border p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium">{chargeLabel(charge)}</p>
          <p
            className={cn(
              "text-sm",
              state === "overdue" || state === "due" ? "text-status-owed" : "text-muted-foreground",
              state === "paid" && "text-status-ok",
            )}
          >
            {state === "paid" ? "Cobrado" : dueLabel(charge.due_on, today)}
          </p>
        </div>
        <div className="text-right">
          <p className="tabular font-semibold">
            {formatARS(state === "paid" ? charge.amount : charge.remaining)}
          </p>
          {partial && (
            <p className="text-muted-foreground tabular text-xs">
              Pagó {formatARS(charge.paid)} de {formatARS(charge.amount)}
            </p>
          )}
        </div>
      </div>

      {actions && state !== "paid" && (
        <div className="flex flex-wrap items-center justify-end gap-2">
          {charge.source !== "lesson" && (
            <ConfirmForm
              action={voidCharge}
              fields={{ chargeId: charge.id }}
              message="¿Anular este cargo? Lo que ya se haya pagado queda como saldo a favor."
              label="Anular"
            />
          )}
          <CobradoButton chargeId={charge.id} today={today} />
        </div>
      )}
    </div>
  );
}
