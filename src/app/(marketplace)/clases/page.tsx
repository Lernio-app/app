import type { Metadata } from "next";
import { Suspense } from "react";
import { Catalogo } from "@/components/marketplace/catalogo";
import { CatalogoEsqueleto } from "@/components/marketplace/catalogo-esqueleto";

// Catálogo de clases (§12.5). Con parámetros son los resultados: la misma pantalla con filtros
// aplicados. Solo las rutas por área y por materia se indexan, no las combinaciones de filtros.

export async function generateMetadata(props: PageProps<"/clases">): Promise<Metadata> {
  const params = await props.searchParams;
  const conFiltros = Object.values(params).some(Boolean);
  const q = Array.isArray(params.q) ? params.q[0] : params.q;
  return {
    title: q ? `Resultados para "${q}"` : "Clases",
    description:
      "Clases particulares de idiomas, ingreso y universidad, apoyo escolar y música, en pesos. Consultá al profe sin costo.",
    robots: conFiltros ? { index: false, follow: true } : undefined,
  };
}

export default function ClasesPage(props: PageProps<"/clases">) {
  return (
    <Suspense fallback={<CatalogoEsqueleto />}>
      <Resultados searchParams={props.searchParams} />
    </Suspense>
  );
}

async function Resultados({ searchParams }: { searchParams: PageProps<"/clases">["searchParams"] }) {
  const params = await searchParams;
  const q = (Array.isArray(params.q) ? params.q[0] : params.q)?.trim();
  return (
    <Catalogo
      basePath="/clases"
      titulo={q ? `Resultados para "${q}"` : "Clases"}
      migas={[{ href: "/", texto: "Inicio" }, { texto: q ? "Resultados" : "Clases" }]}
      base={{}}
      params={params}
    />
  );
}
