import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { CapturaArea } from "@/components/expresivos/capturas";
import { Contenedor, EncabezadoSeccion, Seccion } from "@/components/expresivos/marco";
import { BandaOficio, Preguntas } from "@/components/expresivos/sitio";
import { AreaTag } from "@/components/ui/area";
import { buttonVariants } from "@/components/ui/button";
import { Resaltador } from "@/components/ui/resaltador";
import { PAGINAS_AREA, paginaArea } from "@/content/ensenar";
import { cn } from "@/lib/utils";
import { Sumarme } from "../../_secciones/sumarme";
import { TestimonioDelArea } from "../../_secciones/testimonios";

// Páginas para profes de un área (`/ensenar/[area]`, plan del MVP §8): ejemplos del oficio, tres
// casos de uso con su captura, las materias que se pueden publicar y preguntas propias del área.

export function generateStaticParams() {
  return PAGINAS_AREA.map((pagina) => ({ area: pagina.slug }));
}

export async function generateMetadata(props: PageProps<"/ensenar/[area]">): Promise<Metadata> {
  const { area } = await props.params;
  const pagina = paginaArea(area);
  if (!pagina) return {};
  return {
    title: `Para profes de ${pagina.nombre.toLowerCase()}`,
    description: pagina.metaDescripcion,
  };
}

export default async function AreaPage(props: PageProps<"/ensenar/[area]">) {
  const { area } = await props.params;
  const pagina = paginaArea(area);
  if (!pagina) notFound();

  const [principal, ...resto] = pagina.casos;
  const otras = PAGINAS_AREA.filter((otra) => otra.slug !== pagina.slug);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: pagina.preguntas.map((item) => ({
      "@type": "Question",
      name: item.pregunta,
      acceptedAnswer: { "@type": "Answer", text: item.respuesta },
    })),
  };

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <section className="bg-cuadricula border-line border-b">
        <Contenedor className="flex flex-wrap items-center gap-x-16 gap-y-12 py-[clamp(3rem,7vw,5rem)]">
          <div className="flex flex-[1_1_26rem] flex-col gap-6">
            <nav aria-label="Migas" className="text-ink-3 flex items-center gap-1 text-sm">
              <Link href="/ensenar" className="hover:text-ink py-1">
                Para profes
              </Link>
              <ChevronRight className="size-3.5" aria-hidden />
              <span aria-current="page" className="text-ink-2">
                {pagina.nombre}
              </span>
            </nav>
            <div>
              <AreaTag area={pagina.area}>{pagina.nombre}</AreaTag>
            </div>
            <h1 className="title-h2 text-ink max-w-[16ch] text-balance">
              {pagina.titulo.antes}
              <Resaltador>{pagina.titulo.resaltado}</Resaltador>
              {pagina.titulo.despues}
            </h1>
            <p className="lead text-ink-2 max-w-[38rem]">{pagina.bajada}</p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="#crear-cuenta"
                className={buttonVariants({ className: "px-6 text-base" })}
              >
                Crear mi cuenta gratis
              </Link>
              <Link
                href="/ensenar#como-funciona"
                className={buttonVariants({ variant: "secondary", className: "px-6 text-base" })}
              >
                Ver todo lo que hace
              </Link>
            </div>
          </div>
          <figure className="flex flex-[1_1_22rem] flex-col gap-3">
            <div className="sm:rotate-1">
              <CapturaArea captura={principal.captura} area={pagina.area} />
            </div>
            <figcaption className="flex flex-col gap-1 pt-2">
              <span className="text-ink font-semibold">{principal.titulo}</span>
              <span className="text-ink-2 max-w-[46ch] leading-relaxed">{principal.texto}</span>
              <span className="label-mono text-ink-3 pt-1">Pantalla con datos de ejemplo.</span>
            </figcaption>
          </figure>
        </Contenedor>
      </section>

      <BandaOficio ejemplos={pagina.oficio} />

      <Seccion aria-labelledby="casos-titulo">
        <div className="flex flex-col gap-12">
          <EncabezadoSeccion
            id="casos-titulo"
            titulo="Cómo se ve tu semana"
            bajada="Lo académico y lo administrativo de tus clases, en el mismo lugar y desde el celular."
          />
          <div className="flex flex-col gap-4">
            {resto.map((caso, i) => (
              <article
                key={caso.titulo}
                className="rounded-card flex flex-wrap items-center gap-x-12 gap-y-6 border bg-white p-5 sm:p-8"
              >
                <div
                  className={cn(
                    "flex flex-[1_1_20rem] flex-col gap-3",
                    i % 2 === 0 && "md:order-2",
                  )}
                >
                  <h3 className="title-h3">{caso.titulo}</h3>
                  <p className="text-ink-2 max-w-[46ch] text-base leading-relaxed">{caso.texto}</p>
                </div>
                <div className="min-w-0 flex-[1_1_20rem]">
                  <CapturaArea captura={caso.captura} area={pagina.area} />
                </div>
              </article>
            ))}
          </div>
        </div>
      </Seccion>

      <TestimonioDelArea area={pagina.area} />

      <Seccion aria-labelledby="materias-titulo">
        <div className="flex flex-wrap gap-x-16 gap-y-8">
          <div className="flex flex-[1_1_18rem] flex-col gap-4">
            <h2 id="materias-titulo" className="title-h2">
              Publicá lo que das
            </h2>
            <p className="text-ink-2 text-base leading-relaxed">
              Tus clases aparecen en el buscador de Lernio con su materia y su nivel, sin comisión.
              Si das algo que no está en la lista, igual lo organizás en la app, y nos podés{" "}
              <Link
                href="/contacto"
                className="text-indigo-strong font-semibold underline-offset-4 hover:underline"
              >
                pedir que lo sumemos
              </Link>
              .
            </p>
          </div>
          <div className="flex flex-[2_1_30rem] flex-col gap-6">
            <div className="flex flex-col gap-3">
              <p className="label-mono text-ink-3">Materias</p>
              <ul className="flex flex-wrap gap-2">
                {pagina.materias.map((materia) => (
                  <li key={materia}>
                    <AreaTag area={pagina.area}>{materia}</AreaTag>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col gap-3">
              <p className="label-mono text-ink-3">Niveles</p>
              <ul className="flex flex-wrap gap-2">
                {pagina.niveles.map((nivel) => (
                  <li
                    key={nivel}
                    className="rounded-tag border-border-control border bg-white px-2.5 py-1 text-sm font-semibold"
                  >
                    {nivel}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </Seccion>

      <Seccion aria-labelledby="preguntas-titulo">
        <div className="flex flex-wrap gap-x-16 gap-y-8">
          <div className="flex flex-[1_1_18rem] flex-col gap-4">
            <h2 id="preguntas-titulo" className="title-h2">
              Preguntas
            </h2>
            <p className="text-ink-2 text-base">
              Las generales están en{" "}
              <Link
                href="/ensenar"
                className="text-indigo-strong font-semibold underline-offset-4 hover:underline"
              >
                Para profes
              </Link>
              .
            </p>
          </div>
          <div className="flex-[2_1_30rem]">
            <Preguntas items={pagina.preguntas} />
          </div>
        </div>
      </Seccion>

      <Sumarme />

      <nav aria-label="Otras áreas" className="border-line border-b bg-white">
        <Contenedor className="flex flex-wrap items-center gap-x-6 gap-y-3 py-6">
          <span className="text-ink-3">También para profes de</span>
          {otras.map((otra) => (
            <Link
              key={otra.slug}
              href={`/ensenar/${otra.slug}`}
              className="text-ink font-semibold underline-offset-4 hover:underline"
            >
              {otra.nombre}
            </Link>
          ))}
        </Contenedor>
      </nav>
    </main>
  );
}
