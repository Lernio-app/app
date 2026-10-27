import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Contenedor } from "@/components/marketplace/contenedor";
import { AreaTag } from "@/components/ui/area";
import { ENTRADAS } from "@/content/marketplace-ejemplo";
import { formatDate } from "@/lib/format";
import { COLOR_DEL_AREA } from "@/lib/marketplace";

export const metadata: Metadata = {
  title: "Blog",
  description: "Guías para elegir profe, preparar un examen y sacarle provecho a las clases.",
};

// Blog (F15): las entradas llevan área y materia y las edita el panel interno. Datos de ejemplo.
export default function BlogPage() {
  const entradas = [...ENTRADAS].sort((a, b) => b.fecha.localeCompare(a.fecha));
  return (
    <main>
      <section className="bg-cuadricula border-line border-b">
        <Contenedor className="space-y-3 py-[clamp(2rem,5vw,3.5rem)]">
          <h1 className="title-listing text-ink">Blog</h1>
          <p className="text-ink-2 max-w-[52ch] text-lg">
            Guías para elegir profe, preparar un examen y sacarle provecho a las clases.
          </p>
        </Contenedor>
      </section>
      <Contenedor className="py-10">
        {entradas.length === 0 ? (
          <p className="text-ink-2">Todavía no hay entradas.</p>
        ) : (
          <ul className="border-line divide-line-soft divide-y border-y">
            {entradas.map((entrada) => (
              <li key={entrada.slug}>
                <Link
                  href={`/blog/${entrada.slug}`}
                  className="group hover:bg-paper -mx-3 flex flex-col gap-3 rounded-control px-3 py-6 sm:flex-row sm:items-center sm:justify-between sm:gap-8"
                >
                  <div className="max-w-[62ch] space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <AreaTag area={COLOR_DEL_AREA[entrada.area]}>{entrada.materia}</AreaTag>
                      <time dateTime={entrada.fecha} className="text-ink-3 num text-sm">
                        {formatDate(entrada.fecha, { day: "numeric", month: "short", year: "numeric" })}
                      </time>
                    </div>
                    <h2 className="title-h3 text-balance">{entrada.titulo}</h2>
                    <p className="text-ink-2 text-base">{entrada.bajada}</p>
                  </div>
                  <ArrowRight
                    className="text-ink-2 hidden size-5 shrink-0 transition-transform group-hover:translate-x-0.5 sm:block"
                    strokeWidth={1.8}
                    aria-hidden
                  />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Contenedor>
    </main>
  );
}
