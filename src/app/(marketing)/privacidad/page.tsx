import { LegalDocument } from "@/components/ui/legal-document";
import { PageContainer } from "@/components/ui/page-header";
import { PRIVACY } from "@/content/legal";

export const metadata = { title: "Política de privacidad" };

export default function PrivacidadPage() {
  return (
    <PageContainer>
      <LegalDocument document={PRIVACY} />
    </PageContainer>
  );
}
