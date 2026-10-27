import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Catalogo } from "@/components/marketplace/catalogo";
import { CatalogoEsqueleto } from "@/components/marketplace/catalogo-esqueleto";
import { ContenidoDeArea } from "@/components/marketplace/contenido-de-area";
import { AREAS_DEL_SITIO, areaPorSlug, PUBLICACIONES } from "@/content/marketplace-ejemplo";
import { slugify } from "@/lib/marketplace";

// Catálogo de una materia (§12.2), indexable: /clases/idiomas/ingles. Sale como `noindex` si no
// tiene clases ni contenido propio.

export function generateStaticParams() {
  return AREAS_DEL_SITIO.flatMap((area) =>
    area.materias.map((materia) => ({ area: area.slug, materia: slugify(materia) })),
  );
}

function resolver(areaSlug: string, materiaSlug: string) {
  const area = areaPorSlug(areaSlug);
  const nombre = area?.materias.find((materia) => slugify(materia) === materiaSlug);
  return area && nombre ? { area, nombre } : null;
}

export async function generateMetadata(
  props: PageProps<"/clases/[area]/[materia]">,
): Promise<Metadata> {
  const { area: areaSlug, materia: materiaSlug } = await props.params;
  const encontrada = resolver(areaSlug, materiaSlug);
  if (!encontrada) return {};
  const params = await props.searchParams;
  const conFiltros = Object.values(params).some(Boolean);
  const hayClases = PUBLICACIONES.some(
    (publicacion) =>
      publicacion.area === encontrada.area.slug && slugify(publicacion.materia) === materiaSlug,
  );
  return {
    title: `Clases de ${encontrada.nombre.toLowerCase()}`,
    description: `Clases particulares de ${encontrada.nombre.toLowerCase()}, online o cerca tuyo. Consultá al profe sin costo.`,
    robots: conFiltros || !hayClases ? { index: false, follow: true } : undefined,
  };
}

export default function MateriaPage(props: PageProps<"/clases/[area]/[materia]">) {
  return (
    <Suspense fallback={<CatalogoEsqueleto />}>
      <Resultados {...props} />
    </Suspense>
  );
}

async function Resultados(props: PageProps<"/clases/[area]/[materia]">) {
  const { area: areaSlug, materia: materiaSlug } = await props.params;
  const encontrada = resolver(areaSlug, materiaSlug);
  if (!encontrada) notFound();
  const { area, nombre } = encontrada;
  const params = await props.searchParams;

  return (
    <Catalogo
      basePath={`/clases/${area.slug}/${materiaSlug}`}
      titulo={`Clases de ${nombre.toLowerCase()}`}
      migas={[
        { href: "/", texto: "Inicio" },
        { href: "/clases", texto: "Clases" },
        { href: `/clases/${area.slug}`, texto: area.nombre },
        { texto: nombre },
      ]}
      base={{ area: area.slug, materias: [materiaSlug] }}
      params={params}
      hijo={
        <ContenidoDeArea
          area={area.slug}
          presentacion={area.presentacion}
          preguntas={area.preguntas}
          materias={area.materias}
          actual={materiaSlug}
        />
      }
    />
  );
}
