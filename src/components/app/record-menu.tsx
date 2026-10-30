"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";

// Una sola entrada para anotar plata (F3-2): un botón que abre la elección entre lo que el alumno le
// pagó al profe y lo que le debe. Con `studentId` (ficha del alumno) el alumno ya viene elegido.
// Los demás accesos de la fila van como `children`, junto al botón.
export function RecordMenu({
  studentId,
  children,
}: {
  studentId?: string;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const query = studentId ? `?alumno=${studentId}` : "";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button type="button" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
          {open ? "Cerrar" : "+ Anotar"}
        </Button>
        {children}
      </div>
      {open && (
        <div className="grid grid-cols-2 gap-3">
          <Link
            href={`/cobros/pago${query}`}
            className="bg-card hover:border-primary rounded-card block space-y-1 border p-4"
          >
            <span className="block font-medium">Me pagó</span>
            <span className="text-ink-3 block text-sm">Anotar plata que recibí</span>
          </Link>
          <Link
            href={`/cobros/nuevo${query}`}
            className="bg-card hover:border-primary rounded-card block space-y-1 border p-4"
          >
            <span className="block font-medium">Me debe</span>
            <span className="text-ink-3 block text-sm">Anotar algo que me tiene que pagar</span>
          </Link>
        </div>
      )}
    </div>
  );
}
