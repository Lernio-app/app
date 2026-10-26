import { PageHeader, SectionTitle } from "@/components/ui/page-header";
import type { LegalDocument as LegalDocumentData } from "@/content/legal";
import { LEGAL_VERSION } from "@/lib/legal";

// Un texto legal para leer: título, aviso de borrador, secciones con párrafos y listas.
export function LegalDocument({ document }: { document: LegalDocumentData }) {
  return (
    <>
      <PageHeader title={document.title} label={`Versión ${LEGAL_VERSION}`}>
        <p className="text-ink-2 text-sm">{document.notice}</p>
      </PageHeader>
      {document.sections.map((section) => (
        <section key={section.heading} className="space-y-3">
          <SectionTitle>{section.heading}</SectionTitle>
          {section.paragraphs?.map((paragraph) => (
            <p key={paragraph} className="text-ink-2">
              {paragraph}
            </p>
          ))}
          {section.items && (
            <ul className="text-ink-2 list-disc space-y-2 pl-5">
              {section.items.map((item) => (
                <li key={item.text}>
                  {item.lead && <strong className="text-ink font-semibold">{item.lead} </strong>}
                  {item.text}
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </>
  );
}
