"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { Field } from "@/components/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DURATION_OPTIONS, type LessonValues } from "@/lib/validation/lesson";
import { createLesson } from "../actions";

export type StudentOption = { id: string; name: string; detail: string };

export function LessonForm({
  defaults,
  students,
}: {
  defaults: LessonValues;
  students: StudentOption[];
}) {
  const [state, formAction, pending] = useActionState(createLesson, {});
  const errors = state.fieldErrors ?? {};
  // Tras un error se vuelve a mostrar lo que escribió en vez de dejar el formulario vacío.
  const current = state.values ?? defaults;
  const [duration, setDuration] = useState(current.durationMin);
  const [repeat, setRepeat] = useState(current.repeat);

  useEffect(() => {
    if (state.fieldErrors || state.message) {
      document.querySelector("[role=alert]")?.scrollIntoView({ block: "center" });
    }
  }, [state]);

  return (
    <form action={formAction} className="space-y-8" noValidate>
      <section className="space-y-3">
        <h2 className="text-lg">Alumnos</h2>
        {students.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Todavía no tenés alumnos.{" "}
            <Link href="/alumnos/nuevo" className="text-primary underline">
              Cargá el primero
            </Link>
            .
          </p>
        ) : (
          <fieldset className="space-y-2">
            <legend className="text-muted-foreground mb-2 text-sm">
              Elegí uno, o varios si es una clase grupal.
            </legend>
            {students.map((student) => (
              <label
                key={student.id}
                className="bg-card has-[:checked]:border-primary has-[:checked]:bg-accent flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border px-4"
              >
                <input
                  type="checkbox"
                  name="studentIds"
                  value={student.id}
                  defaultChecked={current.studentIds.includes(student.id)}
                  className="accent-primary size-5"
                />
                <span className="min-w-0">
                  <span className="block font-medium">{student.name}</span>
                  {student.detail && (
                    <span className="text-muted-foreground block truncate text-sm">
                      {student.detail}
                    </span>
                  )}
                </span>
              </label>
            ))}
          </fieldset>
        )}
        {errors.studentIds && (
          <p role="alert" className="text-status-error text-sm">
            {errors.studentIds}
          </p>
        )}
      </section>

      <section className="space-y-5">
        <h2 className="text-lg">Cuándo</h2>
        <div className="grid grid-cols-2 gap-3">
          <Field id="date" label="Día" error={errors.date}>
            <Input
              id="date"
              name="date"
              type="date"
              defaultValue={current.date}
              required
              className="h-11"
            />
          </Field>
          <Field id="start" label="Hora" error={errors.start}>
            <Input
              id="start"
              name="start"
              type="time"
              defaultValue={current.start}
              required
              className="h-11"
            />
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
                className="bg-card aria-pressed:border-primary aria-pressed:bg-accent tabular min-h-11 rounded-lg border px-4 text-sm aria-pressed:font-medium"
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
              className="tabular h-11 w-24"
            />
          </div>
        </Field>

        <label className="bg-card has-[:checked]:border-primary has-[:checked]:bg-accent flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border px-4">
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
            <span className="text-muted-foreground block text-sm">
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
            <Input
              id="endsOn"
              name="endsOn"
              type="date"
              defaultValue={current.endsOn}
              className="h-11"
            />
          </Field>
        )}
      </section>

      <section className="space-y-5">
        <h2 className="text-lg">Detalles</h2>
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
            className="h-11"
          />
        </Field>
        {!repeat && (
          <Field id="topic" label="Tema" hint="Opcional." error={errors.topic}>
            <Input id="topic" name="topic" defaultValue={current.topic} className="h-11" />
          </Field>
        )}
      </section>

      {state.message && (
        <p role="alert" className="text-status-error text-sm">
          {state.message}
        </p>
      )}

      <Button
        type="submit"
        size="lg"
        className="h-11 w-full sm:w-auto sm:px-8"
        disabled={pending || students.length === 0}
      >
        {pending ? "Guardando…" : repeat ? "Crear horario fijo" : "Agendar clase"}
      </Button>
    </form>
  );
}
