"use client";

import { usePathname, useRouter } from "next/navigation";
import { useId, useRef, useState } from "react";
import { NativeSelect } from "@/components/ui/native-select";
import { Input } from "@/components/ui/input";
import { DIAS, FRANJAS, type Filtros } from "@/lib/marketplace";
import { cn } from "@/lib/utils";

// Panel de filtros (§12.5). En escritorio cada cambio se aplica con 300 ms de espera y queda en la
// URL; en la hoja del celular se aplica con el botón del pie. Cada grupo es un fieldset con su
// legend (§12.12). Los valores van en la dirección separados por coma: ?nivel=b2,c1&dias=mar,jue

export type GrupoDeMaterias = { area: string; materias: { slug: string; nombre: string }[] };
export type OpcionNivel = { slug: string; nombre: string };
// Los niveles se agrupan por área cuando el catálogo muestra más de una: "Inicial" o "Ingreso" solos
// no dicen de qué se trata.
export type GrupoDeNiveles = { area?: string; opciones: OpcionNivel[] };

const MODALIDADES = [
  { valor: "online", texto: "Online" },
  { valor: "presencial", texto: "Presencial" },
];
const FORMATOS = [
  { valor: "individual", texto: "Individual" },
  { valor: "grupal", texto: "Grupal" },
];

// Interruptor de una opción: un checkbox real, con el aspecto de una píldora.
function Opcion({
  name,
  value,
  checked,
  children,
  className,
}: {
  name: string;
  value: string;
  checked: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className="relative inline-flex">
      <input
        type="checkbox"
        name={name}
        value={value}
        defaultChecked={checked}
        className="peer absolute inset-0 size-full cursor-pointer opacity-0"
      />
      <span
        className={cn(
          "border-border-input text-ink-2 peer-checked:bg-indigo-soft peer-checked:text-indigo-strong peer-checked:border-indigo-strong peer-focus-visible:outline-ring flex min-h-11 items-center justify-center rounded-full border bg-white px-4 text-sm font-semibold peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 lg:min-h-9 lg:px-3.5",
          className,
        )}
      >
        {children}
      </span>
    </label>
  );
}

function Grupo({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <fieldset className="border-line-soft space-y-3 border-b pb-5 last:border-b-0">
      <legend className="float-left mb-3 w-full text-sm font-semibold">{titulo}</legend>
      <div className="clear-both">{children}</div>
    </fieldset>
  );
}

export function PanelFiltros({
  filtros,
  grupos,
  niveles,
  zonas,
  conservar,
  modo = "inmediato",
  alAplicar,
  pie,
}: {
  filtros: Filtros;
  grupos: GrupoDeMaterias[];
  niveles: GrupoDeNiveles[];
  zonas: string[];
  // Parámetros que el panel no edita pero no pierde: la búsqueda de texto y el orden.
  conservar: Record<string, string>;
  modo?: "inmediato" | "hoja";
  alAplicar?: () => void;
  pie?: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const id = useId();
  const formulario = useRef<HTMLFormElement>(null);
  const espera = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [presencial, setPresencial] = useState(filtros.modalidades.includes("presencial"));

  function aplicar() {
    const datos = new FormData(formulario.current ?? undefined);
    const params = new URLSearchParams();
    for (const [clave, valor] of Object.entries(conservar)) params.set(clave, valor);
    const juntos = new Map<string, Set<string>>();
    for (const [clave, valor] of datos.entries()) {
      const texto = String(valor).trim();
      if (!texto) continue;
      juntos.set(clave, (juntos.get(clave) ?? new Set()).add(texto));
    }
    for (const [clave, valores] of juntos) params.set(clave, [...valores].join(","));
    const consulta = params.toString();
    router.push(consulta ? `${pathname}?${consulta}` : pathname, { scroll: false });
    alAplicar?.();
  }

  function alCambiar(evento: React.ChangeEvent<HTMLFormElement>) {
    const objetivo = evento.target as unknown as HTMLInputElement;
    if (objetivo.name === "modalidad") {
      const marcadas = formulario.current?.querySelectorAll('input[name="modalidad"]:checked');
      setPresencial(
        [...(marcadas ?? [])].some((item) => (item as HTMLInputElement).value === "presencial"),
      );
    }
    if (modo !== "inmediato") return;
    if (espera.current) clearTimeout(espera.current);
    espera.current = setTimeout(aplicar, 300);
  }

  return (
    <form
      ref={formulario}
      method="get"
      aria-label="Filtros"
      onChange={alCambiar}
      onSubmit={(evento) => {
        evento.preventDefault();
        aplicar();
      }}
      // Los filtros miden 44 de alto (§1.1), no 48.
      style={{ "--control-h": "2.75rem" } as React.CSSProperties}
      className="space-y-5"
    >
      {grupos.length > 0 && (
        <Grupo titulo="Área y materia">
          <div className="space-y-2">
            {grupos.map((grupo) => (
              <details key={grupo.area} className="group" open={grupo.materias.some((m) => filtros.materias.includes(m.slug))}>
                <summary className="text-ink-2 flex min-h-11 cursor-pointer list-none items-center justify-between text-sm font-medium lg:min-h-9 [&::-webkit-details-marker]:hidden">
                  {grupo.area}
                  <span aria-hidden className="text-ink-3 text-xs group-open:hidden">
                    +
                  </span>
                  <span aria-hidden className="text-ink-3 hidden text-xs group-open:inline">
                    −
                  </span>
                </summary>
                <ul className="pb-2">
                  {grupo.materias.map((materia) => (
                    <li key={materia.slug}>
                      <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm lg:min-h-9">
                        <input
                          type="checkbox"
                          name="materia"
                          value={materia.slug}
                          defaultChecked={filtros.materias.includes(materia.slug)}
                          className="accent-indigo size-4.5"
                        />
                        {materia.nombre}
                      </label>
                    </li>
                  ))}
                </ul>
              </details>
            ))}
          </div>
        </Grupo>
      )}

      <Grupo titulo="Nivel">
        <div className="space-y-4">
          {niveles.map((grupo) => (
            <div key={grupo.area ?? "todos"} className="space-y-2">
              {grupo.area && <p className="text-ink-3 text-xs">{grupo.area}</p>}
              <ul className="flex flex-wrap gap-2">
                {grupo.opciones.map((nivel) => (
                  <li key={nivel.slug}>
                    <Opcion
                      name="nivel"
                      value={nivel.slug}
                      checked={filtros.niveles.includes(nivel.slug)}
                    >
                      {nivel.nombre}
                    </Opcion>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Grupo>

      <Grupo titulo="Modalidad">
        <ul className="flex flex-wrap gap-2">
          {MODALIDADES.map((item) => (
            <li key={item.valor}>
              <Opcion
                name="modalidad"
                value={item.valor}
                checked={filtros.modalidades.includes(item.valor as "online")}
              >
                {item.texto}
              </Opcion>
            </li>
          ))}
        </ul>
        {presencial && (
          <div className="mt-3 space-y-2">
            <label htmlFor={`${id}-zona`} className="text-sm font-semibold">
              Zona
            </label>
            <NativeSelect id={`${id}-zona`} name="zona" defaultValue={filtros.zona ?? ""}>
              <option value="">Todas las zonas</option>
              {zonas.map((zona) => (
                <option key={zona} value={zona}>
                  {zona}
                </option>
              ))}
            </NativeSelect>
          </div>
        )}
      </Grupo>

      <Grupo titulo="Formato">
        <ul className="flex flex-wrap gap-2">
          {FORMATOS.map((item) => (
            <li key={item.valor}>
              <Opcion
                name="formato"
                value={item.valor}
                checked={filtros.formatos.includes(item.valor as "individual")}
              >
                {item.texto}
              </Opcion>
            </li>
          ))}
        </ul>
      </Grupo>

      <Grupo titulo="Precio por clase">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label htmlFor={`${id}-min`} className="text-ink-3 text-xs">
              Mínimo en $
            </label>
            <Input
              id={`${id}-min`}
              name="precio_min"
              inputMode="numeric"
              step={1000}
              min={0}
              type="number"
              placeholder="0"
              defaultValue={filtros.precioMin ? filtros.precioMin / 100 : ""}
              className="num"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor={`${id}-max`} className="text-ink-3 text-xs">
              Máximo en $
            </label>
            <Input
              id={`${id}-max`}
              name="precio_max"
              inputMode="numeric"
              step={1000}
              min={0}
              type="number"
              placeholder="Sin tope"
              defaultValue={filtros.precioMax ? filtros.precioMax / 100 : ""}
              className="num"
            />
          </div>
        </div>
      </Grupo>

      <Grupo titulo="Días y franja">
        <ul className="grid grid-cols-7 gap-1">
          {DIAS.map((dia) => (
            <li key={dia.clave}>
              <label className="relative block">
                <input
                  type="checkbox"
                  name="dias"
                  value={dia.param}
                  defaultChecked={filtros.dias.includes(dia.clave)}
                  className="peer absolute inset-0 size-full cursor-pointer opacity-0"
                />
                <span
                  aria-hidden
                  className="border-border-input text-ink-2 peer-checked:bg-indigo-soft peer-checked:text-indigo-strong peer-checked:border-indigo-strong peer-focus-visible:outline-ring rounded-tag flex min-h-11 items-center justify-center border bg-white text-sm font-semibold peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 lg:min-h-9"
                >
                  {dia.clave}
                </span>
                <span className="sr-only">{dia.nombre}</span>
              </label>
            </li>
          ))}
        </ul>
        <ul className="mt-3 flex flex-wrap gap-2">
          {FRANJAS.map((franja) => (
            <li key={franja.clave}>
              <Opcion
                name="franja"
                value={franja.clave}
                checked={filtros.franjas.includes(franja.clave)}
              >
                {franja.nombre}
                <span className="num text-ink-3 ml-1.5 text-xs font-normal">{franja.horas}</span>
              </Opcion>
            </li>
          ))}
        </ul>
      </Grupo>

      {pie}
    </form>
  );
}
