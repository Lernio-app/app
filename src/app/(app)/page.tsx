import { Suspense } from "react";
import { EmptyState, PageContainer } from "@/components/page-header";
import { formatDate } from "@/lib/format";
import { requireWorkspace } from "@/lib/workspace";

export const metadata = { title: "Inicio" };

async function Greeting() {
  const { profile, org } = await requireWorkspace();
  const today = formatDate(
    new Date(),
    { weekday: "long", day: "numeric", month: "long" },
    org.timezone,
  );
  const firstName = profile.display_name.split(" ")[0];

  return (
    <header className="space-y-1">
      <p className="text-muted-foreground text-sm first-letter:uppercase">{today}</p>
      <h1 className="text-2xl md:text-3xl">Buenas, {firstName}</h1>
    </header>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg">{title}</h2>
      {children}
    </section>
  );
}

export default function InicioPage() {
  return (
    <PageContainer>
      <Suspense fallback={<div className="h-16" aria-hidden />}>
        <Greeting />
      </Suspense>

      <Section title="Clases de hoy">
        <EmptyState title="No hay clases para hoy">
          Cuando cargues tu agenda, vas a ver acá lo que tenés que dar y los recordatorios para
          mandar.
        </EmptyState>
      </Section>
      <Section title="Para cobrar">
        <EmptyState title="Nadie te debe nada todavía">
          Cuando haya cobros pendientes, los ves acá con el monto y desde cuándo.
        </EmptyState>
      </Section>
      <Section title="Para corregir">
        <EmptyState title="Nada para corregir" />
      </Section>
    </PageContainer>
  );
}
