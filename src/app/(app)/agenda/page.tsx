import { EmptyState, PageContainer, PageHeader } from "@/components/page-header";

export const metadata = { title: "Agenda" };

export default function AgendaPage() {
  return (
    <PageContainer>
      <PageHeader title="Agenda" description="Tu semana de clases." />
      <EmptyState title="Todavía no hay clases">
        Pronto vas a poder cargar clases sueltas y fijas, y marcar la asistencia con un toque.
      </EmptyState>
    </PageContainer>
  );
}
