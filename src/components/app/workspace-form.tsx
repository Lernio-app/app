"use client";

import { useActionState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LegalCheck } from "@/components/app/legal-check";
import { FormError } from "@/components/ui/field";
import { SectionTitle } from "@/components/ui/page-header";
import { groupSubjects, type Catalog } from "@/lib/catalog";
import { type FormState, type WorkspaceDefaults } from "@/lib/validation/workspace";

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
      {hint && !error && <p className="text-ink-3 text-sm">{hint}</p>}
      {error && <FormError>{error}</FormError>}
    </div>
  );
}

// Materias de la lista cerrada, agrupadas por las áreas en que se enseñan. Cada casilla manda el id.
function SubjectChecks({ catalog, selected }: { catalog: Catalog; selected: string[] }) {
  return (
    <fieldset className="space-y-4">
      <legend className="text-sm font-medium">¿Qué materias das?</legend>
      {groupSubjects(catalog).map((group) => (
        <div key={group.label} className="space-y-2">
          <p className="text-ink-3 text-sm">{group.label}</p>
          <div className="grid grid-cols-2 gap-2">
            {group.subjects.map((subject) => (
              <label
                key={subject.id}
                className="bg-card has-[:checked]:border-primary has-[:checked]:bg-indigo-soft rounded-control flex min-h-11 cursor-pointer items-center gap-2 border px-3 text-sm"
              >
                <input
                  type="checkbox"
                  name="subjects"
                  value={subject.id}
                  defaultChecked={selected.includes(subject.id)}
                  className="accent-primary size-4"
                />
                {subject.name}
              </label>
            ))}
          </div>
        </div>
      ))}
      <p className="text-ink-3 text-sm">
        Es opcional. Si das otra materia, igual la podés cargar con cada alumno como «Otra».
      </p>
    </fieldset>
  );
}

export function WorkspaceForm({
  action,
  catalog,
  defaults,
  submitLabel,
  pendingLabel,
  requireLegal = false,
}: {
  action: Action;
  catalog: Catalog;
  defaults: WorkspaceDefaults;
  submitLabel: string;
  pendingLabel: string;
  // En el alta del espacio, antes de cargar datos, se aceptan los términos y la privacidad.
  requireLegal?: boolean;
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

  return (
    <form action={formAction} className="space-y-8" noValidate>
      <section className="space-y-5">
        <SectionTitle>Sobre vos</SectionTitle>
        <Field id="displayName" label="¿Cómo te llamás?" error={errors.displayName}>
          <Input
            id="displayName"
            name="displayName"
            defaultValue={current.displayName}
            autoComplete="name"
            required
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
          />
        </Field>
        <SubjectChecks catalog={catalog} selected={current.subjectIds} />
      </section>

      <section className="space-y-5">
        <SectionTitle>Cobros</SectionTitle>
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
            className="num w-28"
          />
        </Field>
      </section>

      {requireLegal && <LegalCheck error={errors.legal} />}

      {state.message &&
        (state.ok ? (
          <p role="status" className="text-ok text-sm">
            {state.message}
          </p>
        ) : (
          <FormError>{state.message}</FormError>
        ))}

      <Button type="submit" className="w-full sm:w-auto sm:px-8" disabled={pending}>
        {pending ? pendingLabel : submitLabel}
      </Button>
    </form>
  );
}
