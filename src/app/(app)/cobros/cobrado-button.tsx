"use client";

import { useActionState, useState } from "react";
import { Field, FormError } from "@/components/ui/field";
import { MethodPicker } from "@/components/app/method-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { markPaid } from "./actions";

// «Cobrado»: un toque abre el medio y la fecha (por defecto, transferencia y hoy) y otro lo confirma.
export function CobradoButton({ chargeId, today }: { chargeId: string; today: string }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(markPaid, {});

  if (!open) {
    return (
      <Button type="button" className="px-6" onClick={() => setOpen(true)}>
        Cobrado
      </Button>
    );
  }

  return (
    <form action={action} className="bg-paper rounded-card w-full space-y-4 border p-4" noValidate>
      <input type="hidden" name="chargeId" value={chargeId} />
      <MethodPicker />
      <Field id={`paidOn-${chargeId}`} label="Fecha del cobro" error={state.fieldErrors?.paidOn}>
        <Input id={`paidOn-${chargeId}`} name="paidOn" type="date" defaultValue={today} required />
      </Field>
      {state.fieldErrors?.method && <FormError>{state.fieldErrors.method}</FormError>}
      {state.message && <FormError>{state.message}</FormError>}
      <div className="flex gap-2">
        <Button type="submit" className="flex-1" disabled={pending}>
          {pending ? "Guardando…" : "Confirmar cobro"}
        </Button>
        <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
