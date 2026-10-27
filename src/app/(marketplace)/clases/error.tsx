"use client";

import { Button } from "@/components/ui/button";
import { Contenedor } from "@/components/marketplace/contenedor";

// Error (§12.5): dice qué pasó y qué hacer, sin culpar a nadie.
export default function ErrorDeClases({ reset }: { error: Error; reset: () => void }) {
  return (
    <main>
      <Contenedor className="flex flex-col items-start gap-5 py-16">
        <h1 className="title-listing text-ink">No pudimos cargar las clases.</h1>
        <p className="text-ink-2">Probá de nuevo en un momento.</p>
        <Button type="button" onClick={reset}>
          Reintentar
        </Button>
      </Contenedor>
    </main>
  );
}
