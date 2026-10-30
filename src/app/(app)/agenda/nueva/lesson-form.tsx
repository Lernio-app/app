"use client";

import { useActionState, useEffect, useState } from "react";
import { Field, FormError } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Catalog } from "@/lib/catalog";
import { submitKeepingForm } from "@/lib/forms";
import { DURATION_OPTIONS, type LessonValues } from "@/lib/validation/lesson";
import { createLesson } from "../actions";
import { SectionTitle } from "@/components/ui/page-header";
import { QuickStudent } from "./quick-student";

export type StudentOption = { id: string; name: string; detail: string };

export function LessonForm({
  defaults,
  students,
  catalog,
  mainAreaId,
  defaultSubjectId,
}: {
  defaults: LessonValues;
  students: StudentOption[];
  catalog: Catalog;
  mainAreaId: string | null;
  defaultSubjectId: string;
}) {
  const [state, formAction, pending] = useActionState(createLesson, {});
  const errors = state.fieldErrors ?? {};
  // Tras un error se vuelve a mostrar lo que escribió en vez de dejar el formulario vacío.
  const current = state.values ?? defaults;
  const [duration, setDuration] = useState(current.durationMin);
  const [repeat, setRepeat] = useState(current.repeat);
  // Los alumnos cargados con el alta rápida se suman arriba de la lista, ya elegidos.
  const [added, setAdded] = useState<StudentOption[]>([]);
  const [selected, setSelected] = useState<string[]>(current.studentIds);
  // Al cargar uno, la acción revalida la página y la lista del servidor ya lo trae: se queda arriba.
  const addedIds = new Set(added.map((student) => student.id));
  const allStudents = [...added, ...students.filter((student) => !addedIds.has(student.id))];

  function toggle(id: string, checked: boolean) {
    setSelected((ids) => (checked ? [...ids, id] : ids.filter((item) => item !== id)));
  }

  // Alta completa del alumno (menores, precio, responsable): al terminar vuelve a esta pantalla con
  // el día y los alumnos que ya estaban elegidos.
  const back = new URLSearchParams({ fecha: defaults.date });
  for (const id of selected) back.append("alumno", id);
  const fullFormHref = `/alumnos/nuevo?volver=${encodeURIComponent(`/agenda/nueva?${back}`)}`;

  useEffect(() => {
    if (state.fieldErrors || state.message) {
      document.querySelector("[role=alert]")?.scrollIntoView({ block: "center" });
    }
  }, [state]);

  return (
    <form onSubmit={submitKeepingForm(formAction)} className="space-y-8" noValidate>
      <section className="space-y-3">
        <SectionTitle>Alumnos</SectionTitle>
        {allStudents.length === 0 ? (
          <p className="text-ink-3 text-sm">Todavía no tenés alumnos. Cargá el primero acá.</p>
        ) : (
          <fieldset className="space-y-2">
            <legend className="text-ink-3 mb-2 text-sm">
              Elegí uno, o varios si es una clase grupal.
            </legend>
            {allStudents.map((student) => (
              <label
                key={student.id}
                className="bg-card has-[:checked]:border-primary has-[:checked]:bg-indigo-soft rounded-card flex min-h-14 cursor-pointer items-center gap-3 border px-4"
              >
                <input
                  type="checkbox"
                  name="studentIds"
                  value={student.id}
                  checked={selected.includes(student.id)}
                  onChange={(event) => toggle(student.id, event.target.checked)}
                  className="accent-primary size-5"
                />
                <span className="min-w-0">
                  <span className="block font-medium">{student.name}</span>
                  {student.detail && (
                    <span className="text-ink-3 block truncate text-sm">{student.detail}</span>
                  )}
                </span>
              </label>
            ))}
          </fieldset>
        )}
        <QuickStudent
          catalog={catalog}
          mainAreaId={mainAreaId}
          defaultSubjectId={defaultSubjectId}
          fullFormHref={fullFormHref}
          onCreated={(student) => {
            setAdded((list) => [student, ...list]);
            toggle(student.id, true);
          }}
        />
        {errors.studentIds && <FormError>{errors.studentIds}</FormError>}
      </section>

      <section className="space-y-5">
        <SectionTitle>Cuándo</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          <Field id="date" label="Día" error={errors.date}>
            <Input id="date" name="date" type="date" defaultValue={current.date} required />
          </Field>
          <Field id="start" label="Hora" error={errors.start}>
            <Input id="start" name="start" type="time" defaultValue={current.start} required />
          </Field>
        </div>

        <Field id="durationMin" label="Duración (minutos)" error={errors.durationMin}>
          <div className="flex flex-wrap items-center gap-2">
            {DURATION_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setDuration(String(option))}
                aria-pressed={duration === String(option)}
                className="bg-card aria-pressed:border-primary aria-pressed:bg-indigo-soft num rounded-control min-h-11 border px-4 text-sm aria-pressed:font-medium"
              >
                {option}
              </button>
            ))}
            <Input
              id="durationMin"
              name="durationMin"
              type="number"
              inputMode="numeric"
              min={5}
              max={480}
              value={duration}
              onChange={(event) => setDuration(event.target.value)}
              className="num w-24"
            />
          </div>
        </Field>

        <label className="bg-card has-[:checked]:border-primary has-[:checked]:bg-indigo-soft rounded-card flex min-h-14 cursor-pointer items-center gap-3 border px-4">
          <input
            type="checkbox"
            name="repeat"
            value="weekly"
            checked={repeat}
            onChange={(event) => setRepeat(event.target.checked)}
            className="accent-primary size-5"
          />
          <span>
            <span className="block font-medium">Se repite todas las semanas</span>
            <span className="text-ink-3 block text-sm">
              Es un horario fijo: se agendan las próximas 8 semanas.
            </span>
          </span>
        </label>
        {repeat && (
          <Field
            id="endsOn"
            label="Hasta el día"
            hint="Opcional. Sin fecha sigue hasta que lo termines."
            error={errors.endsOn}
          >
            <Input id="endsOn" name="endsOn" type="date" defaultValue={current.endsOn} />
          </Field>
        )}
      </section>

      <section className="space-y-5">
        <SectionTitle>Detalles</SectionTitle>
        <Field
          id="meetingUrl"
          label="Link de la clase"
          hint="Meet o Zoom. Opcional."
          error={errors.meetingUrl}
        >
          <Input
            id="meetingUrl"
            name="meetingUrl"
            type="url"
            inputMode="url"
            defaultValue={current.meetingUrl}
            placeholder="https://meet.google.com/…"
          />
        </Field>
        {!repeat && (
          <Field id="topic" label="Tema" hint="Opcional." error={errors.topic}>
            <Input id="topic" name="topic" defaultValue={current.topic} />
          </Field>
        )}
      </section>

      {state.message && <FormError>{state.message}</FormError>}

      <Button
        type="submit"
        className="w-full sm:w-auto sm:px-8"
        disabled={pending || allStudents.length === 0}
      >
        {pending ? "Guardando…" : repeat ? "Crear horario fijo" : "Agendar clase"}
      </Button>
    </form>
  );
}
