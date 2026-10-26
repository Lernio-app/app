"use client";

import { useActionState } from "react";
import { LegalCheck } from "@/components/app/legal-check";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/field";
import { acceptTerms } from "./actions";

export function AcceptForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(acceptTerms, {});

  return (
    <form action={action} className="space-y-5" noValidate>
      <input type="hidden" name="next" value={next} />
      <LegalCheck error={state.fieldErrors?.legal} />
      {state.message && <FormError>{state.message}</FormError>}
      <Button type="submit" className="w-full sm:w-auto sm:px-8" disabled={pending}>
        {pending ? "Guardando…" : "Aceptar y seguir"}
      </Button>
    </form>
  );
}
