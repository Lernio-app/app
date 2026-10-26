import { Suspense } from "react";
import Link from "next/link";
import { PageContainer, PageHeader, SectionTitle } from "@/components/ui/page-header";
import { WorkspaceForm } from "@/components/app/workspace-form";
import { Button, buttonVariants } from "@/components/ui/button";
import { signOut } from "@/lib/auth-actions";
import { getCatalog } from "@/lib/catalog-data";
import { getStudentProfile } from "@/lib/portal";
import { requireWorkspace } from "@/lib/workspace";
import { saveSettings } from "./actions";

export const metadata = { title: "Ajustes" };

async function Settings() {
  const { org, profile, email } = await requireWorkspace();
  const [catalog, studentProfile] = await Promise.all([getCatalog(), getStudentProfile()]);

  return (
    <>
      <WorkspaceForm
        action={saveSettings}
        catalog={catalog}
        submitLabel="Guardar cambios"
        pendingLabel="Guardando…"
        defaults={{
          displayName: profile.display_name,
          phone: profile.phone ?? "",
          subjectIds: profile.subject_ids,
          paymentAlias: org.payment_alias ?? "",
          paymentLink: org.payment_link ?? "",
          lateCancelHours: org.late_cancel_hours,
        }}
      />
      <section className="space-y-3 border-t pt-6">
        <SectionTitle>Tu cuenta</SectionTitle>
        {email && <p className="text-ink-3 text-sm">Ingresaste con {email}.</p>}
        {/* Quien también es alumno se mira como alumno con un toque (ADR-0004 #4). */}
        {studentProfile && (
          <Link href="/portal" className={buttonVariants({ variant: "secondary" })}>
            Ver mi cuenta de alumno
          </Link>
        )}
        <form action={signOut}>
          <Button type="submit" variant="secondary">
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
