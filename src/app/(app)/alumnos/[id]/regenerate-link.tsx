"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { regenerateLink, type LinkState } from "../actions";
import { LinkShare } from "../link-share";
import { FormError } from "@/components/ui/field";
import { SectionTitle } from "@/components/ui/page-header";

export function RegenerateLink({ studentId }: { studentId: string }) {
  const [state, action, pending] = useActionState<LinkState, FormData>(regenerateLink, {});

  return (
    <section className="space-y-3">
      <SectionTitle>Link del alumno</SectionTitle>
      {state.share ? (
        <LinkShare share={state.share} />
      ) : (
        <div className="bg-card rounded-card space-y-3 border p-4">
          <p className="text-ink-3 text-sm">
            Por seguridad el link no se puede volver a ver. Si necesitás mandárselo de nuevo, generá
            uno nuevo: el anterior deja de funcionar.
          </p>
          <form action={action}>
            <input type="hidden" name="studentId" value={studentId} />
            <Button type="submit" variant="secondary" disabled={pending}>
              {pending ? "Generando…" : "Nuevo link"}
            </Button>
          </form>
          {state.message && <FormError>{state.message}</FormError>}
        </div>
      )}
    </section>
  );
}
