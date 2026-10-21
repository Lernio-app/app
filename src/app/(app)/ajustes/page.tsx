import { Suspense } from "react";
import { PageContainer, PageHeader } from "@/components/page-header";
import { WorkspaceForm } from "@/components/workspace-form";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth-actions";
import { requireWorkspace } from "@/lib/workspace";
import { saveSettings } from "./actions";

export const metadata = { title: "Ajustes" };

async function Settings() {
  const { org, profile, email } = await requireWorkspace();

  return (
    <>
      <WorkspaceForm
        action={saveSettings}
        submitLabel="Guardar cambios"
        pendingLabel="Guardando…"
        defaults={{
          displayName: profile.display_name,
          phone: profile.phone ?? "",
          subjects: profile.subjects,
          levels: profile.levels,
          paymentAlias: org.payment_alias ?? "",
          paymentLink: org.payment_link ?? "",
          lateCancelHours: org.late_cancel_hours,
        }}
      />
      <section className="space-y-3 border-t pt-6">
        <h2 className="text-lg">Tu cuenta</h2>
        {email && <p className="text-muted-foreground text-sm">Ingresaste con {email}.</p>}
        <form action={signOut}>
          <Button type="submit" variant="outline" className="h-11">
            Cerrar sesión
          </Button>
        </form>
      </section>
    </>
  );
}

export default function AjustesPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Ajustes"
        description="Tu perfil, cómo te pagan y tu regla de cancelación."
      />
      <Suspense fallback={<div className="h-96" aria-hidden />}>
        <Settings />
      </Suspense>
    </PageContainer>
  );
}
