"use client";

import { Button } from "@/components/ui/button";
import { endSeries } from "./actions";

export function EndSeriesButton({ seriesId }: { seriesId: string }) {
  return (
    <form
      action={endSeries}
      onSubmit={(event) => {
        if (
          !window.confirm(
            "¿Terminar este horario fijo? Las clases futuras sin asistencia se archivan.",
          )
        ) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="seriesId" value={seriesId} />
      <Button type="submit" variant="ghost" size="sm" className="h-9 shrink-0">
        Terminar
      </Button>
    </form>
  );
}
