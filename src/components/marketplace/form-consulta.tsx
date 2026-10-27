"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FormError } from "@/components/ui/field";
import { StatusChip } from "@/components/ui/status-chip";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { DIAS } from "@/lib/marketplace";

// Formulario de consulta (§12.8). Consultar pide cuenta: sin sesión, al tocar "Consultar" se pide
// ingresar o crear la cuenta y se vuelve acá con lo que ya se había escrito. Nunca se piden nombre,
// edad ni datos del menor. Esta carcasa no envía nada: la conexión guarda la consulta en
// `inquiries` y abre la conversación.

type Errores = { para?: string; nivel?: string };

export function FormConsulta({
  profe,
  niveles,
  placeholder = "Rindo el First en diciembre y quiero practicar Writing",
}: {
  profe: string;
  niveles: string[];
  placeholder?: string;
}) {
  const id = useId();
  const [errores, setErrores] = useState<Errores>({});
  const [enviada, setEnviada] = useState(false);

  if (enviada) {
    return (
      <div role="status" className="flex flex-col items-start gap-3 py-2">
        <StatusChip status="ok">Consulta enviada</StatusChip>
        <p className="text-base leading-relaxed">
          Listo. <span className="font-semibold">{profe}</span> recibió tu consulta. Vas a ver su
          respuesta acá y te avisamos por email.
        </p>
      </div>
    );
  }

  return (
    <form
      noValidate
      onSubmit={(evento) => {
        evento.preventDefault();
        const datos = new FormData(evento.currentTarget);
        const siguiente: Errores = {};
        if (!datos.get("para")) siguiente.para = "Elegí para quién es la clase.";
        if (!datos.get("nivel")) siguiente.nivel = "Elegí el nivel o el año.";
        setErrores(siguiente);
        if (Object.keys(siguiente).length === 0) setEnviada(true);
      }}
      className="space-y-5"
    >
      <fieldset className="space-y-2" aria-describedby={errores.para ? `${id}-para-error` : undefined}>
        <legend className="mb-2 text-sm font-semibold">¿Para quién es la clase?</legend>
        {[
          { valor: "yo", texto: "Para mí" },
          { valor: "hijo", texto: "Para mi hijo o hija" },
        ].map((opcion) => (
          <label
            key={opcion.valor}
            className="border-border-input rounded-control has-[:checked]:border-indigo-strong has-[:checked]:bg-indigo-soft has-[:focus-visible]:outline-ring flex min-h-11 cursor-pointer items-center gap-3 border px-3 text-base has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2"
          >
            <input
              type="radio"
              name="para"
              value={opcion.valor}
              className="accent-indigo size-4.5"
            />
            {opcion.texto}
          </label>
        ))}
        {errores.para && <FormError id={`${id}-para-error`}>{errores.para}</FormError>}
      </fieldset>

      <Field id={`${id}-nivel`} label="Nivel o año" error={errores.nivel}>
        <NativeSelect
          id={`${id}-nivel`}
          name="nivel"
          defaultValue=""
          aria-invalid={Boolean(errores.nivel)}
        >
          <option value="" disabled>
            Elegí una opción
          </option>
          {niveles.map((nivel) => (
            <option key={nivel} value={nivel}>
              {nivel}
            </option>
          ))}
        </NativeSelect>
      </Field>

      <fieldset className="space-y-2">
        <legend className="mb-2 text-sm font-semibold">
          ¿Qué días te quedan bien? <span className="text-ink-3 font-normal">Opcional</span>
        </legend>
        <ul className="grid grid-cols-7 gap-1">
          {DIAS.map((dia) => (
            <li key={dia.clave}>
              <label className="relative block">
                <input
                  type="checkbox"
                  name="dias"
                  value={dia.param}
                  className="peer absolute inset-0 size-full cursor-pointer opacity-0"
                />
                <span
                  aria-hidden
                  className="border-border-input text-ink-2 peer-checked:bg-indigo-soft peer-checked:text-indigo-strong peer-checked:border-indigo-strong peer-focus-visible:outline-ring rounded-tag flex min-h-11 items-center justify-center border bg-white text-sm font-semibold peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2"
                >
                  {dia.clave}
                </span>
                <span className="sr-only">{dia.nombre}</span>
              </label>
            </li>
          ))}
        </ul>
      </fieldset>

      <Field id={`${id}-mensaje`} label="Mensaje">
        <Textarea id={`${id}-mensaje`} name="mensaje" rows={4} placeholder={placeholder} />
      </Field>

      <p className="text-ink-3 text-sm">
        El profe ve tu nombre. Tu email y tu teléfono los ve recién si te suma como alumno.{" "}
        <Link href="/privacidad" className="text-indigo-strong font-semibold underline">
          Privacidad
        </Link>
      </p>

      <Button type="submit" className="w-full">
        Enviar consulta
      </Button>
    </form>
  );
}
