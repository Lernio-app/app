"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Field, FormError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { defaultAreaFor, groupSubjects, type Catalog } from "@/lib/catalog";
import { DuplicateNotice } from "../../alumnos/duplicate-notice";
import { quickCreateStudent, type PossibleDuplicate } from "../../alumnos/actions";
import type { StudentOption } from "./lesson-form";

// Alta rápida de un alumno desde «Nueva clase» (F2-3): nombre, WhatsApp y materia. No es un
// <form> porque vive dentro del formulario de la clase; sus campos no llevan `name` para que no
// viajen con ella.
export function QuickStudent({
  catalog,
  mainAreaId,
  defaultSubjectId,
  fullFormHref,
  onCreated,
}: {
  catalog: Catalog;
  mainAreaId: string | null;
  // Si el profe da una sola materia, viene elegida.
  defaultSubjectId: string;
  // Alta completa (menores, precio, responsable): vuelve a la clase al terminar.
  fullFormHref: string;
  onCreated: (student: StudentOption) => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [subjectId, setSubjectId] = useState(defaultSubjectId);
  const [areaId, setAreaId] = useState(() => {
    const subject = catalog.subjects.find((item) => item.id === defaultSubjectId);
    return subject ? defaultAreaFor(subject, catalog, mainAreaId) : "";
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [duplicates, setDuplicates] = useState<PossibleDuplicate[] | null>(null);
  const [pending, startTransition] = useTransition();

  const subject = catalog.subjects.find((item) => item.id === subjectId) ?? null;
  const areaOptions = subject ? catalog.areas.filter((a) => subject.areaIds.includes(a.id)) : [];
  // Con una sola área posible no se pregunta: queda elegida.
  const selectedAreaId =
    areaOptions.length === 1
      ? areaOptions[0].id
      : areaOptions.some((a) => a.id === areaId)
        ? areaId
        : "";

  function chooseSubject(value: string) {
    setSubjectId(value);
    const next = catalog.subjects.find((item) => item.id === value);
    setAreaId(next ? defaultAreaFor(next, catalog, mainAreaId) : "");
    setDuplicates(null);
  }

  function reset() {
    setName("");
    setPhone("");
    setErrors({});
    setMessage(null);
    setDuplicates(null);
  }

  function save(confirmDuplicates: boolean) {
    const data = new FormData();
    data.set("fullName", name);
    data.set("phone", phone);
    data.set("subjectChoice", subjectId);
    data.set("areaId", selectedAreaId);
    if (confirmDuplicates) data.set("confirmDuplicates", "1");
    startTransition(async () => {
      const result = await quickCreateStudent(data);
      setErrors(result.fieldErrors ?? {});
      setMessage(result.message ?? null);
      setDuplicates(result.duplicates ?? null);
      if (result.student) {
        onCreated(result.student);
        reset();
        setOpen(false);
      }
    });
  }

  // Enter en estos campos carga al alumno en vez de enviar la clase.
  function onEnter(event: React.KeyboardEvent) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    if (!pending) save(false);
  }

  if (!open) {
    return (
      <Button type="button" variant="secondary" className="w-full" onClick={() => setOpen(true)}>
        + Nuevo alumno
      </Button>
    );
  }

  return (
    <div className="bg-card rounded-card space-y-5 border p-4">
      <Field id="quickName" label="Nombre y apellido" error={errors.fullName}>
        <Input
          id="quickName"
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            setDuplicates(null);
          }}
          onKeyDown={onEnter}
          autoComplete="off"
          autoFocus
        />
      </Field>
      <Field
        id="quickPhone"
        label="WhatsApp"
        hint="Ahí le mandás su invitación."
        error={errors.phone}
      >
        <Input
          id="quickPhone"
          type="tel"
          inputMode="tel"
          value={phone}
          onChange={(event) => {
            setPhone(event.target.value);
            setDuplicates(null);
          }}
          onKeyDown={onEnter}
          placeholder="11 5555 1234"
        />
      </Field>
      <Field id="quickSubject" label="Materia" error={errors.subjectChoice}>
        <NativeSelect
          id="quickSubject"
          value={subjectId}
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

      {duplicates && (
        <DuplicateNotice duplicates={duplicates} pending={pending} onConfirm={() => save(true)} />
      )}
      {message && <FormError>{message}</FormError>}

      <div className="flex gap-2">
        <Button type="button" className="flex-1" disabled={pending} onClick={() => save(false)}>
          {pending ? "Cargando…" : "Cargar alumno"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={pending}
          onClick={() => {
            reset();
            setOpen(false);
          }}
        >
          Cancelar
        </Button>
      </div>
      <p className="text-ink-3 text-sm">
        Se carga sin precio ni responsable de pago; los completás después en su ficha. ¿Es menor de
        edad?{" "}
        <Link href={fullFormHref} className="text-primary underline">
          Cargalo con todos los datos
        </Link>
        .
      </p>
    </div>
  );
}
