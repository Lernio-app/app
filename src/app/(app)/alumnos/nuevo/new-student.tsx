"use client";

import { useState } from "react";
import { createStudent } from "../actions";
import { EMPTY_STUDENT, StudentForm } from "../student-form";

// Al terminar de mandar un link, "Cargar otro alumno" arranca el formulario de cero.
export function NewStudent({ subjects, levels }: { subjects: string[]; levels: string[] }) {
  const [round, setRound] = useState(0);
  return (
    <StudentForm
      key={round}
      action={createStudent}
      defaults={EMPTY_STUDENT}
      subjects={subjects}
      levels={levels}
      submitLabel="Guardar y armar el link"
      pendingLabel="Guardando…"
      onAnother={() => setRound((n) => n + 1)}
    />
  );
}
