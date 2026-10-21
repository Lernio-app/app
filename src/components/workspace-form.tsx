"use client";

import { useActionState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  LEVEL_OPTIONS,
  SUBJECT_OPTIONS,
  type FormState,
  type WorkspaceDefaults,
} from "@/lib/validation/workspace";

type Action = (prev: FormState, formData: FormData) => Promise<FormState>;

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

function CheckGroup({
  name,
  legend,
  options,
  selected,
  otherName,
  otherDefault,
  otherPlaceholder,
}: {
  name: string;
  legend: string;
  options: readonly string[];
  selected: string[];
  otherName: string;
  otherDefault: string;
  otherPlaceholder: string;
}) {
  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium">{legend}</legend>
      <div className="grid grid-cols-2 gap-2">
        {options.map((option) => (
          <label
            key={option}
            className="bg-card has-[:checked]:border-primary has-[:checked]:bg-accent flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border px-3 text-sm"
          >
            <input
              type="checkbox"
              name={name}
              value={option}
              defaultChecked={selected.includes(option)}
              className="accent-primary size-4"
            />
            {option}
          </label>
        ))}
      </div>
      <Input
        name={otherName}
        defaultValue={otherDefault}
        placeholder={otherPlaceholder}
        aria-label={`${legend}: otras`}
        className="h-11"
      />
    </fieldset>
  );
}

export function WorkspaceForm({
  action,
  defaults,
  submitLabel,
  pendingLabel,
}: {
  action: Action;
  defaults: WorkspaceDefaults;
  submitLabel: string;
  pendingLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const errors = state.fieldErrors ?? {};
  // Tras un error, se vuelve a mostrar lo que escribió en vez de dejar el formulario vacío.
  const current = state.values ?? defaults;

  useEffect(() => {
    if (state.fieldErrors) {
      document.querySelector("[role=alert]")?.scrollIntoView({ block: "center" });
    }
  }, [state]);

  const otherSubjects = current.subjects.filter(
    (s) => !(SUBJECT_OPTIONS as readonly string[]).includes(s),
  );
  const otherLevels = current.levels.filter(
    (l) => !(LEVEL_OPTIONS as readonly string[]).includes(l),
  );

  return (
    <form action={formAction} className="space-y-8" noValidate>
      <section className="space-y-5">
        <h2 className="text-lg">Sobre vos</h2>
        <Field id="displayName" label="¿Cómo te llamás?" error={errors.displayName}>
          <Input
            id="displayName"
            name="displayName"
            defaultValue={current.displayName}
            autoComplete="name"
            required
            className="h-11"
          />
        </Field>
        <Field
          id="phone"
          label="Tu WhatsApp"
          hint="Para que tus alumnos te escriban. Es opcional."
          error={errors.phone}
        >
          <Input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            defaultValue={current.phone}
            autoComplete="tel"
            placeholder="11 5555 1234"
            className="h-11"
          />
        </Field>
        <CheckGroup
          name="subjects"
          legend="¿Qué materias das?"
          options={SUBJECT_OPTIONS}
          selected={current.subjects}
          otherName="subjectsOther"
          otherDefault={otherSubjects.join(", ")}
          otherPlaceholder="Otras, separadas por coma"
        />
        <CheckGroup
          name="levels"
          legend="¿Qué niveles?"
          options={LEVEL_OPTIONS}
          selected={current.levels}
          otherName="levelsOther"
          otherDefault={otherLevels.join(", ")}
          otherPlaceholder="Otros, separados por coma"
        />
      </section>

      <section className="space-y-5">
        <h2 className="text-lg">Cobros</h2>
        <Field
          id="paymentAlias"
          label="Alias o CBU"
          hint="Lo van a ver tus alumnos y va en los avisos de pago."
          error={errors.paymentAlias}
        >
          <Input
            id="paymentAlias"
            name="paymentAlias"
            defaultValue={current.paymentAlias}
            autoCapitalize="none"
            autoCorrect="off"
            placeholder="tu.alias.mp"
            className="h-11"
          />
        </Field>
        <Field
          id="paymentLink"
          label="Link de pago de MercadoPago"
          hint="Opcional."
          error={errors.paymentLink}
        >
          <Input
            id="paymentLink"
            name="paymentLink"
            type="url"
            inputMode="url"
            defaultValue={current.paymentLink}
            placeholder="https://mpago.la/…"
            className="h-11"
          />
        </Field>
        <Field
          id="lateCancelHours"
          label="Horas de aviso para cancelar sin cargo"
          hint="Si el alumno cancela con menos aviso, la clase se cobra."
          error={errors.lateCancelHours}
        >
          <Input
            id="lateCancelHours"
            name="lateCancelHours"
            type="number"
            inputMode="numeric"
            min={0}
            max={168}
            defaultValue={current.lateCancelHours}
            className="tabular h-11 w-28"
          />
        </Field>
      </section>

      {state.message && (
        <p
          role={state.ok ? "status" : "alert"}
          className={state.ok ? "text-status-ok text-sm" : "text-status-error text-sm"}
        >
          {state.message}
        </p>
      )}

      <Button type="submit" size="lg" className="h-11 w-full sm:w-auto sm:px-8" disabled={pending}>
        {pending ? pendingLabel : submitLabel}
      </Button>
    </form>
  );
}
