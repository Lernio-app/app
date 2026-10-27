import type { Metadata } from "next";
import Link from "next/link";
import { Contenedor, Seccion } from "@/components/expresivos/marco";
import { Sticker } from "@/components/expresivos/sticker";
import { buttonVariants } from "@/components/ui/button";
import { Resaltador } from "@/components/ui/resaltador";

export const metadata: Metadata = {
  title: "Quiénes somos",
  description:
    "Lernio es un sistema para profes particulares hecho en Argentina: tareas, simulacros, clases y cobros en un solo lugar.",
};

// Quiénes somos (F10). Lo que está entre corchetes lo completan los socios: no se inventan nombres,
// historias ni números.

const CREEMOS = [
  {
    titulo: "El profe decide",
    texto:
      "La IA propone borradores y los mensajes quedan listos, pero la nota, el comentario y el envío son tuyos.",
  },
  {
    titulo: "Lo local no es un detalle",
    texto:
      "Pesos con formato argentino, la hora de Buenos Aires, voseo, alias y WhatsApp. Y un aumento de precios que se hace en un paso, porque acá hace falta.",
  },
  {
    titulo: "Lo que no está, no se promete",
    texto:
      "Si algo todavía no existe, no aparece en el sitio como si existiera. Preferimos decirte qué no hace Lernio.",
  },
  {
    titulo: "Sin comisión",
    texto:
      "Lernio no cobra tus clases ni se queda con una parte. Se sostiene con el plan pago de los profes que lo eligen.",
  },
];

const EQUIPO = ["[Nombre del socio 1]", "[Nombre del socio 2]", "[Nombre del socio 3]"];

export default function QuienesSomosPage() {
  return (
    <main className="flex-1">
      <section className="bg-cuadricula border-line border-b">
        <Contenedor className="flex flex-col gap-6 py-[clamp(3rem,7vw,5rem)]">
          <Sticker tone="resaltador" tilt="-3">
            Hecho en Argentina
          </Sticker>
          <h1 className="title-h2 text-ink max-w-[18ch] text-balance">
            Hacemos Lernio para que dar clases sea <Resaltador>dar clases</Resaltador>, no perseguir
            archivos.
          </h1>
          <p className="lead text-ink-2 max-w-[40rem]">
            Un profe particular arma la tarea en un lado, la recibe en otro, cobra por un tercero y
            anota en un cuaderno quién le debe. Lernio junta todo eso en un solo lugar, pensado para
            usarse desde el celular.
          </p>
        </Contenedor>
      </section>

      <Seccion aria-labelledby="creemos-titulo">
        <div className="flex flex-wrap gap-x-16 gap-y-8">
          <h2 id="creemos-titulo" className="title-h2 flex-[1_1_18rem]">
            En qué creemos
          </h2>
          <dl className="border-line flex flex-[2_1_30rem] flex-col border-t">
            {CREEMOS.map((item) => (
              <div key={item.titulo} className="border-line border-b py-5">
                <dt className="text-lg font-semibold">{item.titulo}</dt>
                <dd className="text-ink-2 mt-1 max-w-[60ch] text-base leading-relaxed">
                  {item.texto}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </Seccion>

      <Seccion fondo="paper" aria-labelledby="equipo-titulo">
        <div className="flex flex-col gap-10">
          <div className="flex flex-col gap-3">
            <h2 id="equipo-titulo" className="title-h2">
              Somos tres
            </h2>
            <p className="text-ink-2 max-w-[44rem] text-base leading-relaxed">
              [Cómo se conocieron los socios y por qué decidieron hacer Lernio, en dos o tres
              oraciones.]
            </p>
          </div>
          <ul className="grid gap-4 sm:grid-cols-3">
            {EQUIPO.map((nombre) => (
              <li
                key={nombre}
                className="rounded-card border-border-control flex flex-col gap-2 border border-dashed bg-white p-6"
              >
                <span className="text-lg font-semibold">{nombre}</span>
                <span className="text-ink-3">[Qué hace en Lernio]</span>
              </li>
            ))}
          </ul>
          <p className="text-ink-3 text-sm">
            Lernio es un nombre provisional: puede cambiar antes del lanzamiento.
          </p>
        </div>
      </Seccion>

      <Seccion aria-labelledby="cierre-titulo">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <h2 id="cierre-titulo" className="title-h3 max-w-[28ch]">
            ¿Das clases? Mirá cómo te puede servir, o escribinos.
          </h2>
          <div className="flex flex-wrap gap-3">
            <Link href="/ensenar" className={buttonVariants({ className: "px-6" })}>
              Ver Lernio para profes
            </Link>
            <Link
              href="/contacto"
              className={buttonVariants({ variant: "secondary", className: "px-6" })}
            >
              Escribirnos
            </Link>
          </div>
        </div>
      </Seccion>
    </main>
  );
}
