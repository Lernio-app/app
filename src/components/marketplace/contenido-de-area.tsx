import Link from "next/link";
import { Plus } from "lucide-react";
import { AreaTag } from "@/components/ui/area";
import { COLOR_DEL_AREA, slugify, type AreaSlug } from "@/lib/marketplace";
import { Contenedor } from "./contenedor";

// Presentación y preguntas frecuentes de una página de área o de materia (§12.2). Las edita el
// panel interno (F15); mientras tanto salen de los datos de ejemplo. Van debajo de los resultados.
export function ContenidoDeArea({
  area,
  presentacion,
  preguntas,
  materias,
  actual,
}: {
  area: AreaSlug;
  presentacion: string;
  preguntas: { pregunta: string; respuesta: string }[];
  // Materias del área, como links a su página.
  materias: string[];
  actual?: string;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: preguntas.map((item) => ({
      "@type": "Question",
      name: item.pregunta,
      acceptedAnswer: { "@type": "Answer", text: item.respuesta },
    })),
  };
  return (
    <section aria-labelledby="sobre-titulo" className="border-line border-t bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Contenedor className="grid gap-x-16 gap-y-10 py-[clamp(3rem,7vw,4.5rem)] lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        <div className="space-y-6">
          <h2 id="sobre-titulo" className="title-h3">
            Sobre estas clases
          </h2>
          <p className="text-ink-2 max-w-[62ch] text-base leading-relaxed">{presentacion}</p>
          <div className="space-y-3">
            <p className="text-sm font-semibold">Materias</p>
            <ul className="flex flex-wrap gap-2">
              {materias.map((materia) => (
                <li key={materia}>
                  <Link
                    href={`/clases/${area}/${slugify(materia)}`}
                    aria-current={actual === slugify(materia) ? "page" : undefined}
                    className="flex min-h-11 items-center"
                  >
                    <MateriaTag area={area}>{materia}</MateriaTag>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="space-y-4">
          <h2 className="title-h3">Preguntas</h2>
          <div className="border-line flex flex-col border-t">
            {preguntas.map((item) => (
              <details key={item.pregunta} className="group border-line border-b">
                <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 text-base font-semibold [&::-webkit-details-marker]:hidden">
                  {item.pregunta}
                  <span
                    aria-hidden
                    className="border-border-control text-ink-3 flex size-7 shrink-0 items-center justify-center rounded-full border transition-transform group-open:rotate-45"
                  >
                    <Plus className="size-4" strokeWidth={2} />
                  </span>
                </summary>
                <p className="text-ink-2 max-w-[62ch] pb-5 text-base leading-relaxed">
                  {item.respuesta}
                </p>
              </details>
            ))}
          </div>
        </div>
      </Contenedor>
    </section>
  );
}

function MateriaTag({ area, children }: { area: AreaSlug; children: React.ReactNode }) {
  return <AreaTag area={COLOR_DEL_AREA[area]}>{children}</AreaTag>;
}
