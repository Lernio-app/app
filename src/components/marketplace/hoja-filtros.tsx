"use client";

import { useRef } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PanelFiltros } from "./panel-filtros";

// Hoja de filtros del celular (§12.5): pantalla completa con un botón al pie que dice cuántas
// clases va a mostrar. Usa <dialog>: el foco queda adentro y Escape la cierra.
export function HojaFiltros({
  activos,
  total,
  ...panel
}: { activos: number; total: number } & Omit<
  React.ComponentProps<typeof PanelFiltros>,
  "modo" | "pie" | "alAplicar"
>) {
  const hoja = useRef<HTMLDialogElement>(null);
  return (
    <>
      <Button
        type="button"
        variant="secondary"
        className="flex-1"
        onClick={() => hoja.current?.showModal()}
      >
        <SlidersHorizontal strokeWidth={1.8} aria-hidden />
        {activos > 0 ? `Filtros · ${activos}` : "Filtros"}
      </Button>
      <dialog
        ref={hoja}
        aria-label="Filtros"
        className="m-0 h-dvh max-h-none w-full max-w-none bg-white p-0 backdrop:bg-ink"
      >
        <div className="flex h-full flex-col">
          <div className="border-line flex h-14 shrink-0 items-center justify-between border-b px-5">
            <p className="title-section">Filtros</p>
            <button
              type="button"
              onClick={() => hoja.current?.close()}
              aria-label="Cerrar filtros"
              className="rounded-control hover:bg-paper -mr-2 flex size-11 items-center justify-center"
            >
              <X className="size-5" strokeWidth={1.8} aria-hidden />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-5 pt-5">
            <PanelFiltros
              {...panel}
              modo="hoja"
              alAplicar={() => hoja.current?.close()}
              pie={
                <div className="bg-white sticky bottom-0 -mx-5 border-t px-5 py-3 pb-[max(env(safe-area-inset-bottom),--spacing(3))]">
                  <Button type="submit" className="w-full">
                    {`Ver ${total} ${total === 1 ? "clase" : "clases"}`}
                  </Button>
                </div>
              }
            />
          </div>
        </div>
      </dialog>
    </>
  );
}
