"use client";

import { useActionState, useState } from "react";
import { Field } from "@/components/field";
import { MethodPicker } from "@/components/method-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { markPaid } from "./actions";

// «Cobrado»: un toque abre el medio y la fecha (por defecto, transferencia y hoy) y otro lo confirma.
export function CobradoButton({ chargeId, today }: { chargeId: string; today: string }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(markPaid, {});

  if (!open) {
    return (
      <Button type="button" size="lg" className="h-11 px-6" onClick={() => setOpen(true)}>
        Cobrado
      </Button>
    );
  }

  return (
    <form action={action} className="bg-muted/50 w-full space-y-4 rounded-xl border p-4" noValidate>
      <input type="hidden" name="chargeId" value={chargeId} />
      <MethodPicker />
      <Field id={`paidOn-${chargeId}`} label="Fecha del cobro" error={state.fieldErrors?.paidOn}>
        <Input
          id={`paidOn-${chargeId}`}
          name="paidOn"
          type="date"
          defaultValue={today}
          required
          className="h-11"
        />
      </Field>
      {state.fieldErrors?.method && (
        <p role="alert" className="text-status-error text-sm">
          {state.fieldErrors.method}
        </p>
      )}
      {state.message && (
        <p role="alert" className="text-status-error text-sm">
          {state.message}
        </p>
      )}
      <div className="flex gap-2">
        <Button type="submit" size="lg" className="h-11 flex-1" disabled={pending}>
          {pending ? "Guardando…" : "Confirmar cobro"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="h-11"
          onClick={() => setOpen(false)}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
