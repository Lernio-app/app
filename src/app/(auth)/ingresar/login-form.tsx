"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sendMagicLink, signInWithGoogle } from "./actions";
import { FormError } from "@/components/ui/field";
import { SectionTitle } from "@/components/ui/page-header";

export function LoginForm({
  initialError,
  googleEnabled,
}: {
  initialError: string | null;
  googleEnabled: boolean;
}) {
  const [state, action, pending] = useActionState(sendMagicLink, {});

  if (state.ok) {
    return (
      <div role="status" className="bg-card rounded-card space-y-2 border p-5">
        <SectionTitle>Revisá tu email</SectionTitle>
        <p className="text-ink-3">
          Te mandamos un link a <strong className="text-foreground">{state.message}</strong>. Tocalo
          desde este mismo dispositivo para entrar.
        </p>
      </div>
    );
  }

  const error = state.message ?? initialError;

  return (
    <div className="space-y-6">
      <form action={action} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="email">Tu email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="vos@ejemplo.com"
            required
            aria-invalid={Boolean(state.fieldErrors?.email)}
            aria-describedby="email-error"
          />
          <FormError id="email-error" className="min-h-5">
            {state.fieldErrors?.email}
          </FormError>
        </div>
        {error && !state.fieldErrors && <FormError>{error}</FormError>}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Mandando…" : "Mandame el link"}
        </Button>
      </form>

      {googleEnabled && (
        <form action={signInWithGoogle}>
          <Button type="submit" variant="secondary" className="w-full">
            Continuar con Google
          </Button>
        </form>
      )}
    </div>
  );
}
