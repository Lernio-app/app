"use client";

import { useState } from "react";
import type { Catalog } from "@/lib/catalog";
import type { StudentValues } from "@/lib/validation/student";
import { createStudent } from "../actions";
import { StudentForm } from "../student-form";

// Al terminar de mandar un link, "Cargar otro alumno" arranca el formulario de cero.
export function NewStudent({
  catalog,
  mainAreaId,
  defaults,
}: {
  catalog: Catalog;
  mainAreaId: string | null;
  defaults: StudentValues;
}) {
  const [round, setRound] = useState(0);
  return (
    <StudentForm
      key={round}
      action={createStudent}
      defaults={defaults}
      catalog={catalog}
      mainAreaId={mainAreaId}
      submitLabel="Guardar y armar el link"
      pendingLabel="Guardando…"
      onAnother={() => setRound((n) => n + 1)}
    />
  );
}
