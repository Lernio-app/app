"use client";

import { useActionState } from "react";
import { LegalCheck } from "@/components/app/legal-check";
import { Button } from "@/components/ui/button";
import { Field, FormError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { submitKeepingForm } from "@/lib/forms";
import { activateAccount } from "./actions";

// El alumno confirma cómo se llama y su WhatsApp antes de activar: quedan en su cuenta.
export function ActivateForm({
  token,
  defaults,
}: {
  token: string;
  defaults: { fullName: string; phone: string };
}) {
  const [state, action, pending] = useActionState(activateAccount, {});
  const errors = state.fieldErrors ?? {};

  return (
    <form onSubmit={submitKeepingForm(action)} className="space-y-5" noValidate>
      <input type="hidden" name="token" value={token} />
      <Field id="fullName" label="Tu nombre" error={errors.fullName}>
        <Input
          id="fullName"
          name="fullName"
          defaultValue={defaults.fullName}
          autoComplete="name"
          required
        />
      </Field>
      <Field
        id="phone"
        label="Tu WhatsApp"
        hint="Opcional. Tu profe no lo usa para vincularte."
        error={errors.phone}
      >
        <Input
          id="phone"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          defaultValue={defaults.phone}
          placeholder="11 5555 1234"
        />
      </Field>
      <LegalCheck error={state.fieldErrors?.legal} />
      {state.message && <FormError>{state.message}</FormError>}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Activando…" : "Activar mi cuenta"}
      </Button>
    </form>
  );
}
