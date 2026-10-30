"use client";

import { useActionState } from "react";
import { Field, FormError } from "@/components/ui/field";
import { NativeSelect } from "@/components/ui/native-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createCharge } from "../actions";

export type StudentOption = { id: string; name: string };

export function ChargeForm({
  students,
  defaults,
}: {
  students: StudentOption[];
  defaults: { studentId: string; dueOn: string };
}) {
  const [state, action, pending] = useActionState(createCharge, {});
  const errors = state.fieldErrors ?? {};
  // Tras un error se vuelve a mostrar lo que escribió en vez de dejar el formulario vacío.
  const current = {
    studentId: defaults.studentId,
    amount: "",
    description: "",
    dueOn: defaults.dueOn,
    ...state.values,
  };

  return (
    <form action={action} className="space-y-6" noValidate>
      <Field id="studentId" label="Alumno" error={errors.studentId}>
        <NativeSelect id="studentId" name="studentId" defaultValue={current.studentId} required>
          <option value="">Elegí un alumno</option>
          {students.map((student) => (
            <option key={student.id} value={student.id}>
              {student.name}
            </option>
          ))}
        </NativeSelect>
      </Field>

      <Field id="amount" label="Monto ($)" error={errors.amount}>
        <Input
          id="amount"
          name="amount"
          inputMode="decimal"
          defaultValue={current.amount}
          placeholder="18.000"
          autoFocus
          className="num"
        />
      </Field>

      <Field
        id="description"
        label="Concepto"
        hint="Opcional: material, inscripción, clase de apoyo…"
        error={errors.description}
      >
        <Input id="description" name="description" defaultValue={current.description} />
      </Field>

      <Field
        id="dueOn"
        label="Vence el"
        hint="Con una fecha futura queda como cuenta a cobrar y pasa a vencida cuando llega ese día."
        error={errors.dueOn}
      >
        <Input id="dueOn" name="dueOn" type="date" defaultValue={current.dueOn} required />
      </Field>

      {state.message && <FormError>{state.message}</FormError>}

      <Button type="submit" className="w-full sm:w-auto sm:px-8" disabled={pending}>
        {pending ? "Guardando…" : "Anotar deuda"}
      </Button>
    </form>
  );
}
