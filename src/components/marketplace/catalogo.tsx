import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/page-header";
import {
  NIVELES,
  ZONAS,
  AREAS_DEL_SITIO,
  BUSQUEDAS_FRECUENTES,
  PERFILES,
  PUBLICACIONES,
} from "@/content/marketplace-ejemplo";
import {
  buscar,
  hayFiltros,
  leerFiltros,
  slugify,
  type Filtros,
  type Orden,
} from "@/lib/marketplace";
import { Buscador } from "./buscador";
import { ChipsActivos, type ChipActivo } from "./chips-activos";
import { Contenedor } from "./contenedor";
import { HojaFiltros } from "./hoja-filtros";
import { PanelFiltros, type GrupoDeMaterias, type GrupoDeNiveles } from "./panel-filtros";
import { PublicacionCard } from "./publicacion-card";
import { SelectorOrden } from "./selector-orden";

// Catálogo y resultados (§12.5): son la misma pantalla. Los resultados son el catálogo con filtros
// aplicados y cada combinación queda en la URL. Lo usan /clases, /clases/[area] y
// /clases/[area]/[materia]. Lee datos de ejemplo hasta que se conecte F11.

type Params = Record<string, string | string[] | undefined>;

export type Miga = { href?: string; texto: string };

const POR_PAGINA = 12;
const MODALIDAD_TEXTO = { online: "Online", presencial: "Presencial" } as const;
const FORMATO_TEXTO = { individual: "Individual", grupal: "Grupal" } as const;

function chipsDe(filtros: Filtros, materiasPorSlug: Map<string, string>): ChipActivo[] {
  const niveles = new Map(Object.values(NIVELES).flat().map((n) => [slugify(n), n]));
  const dinero = (centavos: number) => `$ ${(centavos / 100).toLocaleString("es-AR")}`;
  const chips: ChipActivo[] = [];
  if (filtros.q) chips.push({ clave: "q", valor: filtros.q, texto: `"${filtros.q}"` });
  for (const slug of filtros.materias)
    chips.push({ clave: "materia", valor: slug, texto: materiasPorSlug.get(slug) ?? slug });
  for (const slug of filtros.niveles)
    chips.push({ clave: "nivel", valor: slug, texto: niveles.get(slug) ?? slug });
  for (const modalidad of filtros.modalidades)
    chips.push({ clave: "modalidad", valor: modalidad, texto: MODALIDAD_TEXTO[modalidad] });
  if (filtros.zona) chips.push({ clave: "zona", valor: filtros.zona, texto: filtros.zona });
  for (const formato of filtros.formatos)
    chips.push({ clave: "formato", valor: formato, texto: FORMATO_TEXTO[formato] });
  if (filtros.precioMin)
    chips.push({ clave: "precio_min", valor: String(filtros.precioMin / 100), texto: `Desde ${dinero(filtros.precioMin)}` });
  if (filtros.precioMax)
    chips.push({ clave: "precio_max", valor: String(filtros.precioMax / 100), texto: `Hasta ${dinero(filtros.precioMax)}` });
  for (const dia of filtros.dias) {
    const nombre = { L: "Lunes", M: "Martes", X: "Miércoles", J: "Jueves", V: "Viernes", S: "Sábado", D: "Domingo" }[dia];
    const param = { L: "lun", M: "mar", X: "mie", J: "jue", V: "vie", S: "sab", D: "dom" }[dia];
    chips.push({ clave: "dias", valor: param, texto: nombre });
  }
  for (const franja of filtros.franjas)
    chips.push({ clave: "franja", valor: franja, texto: { manana: "Mañana", tarde: "Tarde", noche: "Noche" }[franja] });
  return chips;
}

export function Catalogo({
  basePath,
  titulo,
  migas,
  descripcion,
  base,
  params,
  hijo,
}: {
  basePath: string;
  titulo: string;
  migas: Miga[];
  descripcion?: string;
  // Filtros fijos de la ruta: el área o la materia de las páginas indexables.
  base: Pick<Filtros, "area"> & { materias?: string[] };
  params: Params;
  // Contenido propio de la página de área o materia (presentación y preguntas), debajo de los resultados.
  hijo?: React.ReactNode;
}) {
  const filtros = leerFiltros(params, base);
  const resultados = buscar(PUBLICACIONES, PERFILES, filtros);
  const total = resultados.length;
  const visibles = resultados.slice(0, POR_PAGINA);

  const areasVisibles = AREAS_DEL_SITIO.filter((area) => !base.area || area.slug === base.area);
  const materiasPorSlug = new Map(
    AREAS_DEL_SITIO.flatMap((area) => area.materias.map((m) => [slugify(m), m] as const)),
  );
  const grupos: GrupoDeMaterias[] = areasVisibles.map((area) => ({
    area: area.nombre,
    materias: area.materias.map((nombre) => ({ slug: slugify(nombre), nombre })),
  }));
  const niveles: GrupoDeNiveles[] = areasVisibles.map((area) => ({
    area: base.area ? undefined : area.nombre,
    opciones: NIVELES[area.slug].map((nombre) => ({ slug: slugify(nombre), nombre })),
  }));

  const chips = chipsDe(filtros, materiasPorSlug).filter(
    // Las materias fijas de la ruta no se quitan: son el tema de la página.
    (chip) => !(chip.clave === "materia" && base.materias?.includes(chip.valor)),
  );
  const activos = chips.length;
  const conservar: Record<string, string> = {};
  if (filtros.q) conservar.q = filtros.q;
  if (filtros.orden) conservar.orden = filtros.orden;

  const orden: Orden = filtros.orden ?? (filtros.q ? "coincidencia" : "completas");
  const panel = { filtros, grupos: base.materias ? [] : grupos, niveles, zonas: ZONAS, conservar };
  const sugerencias = [
    ...BUSQUEDAS_FRECUENTES.map((texto) => ({ texto, grupo: "Búsqueda" })),
    ...[...materiasPorSlug.values()].map((texto) => ({ texto, grupo: "Materia" })),
  ];

  return (
    <main>
      <section className="bg-cuadricula border-line border-b">
        <Contenedor className="flex flex-col gap-5 py-[clamp(1.75rem,4vw,2.75rem)]">
          <nav aria-label="Migas" className="text-ink-3 flex flex-wrap items-center gap-x-1 text-sm">
            {migas.map((miga, indice) => (
              <span key={miga.texto} className="flex items-center gap-1">
                {indice > 0 && <ChevronRight className="size-3.5" aria-hidden />}
                {miga.href ? (
                  <Link href={miga.href} className="hover:text-ink flex min-h-8 items-center">
                    {miga.texto}
                  </Link>
                ) : (
                  <span aria-current="page" className="text-ink-2">
                    {miga.texto}
                  </span>
                )}
              </span>
            ))}
          </nav>
          <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
            <div className="space-y-2">
              <h1 className="title-listing text-ink text-balance">{titulo}</h1>
              {descripcion && <p className="text-ink-2 max-w-[62ch]">{descripcion}</p>}
            </div>
            <div className="w-full sm:max-w-sm">
              <Buscador
                variante="compacto"
                sugerencias={sugerencias}
                valorInicial={filtros.q}
              />
            </div>
          </div>
        </Contenedor>
      </section>

      {/* Fila fija del celular: filtros y orden. */}
      <div className="border-line sticky top-16 z-10 border-b bg-white lg:hidden">
        <Contenedor className="flex items-center gap-3 py-2">
          <HojaFiltros {...panel} activos={activos} total={total} />
          <SelectorOrden actual={orden} conBusqueda={Boolean(filtros.q)} conZona={Boolean(filtros.zona)} />
        </Contenedor>
      </div>

      <Contenedor className="grid gap-x-10 gap-y-6 py-8 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <aside aria-label="Filtros" className="hidden lg:block">
          <div className="sticky top-24 max-h-[calc(100dvh-7rem)] overflow-y-auto pr-1">
            <PanelFiltros {...panel} />
          </div>
        </aside>

        <div className="min-w-0 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p aria-live="polite" className="text-ink-2 text-sm">
              <span className="num text-ink font-medium">{total}</span>{" "}
              {total === 1 ? "clase" : "clases"}
            </p>
            <div className="hidden lg:block">
              <SelectorOrden actual={orden} conBusqueda={Boolean(filtros.q)} conZona={Boolean(filtros.zona)} />
            </div>
          </div>

          <ChipsActivos
            chips={chips}
            basePath={basePath}
            params={params}
            limpiarHref={basePath}
          />

          {total === 0 ? (
            <div className="space-y-4">
              <EmptyState title="No hay clases con todos esos filtros.">
                Probá sacar alguno:
              </EmptyState>
              {hayFiltros(filtros) && (
                <Link href={basePath} className={buttonVariants({ variant: "secondary" })}>
                  Ver todas las clases
                </Link>
              )}
            </div>
          ) : (
            <ul className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(min(100%,18rem),1fr))]">
              {visibles.map((publicacion) => (
                <li key={publicacion.slug}>
                  <PublicacionCard
                    publicacion={publicacion}
                    profe={PERFILES.find((perfil) => perfil.slug === publicacion.profe)}
                  />
                </li>
              ))}
            </ul>
          )}

          {total > POR_PAGINA && (
            <div className="flex flex-col items-center gap-3 pt-4">
              <p className="text-ink-3 num text-sm">{`Mostrando ${visibles.length} de ${total}`}</p>
              <Link href={basePath} className={buttonVariants({ variant: "secondary" })}>
                Ver más clases
              </Link>
            </div>
          )}
        </div>
      </Contenedor>

      {hijo}
    </main>
  );
}
