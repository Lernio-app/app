import { Suspense } from "react";
import { EmptyState, PageContainer, PageHeader } from "@/components/ui/page-header";
import { firstName } from "@/lib/messages";
import { listMyLinks, requireStudent } from "@/lib/portal";

export const metadata = { title: "Tu cuenta" };

// Por ahora el portal solo muestra con quién tiene clases la cuenta; F4 suma tareas, exámenes,
// próximas clases, saldo e historial.
async function Portal() {
  const { profile } = await requireStudent();
  const links = (await listMyLinks()).filter((link) => !link.archived);

  return (
    <>
      <PageHeader title={`Hola, ${firstName(profile.display_name)}`} />
      {links.length === 0 ? (
        <EmptyState title="Todavía no tenés un profe en Lernio">
          Cuando un profe te invite, activás la invitación y lo ves acá.
        </EmptyState>
      ) : (
        <ul className="space-y-2">
          {links.map((link) => (
            <li key={link.student_id} className="bg-card rounded-card border p-4">
              <p className="font-medium">{link.teacher_name}</p>
              <p className="text-ink-3 text-sm">{link.org_name}</p>
            </li>
          ))}
        </ul>
      )}
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
