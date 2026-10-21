import { EmptyState, PageContainer, PageHeader } from "@/components/page-header";

export const metadata = { title: "Cobros" };

export default function CobrosPage() {
  return (
    <PageContainer>
      <PageHeader title="Cobros" description="Quién te debe y cuánto, sin abrir una planilla." />
      <EmptyState title="Todavía no hay cobros">
        Pronto vas a poder ver los cargos, registrar pagos y mandar avisos de deuda.
      </EmptyState>
    </PageContainer>
  );
}
