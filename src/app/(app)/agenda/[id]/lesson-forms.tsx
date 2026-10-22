"use client";

import { useActionState } from "react";
import { Field } from "@/components/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  cancelLesson,
  moveLesson,
  saveLessonNotes,
  setLessonStudents,
  type SimpleState,
} from "../actions";

function Status({ state, doneLabel }: { state: SimpleState; doneLabel: string }) {
  if (state.message) {
    return (
      <p role="alert" className="text-status-error text-sm">
        {state.message}
      </p>
    );
  }
  if (state.ok) return <p className="text-status-ok text-sm">{doneLabel}</p>;
  return null;
}

export function NotesForm({
  lessonId,
  topic,
  meetingUrl,
  sharedNotes,
  privateNotes,
}: {
  lessonId: string;
  topic: string;
  meetingUrl: string;
  sharedNotes: string;
  privateNotes: string;
}) {
  const [state, action, pending] = useActionState(saveLessonNotes, {});
  const errors = state.fieldErrors ?? {};

  return (
    <form action={action} className="space-y-5" noValidate>
      <input type="hidden" name="lessonId" value={lessonId} />
      <Field id="topic" label="Tema" error={errors.topic}>
        <Input id="topic" name="topic" defaultValue={topic} className="h-11" />
      </Field>
      <Field id="meetingUrl" label="Link de la clase" error={errors.meetingUrl}>
        <Input
          id="meetingUrl"
          name="meetingUrl"
          type="url"
          inputMode="url"
          defaultValue={meetingUrl}
          placeholder="https://meet.google.com/…"
          className="h-11"
        />
      </Field>
      <Field
        id="sharedNotes"
        label="Notas para el alumno"
        hint="Lo que ve el alumno cuando tenga su portal."
        error={errors.sharedNotes}
      >
        <Textarea id="sharedNotes" name="sharedNotes" defaultValue={sharedNotes} rows={3} />
      </Field>
      <Field
        id="privateNotes"
        label="Notas privadas"
        hint="Solo las ves vos."
        error={errors.privateNotes}
      >
        <Textarea id="privateNotes" name="privateNotes" defaultValue={privateNotes} rows={3} />
      </Field>
      <Status state={state} doneLabel="Guardado." />
      <Button type="submit" size="lg" className="h-11" disabled={pending}>
        {pending ? "Guardando…" : "Guardar"}
      </Button>
    </form>
  );
}

export function MoveForm({
  lessonId,
  date,
  start,
  durationMin,
}: {
  lessonId: string;
  date: string;
  start: string;
  durationMin: number;
}) {
  const [state, action, pending] = useActionState(moveLesson, {});
  const errors = state.fieldErrors ?? {};

  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="lessonId" value={lessonId} />
      <div className="grid grid-cols-2 gap-3">
        <Field id="move-date" label="Día" error={errors.date}>
          <Input
            id="move-date"
            name="date"
            type="date"
            defaultValue={date}
            required
            className="h-11"
          />
        </Field>
        <Field id="move-start" label="Hora" error={errors.start}>
          <Input
            id="move-start"
            name="start"
            type="time"
            defaultValue={start}
            required
            className="h-11"
          />
        </Field>
      </div>
      <Field id="move-duration" label="Duración (minutos)" error={errors.durationMin}>
        <Input
          id="move-duration"
          name="durationMin"
          type="number"
          inputMode="numeric"
          min={5}
          max={480}
          defaultValue={durationMin}
          className="tabular h-11 w-28"
        />
      </Field>
      <Status state={state} doneLabel="Clase movida." />
      <Button type="submit" size="lg" className="h-11" disabled={pending}>
        {pending ? "Moviendo…" : "Mover clase"}
      </Button>
    </form>
  );
}

export function CancelForm({
  lessonId,
  lateCancelHours,
  canStudentCancel,
}: {
  lessonId: string;
  lateCancelHours: number;
  canStudentCancel: boolean;
}) {
  const [state, action, pending] = useActionState(cancelLesson, {});
  const errors = state.fieldErrors ?? {};

  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="lessonId" value={lessonId} />
      <fieldset className="space-y-2">
        <legend className="sr-only">Quién cancela</legend>
        <label className="bg-card has-[:checked]:border-primary has-[:checked]:bg-accent flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-4">
          <input
            type="radio"
            name="by"
            value="teacher"
            defaultChecked
            className="accent-primary size-5"
          />
          <span>
            <span className="block font-medium">Cancelo yo</span>
            <span className="text-muted-foreground block text-sm">No se cobra.</span>
          </span>
        </label>
        {canStudentCancel && (
          <label className="bg-card has-[:checked]:border-primary has-[:checked]:bg-accent flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-4">
            <input type="radio" name="by" value="student" className="accent-primary size-5" />
            <span>
              <span className="block font-medium">Cancela el alumno</span>
              <span className="text-muted-foreground block text-sm">
                {lateCancelHours > 0
                  ? `Se cobra si avisa con menos de ${lateCancelHours} horas.`
                  : "Se cobra siempre: no tenés una regla de aviso."}
              </span>
            </span>
          </label>
        )}
        {errors.by && (
          <p role="alert" className="text-status-error text-sm">
            {errors.by}
          </p>
        )}
      </fieldset>
      <Field id="cancel-reason" label="Motivo" hint="Opcional." error={errors.reason}>
        <Input id="cancel-reason" name="reason" className="h-11" />
      </Field>
      <Status state={state} doneLabel="Clase cancelada." />
      <Button type="submit" variant="destructive" size="lg" className="h-11" disabled={pending}>
        {pending ? "Cancelando…" : "Cancelar clase"}
      </Button>
    </form>
  );
}

export function StudentsForm({
  lessonId,
  options,
  selected,
}: {
  lessonId: string;
  options: { id: string; name: string }[];
  selected: string[];
}) {
  const [state, action, pending] = useActionState(setLessonStudents, {});

  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="lessonId" value={lessonId} />
      <fieldset className="space-y-2">
        <legend className="sr-only">Alumnos de la clase</legend>
        {options.map((option) => (
          <label
            key={option.id}
            className="bg-card has-[:checked]:border-primary has-[:checked]:bg-accent flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-4"
          >
            <input
              type="checkbox"
              name="studentIds"
              value={option.id}
              defaultChecked={selected.includes(option.id)}
              className="accent-primary size-5"
            />
            <span className="font-medium">{option.name}</span>
          </label>
        ))}
      </fieldset>
      {state.fieldErrors?.studentIds && (
        <p role="alert" className="text-status-error text-sm">
          {state.fieldErrors.studentIds}
        </p>
      )}
      <p className="text-muted-foreground text-sm">
        A quien ya tiene la asistencia marcada no se lo saca de la clase.
      </p>
      <Status state={state} doneLabel="Alumnos actualizados." />
      <Button type="submit" size="lg" className="h-11" disabled={pending}>
        {pending ? "Guardando…" : "Guardar alumnos"}
      </Button>
    </form>
  );
}
