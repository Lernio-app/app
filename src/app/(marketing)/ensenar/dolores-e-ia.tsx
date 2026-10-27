import { ArrowRight } from "lucide-react";
import { CapturaIA } from "@/components/expresivos/capturas";
import { EncabezadoSeccion, Seccion } from "@/components/expresivos/marco";
import { Sticker } from "@/components/expresivos/sticker";
import { Resaltador } from "@/components/ui/resaltador";

// Los dolores, en las palabras del profe, cada uno con lo que cambia (antes y después). Van antes
// de mostrar el producto, para que la prueba llegue a un problema que el visitante ya reconoció.
const DOLORES = [
  {
    antes: "Las entregas llegan por WhatsApp, entre audios, stickers y el grupo de la familia.",
    despues: "Llegan a la ficha de cada alumno, listas para corregir.",
  },
  {
    antes: "El simulacro lo armás en Forms y después pasás las notas a mano.",
    despues: "Lo cerrado se corrige solo y la nota queda en su historial.",
  },
  {
    antes: "El viernes abrís el home banking para ver quién te pagó.",
    despues: "Ves quién te debe, cuánto y desde cuándo, sin planilla.",
  },
  {
    antes: "Subís el precio y se lo tenés que avisar a cada uno.",
    despues: "Aumentás a todos en un paso, redondeado a los $ 50.",
  },
  {
    antes: "La mamá pregunta cómo viene y le contestás con un audio de cinco minutos.",
    despues: "El reporte del mes le llega en un link, con la asistencia y las tareas.",
  },
];

export function Dolores() {
  return (
    <Seccion aria-labelledby="dolores-titulo">
      <div className="flex flex-col gap-10">
        <EncabezadoSeccion
          id="dolores-titulo"
          titulo="Si das clases particulares, esto te suena"
          bajada="No es falta de orden: es que el trabajo está repartido entre cinco apps que no se hablan."
        />
        <ul className="border-line flex flex-col border-t">
          {DOLORES.map((dolor) => (
            <li
              key={dolor.antes}
              className="border-line grid gap-x-10 gap-y-2 border-b py-5 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:items-center"
            >
              <p className="text-ink-2 text-lg leading-snug">{dolor.antes}</p>
              <ArrowRight
                aria-hidden
                className="text-indigo-strong hidden size-5 md:block"
                strokeWidth={2.2}
              />
              <p className="text-ink text-lg leading-snug font-semibold">
                <span className="sr-only">Con Lernio: </span>
                {dolor.despues}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </Seccion>
  );
}

const USOS_IA = [
  {
    tipo: "preguntas" as const,
    titulo: "Las preguntas del simulacro",
    texto:
      "Le das el tema o subís el material de la clase y te propone preguntas con sus respuestas. Elegís cuáles van, las editás y lo asignás.",
  },
  {
    tipo: "correccion" as const,
    titulo: "Una primera corrección",
    texto:
      "En las respuestas de desarrollo te señala los errores y te sugiere un comentario. Lo aceptás, lo cambiás o lo descartás.",
  },
  {
    tipo: "reporte" as const,
    titulo: "El comentario del reporte",
    texto:
      "A fin de mes te escribe un borrador con lo que trabajó cada alumno. Lo dejás a tu manera antes de mandarlo a la familia.",
  },
];

export function SeccionIA() {
  return (
    <Seccion id="ia" fondo="paper" aria-labelledby="ia-titulo">
      <div className="flex flex-col gap-10">
        <div className="flex flex-col gap-5">
          <Sticker tone="indigo" tilt="-2" shape="pill">
            En el plan pago
          </Sticker>
          <EncabezadoSeccion
            id="ia-titulo"
            titulo={
              <>
                La IA te arma el borrador. <Resaltador>Vos ponés la nota.</Resaltador>
              </>
            }
            bajada="Te ahorra la hoja en blanco, no tu criterio. Todo lo que propone llega como borrador y nada le llega al alumno sin que lo revises."
          />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {USOS_IA.map((uso) => (
            <article
              key={uso.tipo}
              className="rounded-card flex flex-col gap-5 border bg-white p-5 sm:p-6"
            >
              <CapturaIA tipo={uso.tipo} />
              <div className="mt-auto flex flex-col gap-2">
                <h3 className="title-h3">{uso.titulo}</h3>
                <p className="text-ink-2 text-base leading-relaxed">{uso.texto}</p>
              </div>
            </article>
          ))}
        </div>
        <p className="text-ink-3 text-sm">
          La IA puede equivocarse: por eso propone y no decide. Cada tramo del plan pago trae un
          tope mensual de uso.
        </p>
      </div>
    </Seccion>
  );
}
