"use client";

import { useActionState } from "react";
import { LegalCheck } from "@/components/app/legal-check";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/field";
import { activateAccount } from "./actions";

export function ActivateForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(activateAccount, {});

  return (
    <form action={action} className="space-y-5" noValidate>
      <input type="hidden" name="token" value={token} />
      <LegalCheck error={state.fieldErrors?.legal} />
      {state.message && <FormError>{state.message}</FormError>}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Activando…" : "Activar mi cuenta"}
      </Button>
    </form>
  );
}
