import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Banknote, Check } from "lucide-react";
import { Contenedor, EncabezadoSeccion, Seccion } from "@/components/expresivos/marco";
import { Preguntas, TileArea } from "@/components/expresivos/sitio";
import { Sticker } from "@/components/expresivos/sticker";
import { Buscador } from "@/components/marketplace/buscador";
import { PublicacionCard } from "@/components/marketplace/publicacion-card";
import { buttonVariants } from "@/components/ui/button";
import { Resaltador } from "@/components/ui/resaltador";
import {
  AREAS_DEL_SITIO,
  BUSQUEDAS_FRECUENTES,
  PERFILES,
  PUBLICACIONES,
  ZONAS,
} from "@/content/marketplace-ejemplo";
import { COLOR_DEL_AREA } from "@/lib/marketplace";

export const metadata: Metadata = {
  title: { absolute: "Lernio · Clases particulares en pesos" },
  description:
    "Encontrá profe para el First, el ingreso o la tarea de Lengua. Clases particulares en pesos, online o cerca tuyo. Le consultás al profe y arreglan directo.",
};

// Home del marketplace (§12.4). Le habla a alumnos y familias; el sitio para profes vive en /ensenar.
// Lee datos de ejemplo hasta que se conecte F11.

const PASOS = [
  {
    titulo: "Buscás",
    texto: "Por área, materia, nivel y zona. Si ya sabés qué examen rendís, escribilo.",
  },
  {
    titulo: "Consultás",
    texto: "Creás tu cuenta y le escribís al profe. La conversación sigue en Lernio.",
  },
  {
    titulo: "Arreglan",
    texto: "La primera clase y el pago los acordás directo con el profe.",
  },
];

const PREGUNTAS = [
  {
    pregunta: "¿Cuánto cuesta consultar?",
    respuesta: "Nada. El precio de las clases lo pone cada profe.",
  },
  {
    pregunta: "¿Cómo se paga?",
    respuesta:
      "Lo acordás con el profe: alias, transferencia o efectivo. En Lernio no se paga y no cobramos comisión.",
  },
  {
    pregunta: "¿Qué pasa con mis datos?",
    respuesta: (
      <>
        El profe ve tu nombre cuando consultás. Tu email y tu teléfono los ve recién si te suma como
        alumno. Está explicado en la{" "}
        <Link
          href="/privacidad"
          className="text-indigo-strong font-semibold underline-offset-4 hover:underline"
        >
          política de privacidad
        </Link>
        .
      </>
    ),
  },
];

export default function HomePage() {
  const recientes = [...PUBLICACIONES]
    .sort((a, b) => b.publicada.localeCompare(a.publicada))
    .slice(0, 4);
  const sugerencias = [
    ...BUSQUEDAS_FRECUENTES.map((texto) => ({ texto, grupo: "Búsqueda" })),
    ...[...new Set(AREAS_DEL_SITIO.flatMap((area) => area.materias))].map((texto) => ({
      texto,
      grupo: "Materia",
    })),
  ];

  return (
    <main>
      <section className="bg-cuadricula border-line border-b">
        <Contenedor className="flex flex-col gap-9 pt-[clamp(2.75rem,6vw,4.5rem)] pb-[clamp(3rem,6vw,4.5rem)]">
          <div className="flex flex-col gap-6">
            <ul aria-label="Lo básico" className="flex flex-wrap items-center gap-x-3 gap-y-3">
              <li>
                <Sticker tone="resaltador" tilt="-3" icon={Check}>
                  Consultar no tiene costo
                </Sticker>
              </li>
              <li>
                <Sticker tone="idiomas" tilt="2" shape="pill" icon={Banknote}>
                  Sin comisión
                </Sticker>
              </li>
            </ul>
            <h1 className="title-display text-ink max-w-[19ch] text-balance">
              Encontrá profe para <Resaltador>el First</Resaltador>, el ingreso o la tarea de Lengua.
            </h1>
            <p className="lead text-ink-2 max-w-[36rem]">
              Clases particulares en pesos, online o cerca tuyo. Le consultás al profe y arreglan
              directo.
            </p>
          </div>
          <div className="flex flex-col gap-5">
            <Buscador sugerencias={sugerencias} zonas={ZONAS} />
            <ul aria-label="Búsquedas frecuentes" className="flex flex-wrap gap-2">
              {BUSQUEDAS_FRECUENTES.map((busqueda) => (
                <li key={busqueda}>
                  <Link
                    href={`/clases?q=${encodeURIComponent(busqueda)}`}
                    className="border-border-input text-ink-2 hover:border-indigo-strong hover:text-indigo-strong flex min-h-11 items-center rounded-full border bg-white px-4 text-sm font-semibold"
                  >
                    {busqueda}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </Contenedor>
      </section>

      <Seccion aria-labelledby="areas-titulo">
        <div className="flex flex-col gap-10">
          <EncabezadoSeccion
            id="areas-titulo"
            titulo="Qué querés aprender"
            bajada="Cuatro áreas, con las materias y los niveles de cada una."
          />
          <div className="flex flex-wrap gap-4">
            {AREAS_DEL_SITIO.map((area) => (
              <TileArea
                key={area.slug}
                area={COLOR_DEL_AREA[area.slug]}
                href={`/clases/${area.slug}`}
                nombre={area.nombre}
                glifo={area.glifo}
                accion="Ver las clases"
              >
                {area.tile}
              </TileArea>
            ))}
          </div>
        </div>
      </Seccion>

      <Seccion fondo="paper" aria-labelledby="recientes-titulo">
        <div className="flex flex-col gap-10">
          <div className="flex flex-wrap items-end justify-between gap-x-12 gap-y-4">
            <h2 id="recientes-titulo" className="title-h2 text-ink max-w-[14ch] text-balance">
              Publicadas recientemente
            </h2>
            <Link
              href="/clases?orden=nuevas"
              className={buttonVariants({ variant: "secondary", className: "px-6" })}
            >
              Ver todas las clases
              <ArrowRight aria-hidden />
            </Link>
          </div>
          <ul className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(min(100%,18rem),1fr))]">
            {recientes.map((publicacion) => (
              <li key={publicacion.slug}>
                <PublicacionCard
                  publicacion={publicacion}
                  profe={PERFILES.find((perfil) => perfil.slug === publicacion.profe)}
                />
              </li>
            ))}
          </ul>
        </div>
      </Seccion>

      <Seccion aria-labelledby="como-titulo">
        <div className="flex flex-col gap-10">
          <EncabezadoSeccion id="como-titulo" titulo="Cómo funciona" />
          <ol className="border-line grid gap-y-8 border-t pt-8 md:grid-cols-3 md:gap-x-12">
            {PASOS.map((paso, indice) => (
              <li key={paso.titulo} className="flex flex-col gap-3">
                <span
                  aria-hidden
                  className="num bg-indigo-soft text-indigo-strong rounded-tag flex size-9 items-center justify-center font-medium"
                >
                  {indice + 1}
                </span>
                <h3 className="title-h3">{paso.titulo}</h3>
                <p className="text-ink-2 max-w-[34ch] text-base leading-relaxed">{paso.texto}</p>
              </li>
            ))}
          </ol>
        </div>
      </Seccion>

      <section
        aria-labelledby="profes-titulo"
        className="bg-cuadricula cuadricula-indigo on-indigo text-white"
      >
        <Contenedor className="flex flex-wrap items-center justify-between gap-x-16 gap-y-8 py-[clamp(3.5rem,8vw,5.5rem)]">
          <h2 id="profes-titulo" className="title-h2 max-w-[18ch] text-balance">
            ¿Das clases? Publicá las tuyas y ordená a tus alumnos en el mismo lugar.
          </h2>
          <Link
            href="/ensenar"
            className={buttonVariants({ variant: "onIndigo", className: "px-6 text-base" })}
          >
            Conocé Lernio para profes
            <ArrowRight aria-hidden />
          </Link>
        </Contenedor>
      </section>

      <Seccion aria-labelledby="preguntas-titulo">
        <div className="flex flex-wrap gap-x-16 gap-y-8">
          <div className="flex flex-[1_1_18rem] flex-col gap-4">
            <h2 id="preguntas-titulo" className="title-h2">
              Preguntas para familias
            </h2>
            <p className="text-ink-2 text-base">
              ¿Otra duda? Escribinos desde{" "}
              <Link
                href="/contacto"
                className="text-indigo-strong font-semibold underline-offset-4 hover:underline"
              >
                Contacto
              </Link>
              .
            </p>
          </div>
          <div className="flex-[2_1_30rem]">
            <Preguntas items={PREGUNTAS} />
          </div>
        </div>
      </Seccion>
    </main>
  );
}
