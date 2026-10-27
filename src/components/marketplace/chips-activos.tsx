import Link from "next/link";
import { X } from "lucide-react";

export type ChipActivo = { clave: string; valor: string; texto: string };

type Params = Record<string, string | string[] | undefined>;

// Dirección sin un valor de un filtro: si era el único, se saca el parámetro entero.
export function sinFiltro(basePath: string, params: Params, clave: string, valor: string) {
  const siguiente = new URLSearchParams();
  for (const [key, raw] of Object.entries(params)) {
    const texto = Array.isArray(raw) ? raw[0] : raw;
    if (!texto) continue;
    if (key === clave) {
      const resto = texto.split(",").filter((item) => item !== valor);
      if (resto.length) siguiente.set(key, resto.join(","));
    } else {
      siguiente.set(key, texto);
    }
  }
  const consulta = siguiente.toString();
  return consulta ? `${basePath}?${consulta}` : basePath;
}

// Chips de los filtros activos (§12.5): radio 999, fondo índigo suave y una x. Se distinguen de los
// filtros de la app, que van en tinta.
export function ChipsActivos({
  chips,
  basePath,
  params,
  limpiarHref,
}: {
  chips: ChipActivo[];
  basePath: string;
  params: Params;
  limpiarHref: string;
}) {
  if (chips.length === 0) return null;
  return (
    <ul aria-label="Filtros activos" className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <li key={`${chip.clave}-${chip.valor}`}>
          <Link
            href={sinFiltro(basePath, params, chip.clave, chip.valor)}
            scroll={false}
            className="bg-indigo-soft text-indigo-strong hover:bg-indigo-muted-2 inline-flex min-h-9 items-center gap-1.5 rounded-full pr-2 pl-3.5 text-sm font-semibold"
          >
            {chip.texto}
            <X className="size-4" strokeWidth={2} aria-hidden />
            <span className="sr-only">Quitar el filtro</span>
          </Link>
        </li>
      ))}
      <li>
        <Link
          href={limpiarHref}
          scroll={false}
          className="text-ink-2 hover:text-ink flex min-h-9 items-center px-2 text-sm font-semibold underline underline-offset-4"
        >
          Limpiar filtros
        </Link>
      </li>
    </ul>
  );
}
