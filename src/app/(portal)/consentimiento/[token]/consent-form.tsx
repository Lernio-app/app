"use client";

import { useActionState } from "react";
import { LegalCheck } from "@/components/app/legal-check";
import { Button } from "@/components/ui/button";
import { Field, FormError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { giveConsent } from "./actions";

export function ConsentForm({ token, studentName }: { token: string; studentName: string }) {
  const [state, action, pending] = useActionState(giveConsent, {});
  const errors = state.fieldErrors ?? {};

  return (
    <form action={action} className="space-y-5" noValidate>
      <input type="hidden" name="token" value={token} />
      <Field
        id="minorEmail"
        label={`Email de ${studentName}`}
        hint="Opcional. Sirve para mandarle la invitación por email."
        error={errors.minorEmail}
      >
        <Input
          id="minorEmail"
          name="minorEmail"
          type="email"
          inputMode="email"
          autoComplete="off"
        />
      </Field>
      <div className="space-y-2">
        <label className="bg-card rounded-control flex min-h-11 cursor-pointer items-start gap-3 border px-3 py-3 text-sm">
          <input type="checkbox" name="consent" className="accent-primary mt-0.5 size-4 shrink-0" />
          <span>
            Soy responsable de {studentName} y doy mi consentimiento para que tenga su propia cuenta
            de alumno en Lernio.
          </span>
        </label>
        {errors.consent && <FormError>{errors.consent}</FormError>}
      </div>
      <LegalCheck error={errors.legal} />
      {state.message && <FormError>{state.message}</FormError>}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Guardando…" : "Dar mi consentimiento"}
      </Button>
    </form>
  );
}
