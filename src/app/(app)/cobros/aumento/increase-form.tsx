"use client";

import { useActionState, useState } from "react";
import { Field, FormError } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { increasedAmount } from "@/lib/billing";
import { formatARS } from "@/lib/format";
import { applyIncrease } from "../actions";

export type IncreaseStudent = {
  id: string;
  name: string;
  amount: number;
  unit: string; // "por clase", "por paquete", "por mes"
};

const QUICK_PERCENTS = ["5", "10", "15", "20"];

export function IncreaseForm({ students }: { students: IncreaseStudent[] }) {
  const [state, action, pending] = useActionState(applyIncrease, {});
  const [percent, setPercent] = useState("10");
  const [selected, setSelected] = useState(() => new Set(students.map((student) => student.id)));

  const value = Number(percent.replace(",", "."));
  const valid = Number.isFinite(value) && value >= 1 && value <= 200;

  function toggle(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <form
      action={action}
      className="space-y-6"
      noValidate
      onSubmit={(event) => {
        if (
          !window.confirm(
            `¿Aplicar un aumento del ${percent}% a ${selected.size} alumno${selected.size === 1 ? "" : "s"}? Los cargos que ya existen no cambian.`,
          )
        ) {
          event.preventDefault();
        }
      }}
    >
      <Field id="percent" label="Porcentaje de aumento" error={state.fieldErrors?.percent}>
        <div className="flex flex-wrap items-center gap-2">
          {QUICK_PERCENTS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setPercent(option)}
              aria-pressed={percent === option}
              className="bg-card aria-pressed:border-primary aria-pressed:bg-indigo-soft num rounded-control min-h-11 border px-4 text-sm aria-pressed:font-medium"
            >
              {option}%
            </button>
          ))}
          <Input
            id="percent"
            name="percent"
            inputMode="decimal"
            value={percent}
            onChange={(event) => setPercent(event.target.value)}
            className="num w-24"
            aria-label="Otro porcentaje"
          />
        </div>
      </Field>

      <fieldset className="space-y-2">
        <legend className="mb-1 text-sm font-medium">A quiénes</legend>
        {students.length === 0 && (
          <p className="text-ink-3 text-sm">
            Ninguno de tus alumnos tiene un precio cargado todavía.
          </p>
        )}
        {students.map((student) => {
          const next = valid ? increasedAmount(student.amount, value) : null;
          return (
            <label
              key={student.id}
              className="bg-card has-[:checked]:border-primary has-[:checked]:bg-indigo-soft rounded-card flex min-h-14 cursor-pointer items-center gap-3 border px-4 py-2"
            >
              <input
                type="checkbox"
                name="studentIds"
                value={student.id}
                checked={selected.has(student.id)}
                onChange={() => toggle(student.id)}
                className="accent-primary size-5 shrink-0"
              />
              <span className="min-w-0 flex-1">
                <span className="block font-medium">{student.name}</span>
                <span className="text-ink-3 num block text-sm">
                  {formatARS(student.amount)} {student.unit}
                  {next !== null && (
                    <>
                      {" → "}
                      <span className="text-foreground font-medium">{formatARS(next)}</span>
                    </>
                  )}
                </span>
              </span>
            </label>
          );
        })}
        {state.fieldErrors?.studentIds && <FormError>{state.fieldErrors.studentIds}</FormError>}
      </fieldset>

      <p className="text-ink-3 text-sm">
        Los precios nuevos se redondean a los $ 50 más cercanos y rigen desde hoy. Lo que ya
        cargaste a cada alumno no cambia, y el precio anterior queda en su historial.
      </p>

      {state.message && <FormError>{state.message}</FormError>}

      <Button
        type="submit"
        className="w-full sm:w-auto sm:px-8"
        disabled={pending || students.length === 0}
      >
        {pending ? "Aplicando…" : "Aplicar aumento"}
      </Button>
    </form>
  );
}
