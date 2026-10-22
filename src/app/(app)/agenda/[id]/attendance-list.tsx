"use client";

import { useOptimistic, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { formatARS } from "@/lib/format";
import { ATTENDANCE_LABELS, ATTENDANCE_VALUES, type Attendance } from "@/lib/validation/lesson";
import { setAttendance } from "../actions";

export type AttendanceRow = {
  studentId: string;
  name: string;
  attendance: Attendance | null;
  billable: boolean;
  charge: number | null; // lo que se le cargó por esta clase, en centavos
};

// Asistencia en un toque: tocar un estado lo marca y tocarlo de nuevo lo deshace.
export function AttendanceList({ lessonId, rows }: { lessonId: string; rows: AttendanceRow[] }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  const [optimistic, applyOptimistic] = useOptimistic(
    rows,
    (state, change: { studentId: string; attendance: Attendance | null }) =>
      state.map((row) =>
        row.studentId === change.studentId ? { ...row, attendance: change.attendance } : row,
      ),
  );

  function mark(studentId: string, attendance: Attendance | null, billable?: boolean) {
    setError(undefined);
    startTransition(async () => {
      applyOptimistic({ studentId, attendance });
      const result = await setAttendance(lessonId, studentId, attendance, billable);
      if (!result.ok) setError(result.message);
    });
  }

  const unmarked = optimistic.filter((row) => row.attendance === null);

  return (
    <div className="space-y-3">
      <ul className="space-y-3">
        {optimistic.map((row) => (
          <li key={row.studentId} className="bg-card space-y-3 rounded-xl border p-4">
            <p className="font-medium">{row.name}</p>
            <div
              role="group"
              aria-label={`Asistencia de ${row.name}`}
              className="grid grid-cols-4 gap-2"
            >
              {ATTENDANCE_VALUES.map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={row.attendance === value}
                  onClick={() => mark(row.studentId, row.attendance === value ? null : value)}
                  className="bg-background aria-pressed:border-primary aria-pressed:bg-accent min-h-12 rounded-lg border px-1 text-sm aria-pressed:font-semibold"
                >
                  {ATTENDANCE_LABELS[value]}
                </button>
              ))}
            </div>
            {!pending && row.charge !== null && (
              <p className="text-muted-foreground tabular text-sm">
                Cargo generado: {formatARS(row.charge)}
              </p>
            )}
            {!pending && (row.attendance === "absent" || row.attendance === "excused") && (
              <p className="text-muted-foreground flex items-center justify-between gap-3 text-sm">
                <span>{row.billable ? "Se cobra la clase." : "No se cobra la clase."}</span>
                <button
                  type="button"
                  onClick={() => mark(row.studentId, row.attendance, !row.billable)}
                  className="text-primary min-h-11 underline"
                >
                  {row.billable ? "No cobrar" : "Cobrar"}
                </button>
              </p>
            )}
          </li>
        ))}
      </ul>

      {optimistic.length > 1 && unmarked.length > 0 && (
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="h-11 w-full"
          disabled={pending}
          onClick={() => unmarked.forEach((row) => mark(row.studentId, "present"))}
        >
          Todos vinieron
        </Button>
      )}

      {error && (
        <p role="alert" className="text-status-error text-sm">
          {error}
        </p>
      )}
    </div>
  );
}
