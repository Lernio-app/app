"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatARS } from "@/lib/format";
import { cn } from "@/lib/utils";
import { BarraContacto } from "./barra-contacto";
import { FormConsulta } from "./form-consulta";

// Aside de la publicación (§12.8). Escritorio: tarjeta fija con el precio y "Consultar", que abre
// el formulario en el mismo lugar. Celular: barra fija abajo; el formulario sube como una hoja.
export function PanelConsulta({
  precio,
  paquete,
  profe,
  niveles,
  placeholder,
}: {
  precio: number;
  paquete?: { clases: number; precio: number };
  profe: string;
  niveles: string[];
  placeholder?: string;
}) {
  const [abierto, setAbierto] = useState(false);

  useEffect(() => {
    if (!abierto) return;
    const alTeclear = (evento: KeyboardEvent) => evento.key === "Escape" && setAbierto(false);
    document.addEventListener("keydown", alTeclear);
    return () => document.removeEventListener("keydown", alTeclear);
  }, [abierto]);

  const resumenDePrecio = (grande: boolean) => (
    <p className="flex items-baseline gap-1.5 whitespace-nowrap">
      <span className={cn("num text-ink", grande ? "price-lg" : "price")}>{formatARS(precio)}</span>
      <span className="text-ink-3 text-sm">por clase</span>
    </p>
  );

  return (
    <>
      <div
        className={cn(
          "bg-card border-line",
          abierto
            ? "fixed inset-x-0 bottom-0 z-40 max-h-[92dvh] overflow-y-auto rounded-t-card border-t p-5 lg:static lg:max-h-none lg:overflow-visible lg:rounded-card lg:border lg:p-6"
            : "rounded-card hidden border p-6 lg:block",
        )}
      >
        {abierto ? (
          <div className="space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="title-section">Consultar a {profe}</p>
                <p className="text-ink-3 text-sm">Consultar no tiene costo.</p>
              </div>
              <button
                type="button"
                onClick={() => setAbierto(false)}
                aria-label="Cerrar la consulta"
                className="rounded-control hover:bg-paper -mt-2 -mr-2 flex size-11 shrink-0 items-center justify-center"
              >
                <X className="size-5" strokeWidth={1.8} aria-hidden />
              </button>
            </div>
            <FormConsulta profe={profe} niveles={niveles} placeholder={placeholder} />
          </div>
        ) : (
          <div className="space-y-5">
            <div className="space-y-1.5">
              {resumenDePrecio(true)}
              {paquete && (
                <p className="text-ink-2 num text-sm">
                  {`${paquete.clases} clases · ${formatARS(paquete.precio)}`}
                </p>
              )}
            </div>
            <Button type="button" className="w-full" onClick={() => setAbierto(true)}>
              Consultar
            </Button>
            <p className="text-ink-3 text-sm">
              Consultar no tiene costo. El pago lo arreglás con el profe.
            </p>
          </div>
        )}
      </div>
      {!abierto && (
        <BarraContacto precio={resumenDePrecio(false)} abierta={abierto} alConsultar={() => setAbierto(true)} />
      )}
    </>
  );
}
