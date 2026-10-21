import { EmptyState, PageContainer, PageHeader } from "@/components/page-header";

export const metadata = { title: "Alumnos" };

export default function AlumnosPage() {
  return (
    <PageContainer>
      <PageHeader title="Alumnos" description="Todos tus alumnos, con su estado y su saldo." />
      <EmptyState title="Todavía no cargaste alumnos">
        Pronto vas a poder cargarlos a todos y mandarle a cada uno su link por WhatsApp.
      </EmptyState>
    </PageContainer>
  );
}
