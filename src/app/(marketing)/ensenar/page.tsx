import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Percent } from "lucide-react";
import {
  CapturaCobros,
  CapturaConsulta,
  CapturaPortal,
  CapturaPublicacion,
  CapturaReporte,
  CapturaSimulacro,
  CapturaTareas,
  TextoListo,
} from "@/components/expresivos/capturas";
import { EncabezadoSeccion, Seccion } from "@/components/expresivos/marco";
import { BandaOficio, Preguntas, TileArea } from "@/components/expresivos/sitio";
import { Sticker } from "@/components/expresivos/sticker";
import { Resaltador } from "@/components/ui/resaltador";
import { PAGINAS_AREA } from "@/content/ensenar";
import { cn } from "@/lib/utils";
import { Planes } from "../_secciones/planes";
import { Sumarme } from "../_secciones/sumarme";
import { Testimonios } from "../_secciones/testimonios";
import { Dolores, SeccionIA } from "./dolores-e-ia";
import { Hero } from "./hero";

export const metadata: Metadata = {
  title: "Para profes",
  description:
    "Tareas, simulacros con IA, clases y cobros de tus alumnos en un solo lugar, en pesos y con tu WhatsApp. Gratis con 1 alumno, sin tarjeta.",
};

// Recorrido (§7, "Sitio para profes"): promesa, prueba y acción. Lo académico primero, la
// operación después, el marketplace como beneficio y lo que Lernio no hace, dicho de frente.

function Bloque({
  titulo,
  texto,
  className,
  captura,
  fondo,
}: {
  titulo: string;
  texto: string;
  className?: string;
  captura: React.ReactNode;
  fondo: string;
}) {
  return (
    <article
      className={cn("rounded-card flex flex-col overflow-hidden border bg-white", className)}
    >
      <div className={cn("flex flex-1 flex-col justify-center p-5 sm:p-6", fondo)}>{captura}</div>
      <div className="flex flex-col gap-2 border-t p-6">
        <h3 className="title-h3">{titulo}</h3>
        <p className="text-ink-2 max-w-[46ch] text-base leading-relaxed">{texto}</p>
      </div>
    </article>
  );
}

const NO_HACE = [
  {
    titulo: "Cobrar comisión",
    texto: "Ni por tus alumnos ni por los que te consultan desde el buscador de Lernio.",
  },
  {
    titulo: "Cobrar tus clases",
    texto:
      "Cobrás como siempre: alias, transferencia, efectivo o tu link de pago. Lernio lleva la cuenta.",
  },
  {
    titulo: "Corregir por vos",
    texto: "La IA te propone. La nota y lo que se manda los decidís vos.",
  },
  {
    titulo: "Reemplazar tu Meet o Zoom",
    texto: "Pegás tu link una vez y queda guardado en cada clase.",
  },
  {
    titulo: "Mandar mensajes por vos",
    texto: "Te deja el texto listo. Lo mandás vos, desde tu WhatsApp, cuando te parece.",
  },
  {
    titulo: "Prometerte alumnos",
    texto:
      "Tus clases aparecen en el buscador. Quién te consulta depende de quién busca, y eso nadie lo puede prometer.",
  },
];

const PREGUNTAS = [
  {
    pregunta: "Ya me arreglo con WhatsApp, Classroom y una planilla. ¿Para qué cambiar?",
    respuesta:
      "WhatsApp lo seguís usando: Lernio te deja los mensajes listos para mandar desde ahí. Lo que cambia es que las entregas, las notas y lo que te deben dejan de estar repartidos en cinco apps y quedan juntos, por alumno.",
  },
  {
    pregunta: "¿Mis alumnos se tienen que bajar una app?",
    respuesta:
      "No. Entran desde el navegador del celular con su email o con Google, sin contraseña. La invitación se la mandás vos por WhatsApp, con el mensaje ya escrito.",
  },
  {
    pregunta: "¿Y si mis alumnos no la usan?",
    respuesta:
      "La agenda, la asistencia, los cobros y el reporte dependen solo de vos: funcionan aunque el alumno no entre nunca. Las tareas y los simulacros, en cambio, sí los entrega desde su cuenta.",
  },
  {
    pregunta: "¿Puedo cargar a los alumnos que ya tengo?",
    respuesta:
      "Sí, es lo primero que vas a hacer. Nombre, materia y precio; el teléfono y el horario fijo, si querés. Cada uno se carga en menos de un minuto.",
  },
  {
    pregunta: "¿Cuánto sale?",
    respuesta:
      "Con 1 alumno es gratis y no te pedimos tarjeta. Para sumar más alumnos y usar la IA está el plan pago, que va por tramos según cuántos alumnos tengas.",
  },
  {
    pregunta: "¿La IA corrige por mí? ¿Y si se equivoca?",
    respuesta:
      "No corrige por vos y puede equivocarse: por eso todo lo que propone llega como borrador. La nota la ponés vos y nada le llega al alumno sin que lo revises.",
  },
  {
    pregunta: "Doy clases a chicos, ¿se puede?",
    respuesta:
      "Sí. Desde los 13 años tienen su cuenta con el consentimiento de un adulto, que lo da desde un link. Si son más chicos, trabajás igual y los avisos y el reporte le llegan a la familia.",
  },
  {
    pregunta: "¿Qué pasa con los datos de mis alumnos?",
    respuesta:
      "Son tuyos y de ellos. Tus notas privadas no las ve nadie más, ni el equipo de Lernio. El detalle está en la política de privacidad.",
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: PREGUNTAS.map((item) => ({
    "@type": "Question",
    name: item.pregunta,
    acceptedAnswer: { "@type": "Answer", text: item.respuesta },
  })),
};

export default function EnsenarPage() {
  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Hero />

      <BandaOficio
        ejemplos={[
          "el First",
          "el parcial de Análisis",
          "la tarea de Lengua",
          "las escalas",
          "el final de Física",
        ]}
      />

      <Dolores />

      {/* Lo académico: lo que diferencia a Lernio y lo primero que se muestra. */}
      <Seccion id="como-funciona" aria-labelledby="academico-titulo">
        <div className="flex flex-col gap-10">
          <EncabezadoSeccion
            id="academico-titulo"
            titulo="Tareas y simulacros, en un solo lugar"
            bajada="Armás la consigna una vez, se la asignás a quien corresponde y las entregas vuelven a un solo lugar, ordenadas por alumno."
          />
          <div className="grid gap-4 lg:grid-cols-6">
            <Bloque
              className="lg:col-span-4"
              fondo="bg-subj-uni-bg"
              titulo="Exámenes y simulacros"
              texto="Opción múltiple, respuesta numérica, desarrollo y foto, con tiempo límite y fórmulas. Lo cerrado se corrige solo y el alumno ve su nota cuando vos la publicás."
              captura={<CapturaSimulacro />}
            />
            <Bloque
              className="lg:col-span-2"
              fondo="bg-subj-school-bg"
              titulo="Tareas"
              texto="Te entregan texto, fotos, PDF o un audio grabado en el momento. Devolvés con nota y comentario desde el celular."
              captura={<CapturaTareas />}
            />
            <Bloque
              className="lg:col-span-3"
              fondo="bg-subj-lang-bg"
              titulo="El portal del alumno"
              texto="Cada alumno ve lo que tiene que entregar, sus próximas clases con el link y su historial con vos. Si el portal necesita explicación, lo arreglamos nosotros."
              captura={<CapturaPortal />}
            />
            <Bloque
              className="lg:col-span-3"
              fondo="bg-subj-music-bg"
              titulo="El reporte del mes"
              texto="Asistencia, tareas y cómo viene, en un link que la familia abre sin cuenta. Es lo que hace que quien paga vea el trabajo, no solo la clase."
              captura={<CapturaReporte />}
            />
          </div>
        </div>
      </Seccion>

      <SeccionIA />

      {/* La operación: lo que el profe se saca de encima. */}
      <Seccion fondo="cuadricula" aria-labelledby="operacion-titulo">
        <div className="flex flex-col gap-10">
          <EncabezadoSeccion
            id="operacion-titulo"
            titulo={
              <>
                Y lo que te <Resaltador>sacás de encima</Resaltador>
              </>
            }
            bajada="Agenda, asistencia y cobros, para que el viernes no sea el día de revisar el home banking alumno por alumno."
          />
          <div className="rounded-card flex flex-wrap overflow-hidden border bg-white">
            <div className="min-w-0 flex-[999_1_28rem] p-4 sm:p-6">
              <CapturaCobros />
            </div>
            <div className="bg-paper flex flex-[1_1_20rem] flex-col gap-4 border-t p-6 md:border-t-0 md:border-l">
              <h3 className="title-h3">Quién te debe, sin planilla</h3>
              <p className="text-ink-2 text-base leading-relaxed">
                Marcás la asistencia y el cargo de la clase queda hecho, por clase, por paquete o
                por mes. Ves quién debe, cuánto y desde cuándo, y le mandás el aviso con el monto y
                tu alias ya escritos.
              </p>
              <TextoListo accion="Abrir en WhatsApp">
                Hola, Lucía. Te paso el detalle de octubre: quedan 2 clases por pagar, $ 36.000. Mi
                alias es ana.ferreyra.ingles. Cualquier duda me escribís.
              </TextoListo>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <article className="rounded-card flex flex-col gap-4 border bg-white p-6">
              <h3 className="title-h3">Recordatorios en un toque</h3>
              <p className="text-ink-2 text-base leading-relaxed">
                El día antes, Lernio te muestra a quién recordarle la clase, con la hora y el link
                de Meet en el mensaje.
              </p>
              <TextoListo accion="Mandar">
                Hola, Martín. Te recuerdo la clase de mañana a las 18:30. El link es
                meet.google.com/kfp-rwta-xsd.
              </TextoListo>
            </article>
            <article className="rounded-card flex flex-col gap-4 border bg-white p-6">
              <h3 className="title-h3">El aumento, en un paso</h3>
              <p className="text-ink-2 text-base leading-relaxed">
                Elegís el porcentaje y a quiénes. Los precios nuevos se redondean a los $ 50 y lo
                que ya estaba cobrado no cambia.
              </p>
              <div className="bg-paper rounded-card mt-auto flex flex-col gap-2 p-4">
                <div className="rounded-control flex items-center justify-between gap-3 bg-white px-3.5 py-3">
                  <span className="flex items-center gap-2 font-semibold">
                    <Percent className="text-indigo-strong size-4" strokeWidth={2.4} aria-hidden />
                    Aumento de noviembre
                  </span>
                  <span className="num">8 %</span>
                </div>
                <div className="rounded-control flex items-center justify-between gap-3 bg-white px-3.5 py-3">
                  <span>Clase individual</span>
                  <span className="num">
                    <span className="text-ink-3 line-through">$ 18.000</span> $ 19.450
                  </span>
                </div>
                <div className="rounded-control flex items-center justify-between gap-3 bg-white px-3.5 py-3">
                  <span>A quiénes</span>
                  <span className="num">14 alumnos</span>
                </div>
              </div>
            </article>
          </div>
        </div>
      </Seccion>

      {/* El marketplace como beneficio para el profe (§14, punto 9). */}
      <Seccion aria-labelledby="publicar-titulo">
        <div className="flex flex-wrap items-center gap-x-16 gap-y-10">
          <div className="flex flex-[1_1_22rem] flex-col gap-6">
            <Sticker tone="resaltador" tilt="-2">
              Sin comisión
            </Sticker>
            <h2 id="publicar-titulo" className="title-h2 max-w-[14ch]">
              Tus clases, donde buscan profe
            </h2>
            <p className="text-ink-2 lead max-w-[36rem]">
              Publicás lo que das (materia, nivel, modalidad, zona y precio por clase) y aparecés en
              el buscador de Lernio. Quien te consulta lo hace adentro de Lernio: vos ves su nombre,
              no su teléfono, y él tampoco ve el tuyo.
            </p>
            <ul className="text-ink-2 flex flex-col gap-2.5 text-base">
              <li className="flex gap-3">
                <ArrowRight className="text-indigo-strong mt-1 size-4 shrink-0" aria-hidden />
                Le respondés desde la app, en una conversación.
              </li>
              <li className="flex gap-3">
                <ArrowRight className="text-indigo-strong mt-1 size-4 shrink-0" aria-hidden />
                Si arrancan, lo sumás como alumno con un toque y su precio ya cargado.
              </li>
              <li className="flex gap-3">
                <ArrowRight className="text-indigo-strong mt-1 size-4 shrink-0" aria-hidden />
                El pago lo arreglan entre ustedes, como siempre.
              </li>
            </ul>
          </div>
          <div className="relative flex flex-[1_1_24rem] flex-col gap-4 sm:pl-10">
            <div className="max-w-[22rem] sm:-rotate-2">
              <CapturaPublicacion />
            </div>
            <div className="relative z-10 sm:-mt-3 sm:ml-16">
              <CapturaConsulta />
            </div>
          </div>
        </div>
      </Seccion>

      {/* Lo que Lernio no hace, reescrita con el marketplace (§7, sección 7). */}
      <Seccion fondo="paper" aria-labelledby="no-hace-titulo">
        <div className="flex flex-wrap gap-x-16 gap-y-8">
          <h2 id="no-hace-titulo" className="title-h2 flex-[1_1_18rem]">
            Lo que Lernio no hace
          </h2>
          <dl className="border-line flex flex-[2_1_30rem] flex-col border-t">
            {NO_HACE.map((item) => (
              <div key={item.titulo} className="border-line flex gap-4 border-b py-5">
                <span className="bg-ink rounded-tag h-fit px-2.5 py-1 text-sm font-semibold text-white">
                  No
                </span>
                <div>
                  <dt className="text-lg font-semibold">{item.titulo}</dt>
                  <dd className="text-ink-2 mt-1 text-base leading-relaxed">{item.texto}</dd>
                </div>
              </div>
            ))}
          </dl>
        </div>
      </Seccion>

      <Seccion aria-labelledby="areas-titulo">
        <div className="flex flex-col gap-10">
          <EncabezadoSeccion
            id="areas-titulo"
            titulo="Pensado para cómo das clase"
            bajada="Cuatro áreas, cada una con lo suyo. Elegí la tuya y mirá cómo se ve tu semana."
          />
          <div className="flex flex-wrap gap-4">
            {PAGINAS_AREA.map((pagina) => (
              <TileArea
                key={pagina.slug}
                area={pagina.area}
                href={`/ensenar/${pagina.slug}`}
                nombre={pagina.nombre}
                glifo={pagina.glifo}
              >
                {pagina.tile}
              </TileArea>
            ))}
          </div>
        </div>
      </Seccion>

      <Testimonios />

      <Planes />

      <Seccion aria-labelledby="preguntas-titulo">
        <div className="flex flex-wrap gap-x-16 gap-y-8">
          <div className="flex flex-[1_1_18rem] flex-col gap-4">
            <h2 id="preguntas-titulo" className="title-h2">
              Preguntas
            </h2>
            <p className="text-ink-2 text-base">
              ¿Te quedó otra?{" "}
              <Link
                href="/contacto"
                className="text-indigo-strong font-semibold underline-offset-4 hover:underline"
              >
                Escribinos
              </Link>
              . Los detalles están en los{" "}
              <Link
                href="/terminos"
                className="text-indigo-strong underline-offset-4 hover:underline"
              >
                términos
              </Link>{" "}
              y la{" "}
              <Link
                href="/privacidad"
                className="text-indigo-strong underline-offset-4 hover:underline"
              >
                privacidad
              </Link>
              .
            </p>
          </div>
          <div className="flex-[2_1_30rem]">
            <Preguntas items={PREGUNTAS} />
          </div>
        </div>
      </Seccion>

      <Sumarme />
    </main>
  );
}
