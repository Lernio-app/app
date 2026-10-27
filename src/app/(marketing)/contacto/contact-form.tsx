"use client";

import { useActionState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FormError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { CONTACT_TOPICS, type ContactState } from "@/lib/validation/contact";
import { sendContactMessage } from "./actions";

export function ContactForm() {
  const [state, action, pending] = useActionState<ContactState, FormData>(sendContactMessage, {});

  if (state.ok) {
    return (
      <div role="status" className="flex flex-col gap-3 py-6">
        <span className="bg-ok flex size-10 items-center justify-center rounded-full text-white">
          <Check className="size-5" strokeWidth={2.6} aria-hidden />
        </span>
        <p className="text-lg font-semibold">Listo, recibimos tu mensaje.</p>
        <p className="text-ink-2">Te respondemos al email que dejaste.</p>
      </div>
    );
  }

  const errors = state.fieldErrors ?? {};
  const values = state.values;

  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      <Field id="name" label="Tu nombre" error={errors.name}>
        <Input
          id="name"
          name="name"
          autoComplete="name"
          defaultValue={values?.name}
          aria-invalid={Boolean(errors.name)}
        />
      </Field>
      <Field id="email" label="Tu email" hint="Te respondemos acá." error={errors.email}>
        <Input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="vos@ejemplo.com"
          defaultValue={values?.email}
          aria-invalid={Boolean(errors.email)}
        />
      </Field>
      <Field id="topic" label="¿Sobre qué nos escribís?" error={errors.topic}>
        <NativeSelect
          id="topic"
          name="topic"
          defaultValue={values?.topic ?? ""}
          aria-invalid={Boolean(errors.topic)}
        >
          <option value="" disabled>
            Elegí una opción
          </option>
          {CONTACT_TOPICS.map((topic) => (
            <option key={topic.value} value={topic.value}>
              {topic.label}
            </option>
          ))}
        </NativeSelect>
      </Field>
      <Field id="message" label="Tu mensaje" error={errors.message}>
        <Textarea
          id="message"
          name="message"
          rows={5}
          defaultValue={values?.message}
          aria-invalid={Boolean(errors.message)}
        />
      </Field>
      {/* Campo trampa para robots: fuera de la vista y del teclado. */}
      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="sitio_web">No completes este campo</label>
        <input id="sitio_web" name="sitio_web" tabIndex={-1} autoComplete="off" />
      </div>
      {state.message && <FormError>{state.message}</FormError>}
      <Button type="submit" disabled={pending} className="w-full sm:w-fit sm:px-6">
        {pending ? "Mandando…" : "Mandar mensaje"}
      </Button>
    </form>
  );
}
