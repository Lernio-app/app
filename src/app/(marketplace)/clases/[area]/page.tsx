import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Catalogo } from "@/components/marketplace/catalogo";
import { CatalogoEsqueleto } from "@/components/marketplace/catalogo-esqueleto";
import { ContenidoDeArea } from "@/components/marketplace/contenido-de-area";
import { AREAS_DEL_SITIO, areaPorSlug, PUBLICACIONES } from "@/content/marketplace-ejemplo";
import type { AreaSlug } from "@/lib/marketplace";

// Catálogo de un área (§12.2), indexable. Sale como `noindex` si no tiene clases ni contenido.

export function generateStaticParams() {
  return AREAS_DEL_SITIO.map((area) => ({ area: area.slug }));
}

export async function generateMetadata(props: PageProps<"/clases/[area]">): Promise<Metadata> {
  const { area: slug } = await props.params;
  const area = areaPorSlug(slug);
  if (!area) return {};
  const params = await props.searchParams;
  const conFiltros = Object.values(params).some(Boolean);
  const hayClases = PUBLICACIONES.some((publicacion) => publicacion.area === area.slug);
  return {
    title: `Clases de ${area.nombre.toLowerCase()}`,
    description: area.presentacion,
    robots: conFiltros || !hayClases ? { index: false, follow: true } : undefined,
  };
}

export default function AreaPage(props: PageProps<"/clases/[area]">) {
  return (
    <Suspense fallback={<CatalogoEsqueleto />}>
      <Resultados {...props} />
    </Suspense>
  );
}

async function Resultados(props: PageProps<"/clases/[area]">) {
  const { area: slug } = await props.params;
  const area = areaPorSlug(slug);
  if (!area) notFound();
  const params = await props.searchParams;

  return (
    <Catalogo
      basePath={`/clases/${area.slug}`}
      titulo={`Clases de ${area.nombre.toLowerCase()}`}
      migas={[
        { href: "/", texto: "Inicio" },
        { href: "/clases", texto: "Clases" },
        { texto: area.nombre },
      ]}
      base={{ area: area.slug as AreaSlug }}
      params={params}
      hijo={
        <ContenidoDeArea
          area={area.slug}
          presentacion={area.presentacion}
          preguntas={area.preguntas}
          materias={area.materias}
        />
      }
    />
  );
}
