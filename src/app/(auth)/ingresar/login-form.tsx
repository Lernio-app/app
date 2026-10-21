"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sendMagicLink, signInWithGoogle } from "./actions";

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
      <div role="status" className="bg-card space-y-2 rounded-xl border p-5">
        <h2 className="text-lg">Revisá tu email</h2>
        <p className="text-muted-foreground">
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
            className="h-11"
          />
          <p id="email-error" role="alert" className="text-status-error min-h-5 text-sm">
            {state.fieldErrors?.email}
          </p>
        </div>
        {error && !state.fieldErrors && (
          <p role="alert" className="text-status-error text-sm">
            {error}
          </p>
        )}
        <Button type="submit" size="lg" className="h-11 w-full" disabled={pending}>
          {pending ? "Mandando…" : "Mandame el link"}
        </Button>
      </form>

      {googleEnabled && (
        <form action={signInWithGoogle}>
          <Button type="submit" variant="outline" size="lg" className="h-11 w-full">
            Continuar con Google
          </Button>
        </form>
      )}
    </div>
  );
}
