import { LegalDocument } from "@/components/ui/legal-document";
import { PageContainer } from "@/components/ui/page-header";
import { TERMS } from "@/content/legal";

export const metadata = { title: "Términos y condiciones" };

export default function TerminosPage() {
  return (
    <PageContainer>
      <LegalDocument document={TERMS} />
    </PageContainer>
  );
}
