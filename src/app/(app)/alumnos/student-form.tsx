"use client";

import { useActionState, useEffect, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  PRICE_CHOICES,
  PRICE_CHOICE_LABELS,
  type PriceChoice,
  type StudentValues,
} from "@/lib/validation/student";
import { LinkShare } from "./link-share";
import type { StudentFormState } from "./actions";

type Action = (prev: StudentFormState, formData: FormData) => Promise<StudentFormState>;

function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && !error && <p className="text-muted-foreground text-sm">{hint}</p>}
      {error && (
        <p role="alert" className="text-status-error text-sm">
          {error}
        </p>
      )}
    </div>
  );
}

export const EMPTY_STUDENT: StudentValues = {
  fullName: "",
  phone: "",
  email: "",
  subject: "",
  level: "",
  notes: "",
  payerName: "",
  payerRelation: "",
  payerPhone: "",
  payerEmail: "",
  mode: "none",
  amount: "",
  lessonsPerPackage: "",
  billingDay: "",
};

export function StudentForm({
  action,
  defaults,
  studentId,
  subjects,
  levels,
  submitLabel,
  pendingLabel,
  onAnother,
}: {
  action: Action;
  defaults: StudentValues;
  studentId?: string;
  subjects: string[];
  levels: string[];
  submitLabel: string;
  pendingLabel: string;
  onAnother?: () => void;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const errors = state.fieldErrors ?? {};
  // Tras un error se vuelve a mostrar lo que escribió en vez de dejar el formulario vacío.
  const current = state.values ?? defaults;
  const [mode, setMode] = useState<PriceChoice>(current.mode);
  const subjectListId = useId();
  const levelListId = useId();

  useEffect(() => {
    if (state.fieldErrors) {
      document.querySelector("[role=alert]")?.scrollIntoView({ block: "center" });
    }
  }, [state]);

  if (state.created) {
    return (
      <div className="space-y-4">
        <LinkShare share={state.created} />
        {onAnother && (
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="h-11 w-full"
            onClick={onAnother}
          >
            Cargar otro alumno
          </Button>
        )}
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-8" noValidate>
      {studentId && <input type="hidden" name="studentId" value={studentId} />}

      <section className="space-y-5">
        <h2 className="text-lg">Alumno</h2>
        <Field id="fullName" label="Nombre y apellido" error={errors.fullName}>
          <Input
            id="fullName"
            name="fullName"
            defaultValue={current.fullName}
            autoComplete="off"
            autoFocus={!studentId}
            required
            className="h-11"
          />
        </Field>
        <Field id="phone" label="WhatsApp" hint="Ahí le mandás su link." error={errors.phone}>
          <Input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            defaultValue={current.phone}
            placeholder="11 5555 1234"
            className="h-11"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field id="subject" label="Materia" error={errors.subject}>
            <Input
              id="subject"
              name="subject"
              list={subjectListId}
              defaultValue={current.subject}
              className="h-11"
            />
            <datalist id={subjectListId}>
              {subjects.map((subject) => (
                <option key={subject} value={subject} />
              ))}
            </datalist>
          </Field>
          <Field id="level" label="Nivel" error={errors.level}>
            <Input
              id="level"
              name="level"
              list={levelListId}
              defaultValue={current.level}
              className="h-11"
            />
            <datalist id={levelListId}>
              {levels.map((level) => (
                <option key={level} value={level} />
              ))}
            </datalist>
          </Field>
        </div>
        <Field id="email" label="Email" hint="Opcional." error={errors.email}>
          <Input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            defaultValue={current.email}
            className="h-11"
          />
        </Field>
      </section>

      <section className="space-y-5">
        <div className="space-y-1">
          <h2 className="text-lg">Precio</h2>
          <p className="text-muted-foreground text-sm">
            Opcional. Sin precio no se le generan cobros; lo podés definir cuando quieras.
          </p>
        </div>
        <fieldset className="space-y-2">
          <legend className="sr-only">Modalidad de cobro</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {PRICE_CHOICES.map((option) => (
              <label
                key={option}
                className="bg-card has-[:checked]:border-primary has-[:checked]:bg-accent flex min-h-11 cursor-pointer items-center justify-center rounded-lg border px-2 text-center text-sm has-[:checked]:font-medium"
              >
                <input
                  type="radio"
                  name="mode"
                  value={option}
                  defaultChecked={current.mode === option}
                  onChange={() => setMode(option)}
                  className="sr-only"
                />
                {PRICE_CHOICE_LABELS[option]}
              </label>
            ))}
          </div>
          {errors.mode && (
            <p role="alert" className="text-status-error text-sm">
              {errors.mode}
            </p>
          )}
        </fieldset>
        {mode !== "none" && (
          <Field
            id="amount"
            label={
              mode === "package"
                ? "Precio del paquete ($)"
                : mode === "monthly"
                  ? "Precio por mes ($)"
                  : "Precio por clase ($)"
            }
            error={errors.amount}
          >
            <Input
              id="amount"
              name="amount"
              inputMode="decimal"
              defaultValue={current.amount}
              placeholder="18.000"
              className="tabular h-11"
            />
          </Field>
        )}
        {mode === "package" && (
          <Field id="lessonsPerPackage" label="Clases por paquete" error={errors.lessonsPerPackage}>
            <Input
              id="lessonsPerPackage"
              name="lessonsPerPackage"
              type="number"
              inputMode="numeric"
              min={1}
              max={100}
              defaultValue={current.lessonsPerPackage}
              className="tabular h-11 w-28"
            />
          </Field>
        )}
        {mode === "monthly" && (
          <Field
            id="billingDay"
            label="Día del mes para cobrar"
            hint="Del 1 al 28."
            error={errors.billingDay}
          >
            <Input
              id="billingDay"
              name="billingDay"
              type="number"
              inputMode="numeric"
              min={1}
              max={28}
              defaultValue={current.billingDay}
              className="tabular h-11 w-28"
            />
          </Field>
        )}
      </section>

      <section className="space-y-5">
        <div className="space-y-1">
          <h2 className="text-lg">Quién paga</h2>
          <p className="text-muted-foreground text-sm">
            Si paga otra persona (madre, padre), cargala acá. Recibe los avisos de pago y el reporte
            del mes.
          </p>
        </div>
        <Field id="payerName" label="Nombre" error={errors.payerName}>
          <Input
            id="payerName"
            name="payerName"
            defaultValue={current.payerName}
            className="h-11"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field id="payerRelation" label="Vínculo" error={errors.payerRelation}>
            <Input
              id="payerRelation"
              name="payerRelation"
              defaultValue={current.payerRelation}
              placeholder="Madre"
              className="h-11"
            />
          </Field>
          <Field id="payerPhone" label="WhatsApp" error={errors.payerPhone}>
            <Input
              id="payerPhone"
              name="payerPhone"
              type="tel"
              inputMode="tel"
              defaultValue={current.payerPhone}
              className="h-11"
            />
          </Field>
        </div>
        <Field id="payerEmail" label="Email" error={errors.payerEmail}>
          <Input
            id="payerEmail"
            name="payerEmail"
            type="email"
            inputMode="email"
            defaultValue={current.payerEmail}
            className="h-11"
          />
        </Field>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg">Notas</h2>
        <Textarea
          name="notes"
          aria-label="Notas sobre el alumno"
          defaultValue={current.notes}
          placeholder="Solo las ves vos."
          rows={3}
        />
        {errors.notes && (
          <p role="alert" className="text-status-error text-sm">
            {errors.notes}
          </p>
        )}
      </section>

      {state.message && (
        <p role="alert" className="text-status-error text-sm">
          {state.message}
        </p>
      )}

      <Button type="submit" size="lg" className="h-11 w-full sm:w-auto sm:px-8" disabled={pending}>
        {pending ? pendingLabel : submitLabel}
      </Button>
    </form>
  );
}
