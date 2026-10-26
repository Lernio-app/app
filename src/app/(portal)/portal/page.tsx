import { Suspense } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { EmptyState, PageContainer, PageHeader } from "@/components/ui/page-header";
import { signOut } from "@/lib/auth-actions";
import { firstName } from "@/lib/messages";
import { loadPortalSpaces, requireStudent } from "@/lib/portal";
import { cn } from "@/lib/utils";
import { getWorkspace } from "@/lib/workspace";
import { PortalSpaceView } from "./space";

export const metadata = { title: "Tu cuenta" };

// El portal del alumno: lo que tiene para hacer y su historial con cada profe. Hoy muestra las
// próximas clases, la cuenta con cómo pagar y el historial; tareas y exámenes llegan con F5 y F6.
async function Portal() {
  const { profile } = await requireStudent();
  const [spaces, workspace] = await Promise.all([loadPortalSpaces(), getWorkspace()]);

  return (
    <>
      <PageHeader
        title={`Hola, ${firstName(profile.display_name)}`}
        actions={
          // Quien también es profe vuelve a su espacio con un toque.
          workspace && (
            <Link href="/" className={buttonVariants({ variant: "secondary" })}>
              Mi espacio de profe
            </Link>
          )
        }
      />

      {spaces.length === 0 ? (
        <EmptyState title="Todavía no tenés un profe en Lernio">
          Cuando un profe te invite, activás la invitación y lo ves acá.
        </EmptyState>
      ) : (
        <div className="space-y-12">
          {spaces.map((space) => (
            <PortalSpaceView
              key={space.link.student_id}
              space={space}
              showHeader={spaces.length > 1}
            />
          ))}
        </div>
      )}

      <form action={signOut} className="border-t pt-6">
        <Button type="submit" variant="ghost" className={cn("text-ink-3")}>
          Cerrar sesión
        </Button>
      </form>
    </>
  );
}

export default function PortalPage() {
  return (
    <PageContainer>
      <Suspense fallback={<div className="h-48" aria-hidden />}>
        <Portal />
      </Suspense>
    </PageContainer>
  );
}
