"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useId } from "react";
import { NativeSelect } from "@/components/ui/native-select";
import type { Orden } from "@/lib/marketplace";

// Orden de los resultados (§12.5). Sin texto de búsqueda el de fábrica es "Más completas"; con
// búsqueda es la coincidencia. "Más cerca de tu zona" aparece cuando se eligió una zona.
export function SelectorOrden({
  actual,
  conBusqueda,
  conZona,
}: {
  actual: Orden;
  conBusqueda: boolean;
  conZona: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const id = useId();

  const opciones: { valor: Orden; texto: string }[] = [
    conBusqueda
      ? { valor: "coincidencia", texto: "Coincidencia con la búsqueda" }
      : { valor: "completas", texto: "Más completas" },
    ...(conZona ? [{ valor: "cerca" as const, texto: "Más cerca de tu zona" }] : []),
    { valor: "precio-asc", texto: "Precio: menor a mayor" },
    { valor: "precio-desc", texto: "Precio: mayor a menor" },
    { valor: "nuevas", texto: "Más nuevas" },
  ];

  return (
    <div className="flex items-center gap-2">
      <label htmlFor={id} className="text-ink-3 text-sm whitespace-nowrap">
        Orden
      </label>
      <NativeSelect
        id={id}
        value={opciones.some((o) => o.valor === actual) ? actual : opciones[0].valor}
        onChange={(evento) => {
          const siguiente = new URLSearchParams(params.toString());
          siguiente.set("orden", evento.target.value);
          router.push(`${pathname}?${siguiente.toString()}`, { scroll: false });
        }}
        className="min-w-0 sm:w-64"
      >
        {opciones.map((opcion) => (
          <option key={opcion.valor} value={opcion.valor}>
            {opcion.texto}
          </option>
        ))}
      </NativeSelect>
    </div>
  );
}
