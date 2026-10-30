"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { Field, FormError } from "@/components/ui/field";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { submitKeepingForm } from "@/lib/forms";
import { defaultAreaFor, groupSubjects, type Catalog } from "@/lib/catalog";
import {
  OTHER_SUBJECT,
  PRICE_CHOICES,
  PRICE_CHOICE_LABELS,
  type PriceChoice,
  type StudentValues,
} from "@/lib/validation/student";
import { DuplicateNotice } from "./duplicate-notice";
import { LinkShare } from "./link-share";
import type { NoLinkData, StudentFormState } from "./actions";
import { SectionTitle } from "@/components/ui/page-header";

type Action = (prev: StudentFormState, formData: FormData) => Promise<StudentFormState>;

const MINOR_AGE_OPTIONS = [
  { value: "13_plus", label: "13 años o más" },
  { value: "under_13", label: "Menos de 13" },
];

// Un alumno cargado al que no se le arma ningún link todavía: dice por qué y qué sigue.
function NoLinkNote({ created }: { created: NoLinkData }) {
  return (
    <div className="bg-card rounded-card space-y-2 border p-5">
      <SectionTitle>{created.studentName} quedó cargado</SectionTitle>
      <p className="text-ink-3 text-sm">
        {created.reason === "under_13"
          ? "Es menor de 13 años: no tiene cuenta. Trabajás con él desde tu lado y su responsable ve las devoluciones en el reporte del mes."
          : "Es menor y tiene 13 años o más, así que puede tener su cuenta con el consentimiento de quien paga. Cargá al responsable de pago desde Editar y pedile el consentimiento desde la ficha."}
      </p>
    </div>
  );
}

export const EMPTY_STUDENT: StudentValues = {
  fullName: "",
  phone: "",
  email: "",
  subjectChoice: "",
  areaId: "",
  subject: "",
  levelId: "",
  notes: "",
  payerName: "",
  payerRelation: "",
  payerPhone: "",
  payerEmail: "",
  mode: "none",
  amount: "",
  lessonsPerPackage: "",
  billingDay: "",
  isMinor: false,
  minorAge: "",
};

export function StudentForm({
  action,
  defaults,
  studentId,
  catalog,
  mainAreaId,
  submitLabel,
  pendingLabel,
  onAnother,
  returnTo,
}: {
  action: Action;
  defaults: StudentValues;
  studentId?: string;
  catalog: Catalog;
  // Área principal del profe: se propone cuando la materia se enseña en dos áreas.
  mainAreaId: string | null;
  submitLabel: string;
  pendingLabel: string;
  onAnother?: () => void;
  // Pantalla de la que se vino (la clase que se estaba armando): se ofrece volver con el alumno elegido.
  returnTo?: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const errors = state.fieldErrors ?? {};
  // Tras un error se vuelve a mostrar lo que escribió en vez de dejar el formulario vacío.
  const current = state.values ?? defaults;
  const [mode, setMode] = useState<PriceChoice>(current.mode);
  const [subjectChoice, setSubjectChoice] = useState(current.subjectChoice);
  const [areaId, setAreaId] = useState(current.areaId);
  const [levelId, setLevelId] = useState(current.levelId);
  const [isMinor, setIsMinor] = useState(current.isMinor);

  const isOther = subjectChoice === OTHER_SUBJECT;
  const subject = catalog.subjects.find((item) => item.id === subjectChoice) ?? null;
  const areaOptions = subject
    ? catalog.areas.filter((area) => subject.areaIds.includes(area.id))
    : [];
  // Con una sola área posible no se pregunta: queda elegida.
  const selectedAreaId =
    areaOptions.length === 1
      ? areaOptions[0].id
      : areaOptions.some((area) => area.id === areaId)
        ? areaId
        : "";
  const levelOptions = catalog.levels.filter((level) => level.areaId === selectedAreaId);
  const selectedLevelId = levelOptions.some((level) => level.id === levelId) ? levelId : "";

  function chooseSubject(value: string) {
    setSubjectChoice(value);
    const next = catalog.subjects.find((item) => item.id === value);
    setAreaId(next ? defaultAreaFor(next, catalog, mainAreaId) : "");
  }

  useEffect(() => {
    if (state.fieldErrors) {
      document.querySelector("[role=alert]")?.scrollIntoView({ block: "center" });
    } else if (state.duplicates) {
      document.querySelector("[role=status]")?.scrollIntoView({ block: "center" });
    }
  }, [state]);

  if (state.created) {
    const created = state.created;
    return (
      <div className="space-y-4">
        {created.kind === "none" ? <NoLinkNote created={created} /> : <LinkShare share={created} />}
        {returnTo && (
          <Link
            href={`${returnTo}${returnTo.includes("?") ? "&" : "?"}alumno=${created.studentId}`}
            className={cn(buttonVariants(), "w-full")}
          >
            Volver a la clase
          </Link>
        )}
        {onAnother && (
          <Button type="button" variant="secondary" className="w-full" onClick={onAnother}>
            Cargar otro alumno
          </Button>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={submitKeepingForm(formAction)} className="space-y-8" noValidate>
      {studentId && <input type="hidden" name="studentId" value={studentId} />}

      <section className="space-y-5">
        <SectionTitle>Alumno</SectionTitle>
        <Field id="fullName" label="Nombre y apellido" error={errors.fullName}>
          <Input
            id="fullName"
            name="fullName"
            defaultValue={current.fullName}
            autoComplete="off"
            autoFocus={!studentId}
            required
          />
        </Field>
        <Field
          id="phone"
          label="WhatsApp"
          hint={
            isMinor
              ? "Alcanza con uno: el del alumno o el de quien paga."
              : "Ahí le mandás su invitación."
          }
          error={errors.phone}
        >
          <Input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            defaultValue={current.phone}
            placeholder="11 5555 1234"
            required={!isMinor}
          />
        </Field>
        <Field id="subjectChoice" label="Materia" error={errors.subjectChoice}>
          <NativeSelect
            id="subjectChoice"
            name="subjectChoice"
            value={subjectChoice}
            onChange={(event) => chooseSubject(event.target.value)}
          >
            <option value="">Elegí una materia</option>
            {groupSubjects(catalog).map((group) => (
              <optgroup key={group.label} label={group.label}>
                {group.subjects.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </optgroup>
            ))}
            <option value={OTHER_SUBJECT}>Otra (no está en la lista)</option>
          </NativeSelect>
        </Field>
        {areaOptions.length > 1 && (
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">¿Para qué estudia?</legend>
            <div className="grid grid-cols-2 gap-2">
              {areaOptions.map((area) => (
                <label
                  key={area.id}
                  className="bg-card has-[:checked]:border-primary has-[:checked]:bg-indigo-soft rounded-control flex min-h-11 cursor-pointer items-center justify-center border px-2 text-center text-sm has-[:checked]:font-medium"
                >
                  <input
                    type="radio"
                    name="areaChoice"
                    value={area.id}
                    checked={selectedAreaId === area.id}
                    onChange={() => setAreaId(area.id)}
                    className="sr-only"
                  />
                  {area.name}
                </label>
              ))}
            </div>
            {errors.areaId && <FormError>{errors.areaId}</FormError>}
          </fieldset>
        )}
        <input type="hidden" name="areaId" value={selectedAreaId} />
        {isOther ? (
          <Field id="subject" label="¿Qué materia es?" error={errors.subject}>
            <Input id="subject" name="subject" defaultValue={current.subject} autoComplete="off" />
          </Field>
        ) : (
          subject && (
            <>
              {levelOptions.length > 0 && (
                <Field id="levelId" label="Nivel" hint="Opcional." error={errors.levelId}>
                  <NativeSelect
                    id="levelId"
                    name="levelId"
                    value={selectedLevelId}
                    onChange={(event) => setLevelId(event.target.value)}
                  >
                    <option value="">Sin nivel</option>
                    {levelOptions.map((level) => (
                      <option key={level.id} value={level.id}>
                        {level.name}
                      </option>
                    ))}
                  </NativeSelect>
                </Field>
              )}
              <Field
                id="subject"
                label="Detalle"
                hint="Opcional. Por ejemplo, First o Análisis I."
                error={errors.subject}
              >
                <Input
                  id="subject"
                  name="subject"
                  defaultValue={current.subject}
                  autoComplete="off"
                />
              </Field>
            </>
          )
        )}
        <Field id="email" label="Email" hint="Opcional." error={errors.email}>
          <Input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            defaultValue={current.email}
          />
        </Field>
        <label className="bg-card rounded-control flex min-h-11 cursor-pointer items-center gap-3 border px-3 text-sm">
          <input
            type="checkbox"
            name="isMinor"
            checked={isMinor}
            onChange={(event) => setIsMinor(event.target.checked)}
            className="accent-primary size-4 shrink-0"
          />
          Es menor de edad
        </label>
        {isMinor && (
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">¿Tiene 13 años o más?</legend>
            <div className="grid grid-cols-2 gap-2">
              {MINOR_AGE_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className="bg-card has-[:checked]:border-primary has-[:checked]:bg-indigo-soft rounded-control flex min-h-11 cursor-pointer items-center justify-center border px-2 text-center text-sm has-[:checked]:font-medium"
                >
                  <input
                    type="radio"
                    name="minorAge"
                    value={option.value}
                    defaultChecked={current.minorAge === option.value}
                    className="sr-only"
                  />
                  {option.label}
                </label>
              ))}
            </div>
            {errors.minorAge ? (
              <FormError>{errors.minorAge}</FormError>
            ) : (
              <p className="text-ink-3 text-sm">
                Desde los 13 tiene su propia cuenta, con el consentimiento de quien paga. Con menos,
                trabajás con él desde tu lado.
              </p>
            )}
          </fieldset>
        )}
      </section>

      <section className="space-y-5">
        <div className="space-y-1">
          <SectionTitle>Precio</SectionTitle>
          <p className="text-ink-3 text-sm">
            Opcional. Sin precio no se le generan cobros; lo podés definir cuando quieras.
          </p>
        </div>
        <fieldset className="space-y-2">
          <legend className="sr-only">Modalidad de cobro</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {PRICE_CHOICES.map((option) => (
              <label
                key={option}
                className="bg-card has-[:checked]:border-primary has-[:checked]:bg-indigo-soft rounded-control flex min-h-11 cursor-pointer items-center justify-center border px-2 text-center text-sm has-[:checked]:font-medium"
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
          {errors.mode && <FormError>{errors.mode}</FormError>}
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
              className="num"
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
              className="num w-28"
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
              className="num w-28"
            />
          </Field>
        )}
      </section>

      <section className="space-y-5">
        <div className="space-y-1">
          <SectionTitle>Quién paga</SectionTitle>
          <p className="text-ink-3 text-sm">
            Si paga otra persona (madre, padre), cargala acá. Recibe los avisos de pago y el reporte
            del mes.
          </p>
        </div>
        <Field id="payerName" label="Nombre" error={errors.payerName}>
          <Input id="payerName" name="payerName" defaultValue={current.payerName} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field id="payerRelation" label="Vínculo" error={errors.payerRelation}>
            <Input
              id="payerRelation"
              name="payerRelation"
              defaultValue={current.payerRelation}
              placeholder="Madre"
            />
          </Field>
          <Field id="payerPhone" label="WhatsApp" error={errors.payerPhone}>
            <Input
              id="payerPhone"
              name="payerPhone"
              type="tel"
              inputMode="tel"
              defaultValue={current.payerPhone}
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
          />
        </Field>
      </section>

      <section className="space-y-3">
        <SectionTitle>Notas</SectionTitle>
        <Textarea
          name="notes"
          aria-label="Notas sobre el alumno"
          defaultValue={current.notes}
          placeholder="Solo las ves vos."
          rows={3}
        />
        {errors.notes && <FormError>{errors.notes}</FormError>}
      </section>

      {state.duplicates && <DuplicateNotice duplicates={state.duplicates} pending={pending} />}

      {state.message && <FormError>{state.message}</FormError>}

      <Button type="submit" className="w-full sm:w-auto sm:px-8" disabled={pending}>
        {pending ? pendingLabel : submitLabel}
      </Button>
    </form>
  );
}
