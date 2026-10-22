"use client";

import { useActionState } from "react";
import { Field } from "@/components/field";
import { MethodPicker } from "@/components/method-picker";
import { NativeSelect } from "@/components/native-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { recordPayment } from "../actions";

export type StudentOption = { id: string; name: string };

export function PaymentForm({
  students,
  defaults,
}: {
  students: StudentOption[];
  defaults: { studentId: string; paidOn: string };
}) {
  const [state, action, pending] = useActionState(recordPayment, {});
  const errors = state.fieldErrors ?? {};
  // Tras un error se vuelve a mostrar lo que escribió en vez de dejar el formulario vacío.
  const current = {
    studentId: defaults.studentId,
    amount: "",
    method: "transfer",
    paidOn: defaults.paidOn,
    reference: "",
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

      <Field
        id="amount"
        label="Monto ($)"
        hint="Cubre primero lo más viejo que debe. Si sobra, queda como saldo a favor."
        error={errors.amount}
      >
        <Input
          id="amount"
          name="amount"
          inputMode="decimal"
          defaultValue={current.amount}
          placeholder="18.000"
          autoFocus
          className="tabular h-11"
        />
      </Field>

      <div className="space-y-2">
        <p className="text-sm font-medium">Cómo te pagó</p>
        <MethodPicker defaultValue={current.method} />
        {errors.method && (
          <p role="alert" className="text-status-error text-sm">
            {errors.method}
          </p>
        )}
      </div>

      <Field id="paidOn" label="Fecha del pago" error={errors.paidOn}>
        <Input
          id="paidOn"
          name="paidOn"
          type="date"
          defaultValue={current.paidOn}
          required
          className="h-11"
        />
      </Field>

      <Field
        id="reference"
        label="Referencia"
        hint="Opcional: número de operación, por ejemplo."
        error={errors.reference}
      >
        <Input id="reference" name="reference" defaultValue={current.reference} className="h-11" />
      </Field>

      {state.message && (
        <p role="alert" className="text-status-error text-sm">
          {state.message}
        </p>
      )}

      <Button type="submit" size="lg" className="h-11 w-full sm:w-auto sm:px-8" disabled={pending}>
        {pending ? "Guardando…" : "Registrar pago"}
      </Button>
    </form>
  );
}
