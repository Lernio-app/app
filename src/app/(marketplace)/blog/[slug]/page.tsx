import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { Contenedor } from "@/components/marketplace/contenedor";
import { PublicacionCard } from "@/components/marketplace/publicacion-card";
import { AreaTag } from "@/components/ui/area";
import { ENTRADAS, PERFILES, PUBLICACIONES } from "@/content/marketplace-ejemplo";
import { formatDate } from "@/lib/format";
import { COLOR_DEL_AREA, slugify } from "@/lib/marketplace";

// Entrada del blog (F15): artículo con las clases relacionadas por materia. Datos de ejemplo.

export function generateStaticParams() {
  return ENTRADAS.map((entrada) => ({ slug: entrada.slug }));
}

export async function generateMetadata(props: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const entrada = ENTRADAS.find((item) => item.slug === slug);
  if (!entrada) return {};
  return { title: entrada.titulo, description: entrada.bajada };
}

export default async function EntradaPage(props: PageProps<"/blog/[slug]">) {
  const { slug } = await props.params;
  const entrada = ENTRADAS.find((item) => item.slug === slug);
  if (!entrada) notFound();

  const relacionadas = PUBLICACIONES.filter(
    (publicacion) =>
      publicacion.area === entrada.area &&
      slugify(publicacion.materia) === slugify(entrada.materia),
  ).slice(0, 2);

  return (
    <main>
      <article>
        <header className="bg-cuadricula border-line border-b">
          <Contenedor className="flex flex-col gap-5 py-[clamp(2rem,5vw,3.5rem)]">
            <nav aria-label="Migas" className="text-ink-3 flex items-center gap-1 text-sm">
              <Link href="/blog" className="hover:text-ink flex min-h-8 items-center">
                Blog
              </Link>
              <ChevronRight className="size-3.5" aria-hidden />
              <span aria-current="page" className="text-ink-2">
                {entrada.materia}
              </span>
            </nav>
            <div className="flex flex-wrap items-center gap-3">
              <AreaTag area={COLOR_DEL_AREA[entrada.area]}>{entrada.materia}</AreaTag>
              <time dateTime={entrada.fecha} className="text-ink-3 num text-sm">
                {formatDate(entrada.fecha, { day: "numeric", month: "long", year: "numeric" })}
              </time>
            </div>
            <h1 className="title-listing text-ink max-w-[24ch] text-balance">{entrada.titulo}</h1>
            <p className="text-ink-2 max-w-[52ch] text-lg">{entrada.bajada}</p>
          </Contenedor>
        </header>
        <Contenedor className="py-10">
          <div className="max-w-[68ch] space-y-5">
            {entrada.parrafos.map((parrafo) => (
              <p key={parrafo} className="text-lg leading-relaxed">
                {parrafo}
              </p>
            ))}
          </div>
        </Contenedor>
      </article>

      {relacionadas.length > 0 && (
        <section aria-labelledby="relacionadas-titulo" className="border-line border-t">
          <Contenedor className="space-y-6 py-10">
            <h2 id="relacionadas-titulo" className="title-h3">
              Clases de {entrada.materia.toLowerCase()}
            </h2>
            <ul className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {relacionadas.map((publicacion) => (
                <li key={publicacion.slug}>
                  <PublicacionCard
                    publicacion={publicacion}
                    profe={PERFILES.find((perfil) => perfil.slug === publicacion.profe)}
                  />
                </li>
              ))}
            </ul>
          </Contenedor>
        </section>
      )}
    </main>
  );
}
