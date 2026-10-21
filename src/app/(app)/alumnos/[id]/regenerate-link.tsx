"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { regenerateLink, type LinkState } from "../actions";
import { LinkShare } from "../link-share";

export function RegenerateLink({ studentId }: { studentId: string }) {
  const [state, action, pending] = useActionState<LinkState, FormData>(regenerateLink, {});

  return (
    <section className="space-y-3">
      <h2 className="text-lg">Link del alumno</h2>
      {state.share ? (
        <LinkShare share={state.share} />
      ) : (
        <div className="bg-card space-y-3 rounded-xl border p-4">
          <p className="text-muted-foreground text-sm">
            Por seguridad el link no se puede volver a ver. Si necesitás mandárselo de nuevo, generá
            uno nuevo: el anterior deja de funcionar.
          </p>
          <form action={action}>
            <input type="hidden" name="studentId" value={studentId} />
            <Button type="submit" variant="outline" size="lg" className="h-11" disabled={pending}>
              {pending ? "Generando…" : "Nuevo link"}
            </Button>
          </form>
          {state.message && (
            <p role="alert" className="text-status-error text-sm">
              {state.message}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
