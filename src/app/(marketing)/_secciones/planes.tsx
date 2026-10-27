import Link from "next/link";
import { Check } from "lucide-react";
import { EncabezadoSeccion, Seccion } from "@/components/expresivos/marco";
import { Sticker } from "@/components/expresivos/sticker";
import { buttonVariants } from "@/components/ui/button";

// Planes de Lernio (plan del MVP, §3): gratis con 1 alumno y sin IA; pago por tramos de alumnos,
// con IA. El precio y los tramos no están decididos: el placeholder queda a la vista hasta que se
// definan en `producto`, y nunca se inventa.
const PRECIO_PENDIENTE = "[Precio a definir]";

const GRATIS = [
  "Tareas, exámenes y simulacros",
  "Agenda, asistencia y cobros",
  "Avisos con el texto listo para WhatsApp",
  "Reporte del mes para quien paga",
  "Publicar tus clases y recibir consultas",
];

const PAGO = [
  "Todo lo del plan gratis",
  "Más alumnos, según el tramo que elijas",
  "La IA te propone preguntas, correcciones y el comentario del reporte",
  "Un tope mensual de IA que sube con el tramo",
];

function Lista({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {items.map((item) => (
        <li key={item} className="flex gap-3 leading-snug">
          <Check
            className="text-indigo-strong mt-0.5 size-4 shrink-0"
            strokeWidth={2.6}
            aria-hidden
          />
          {item}
        </li>
      ))}
    </ul>
  );
}

export function Planes() {
  return (
    <Seccion id="planes" fondo="paper" aria-labelledby="planes-titulo">
      <div className="flex flex-col gap-10">
        <EncabezadoSeccion
          id="planes-titulo"
          titulo="Empezás gratis. Pagás si crecés."
          bajada="Con un alumno no pagás nada. Pasás al plan pago cuando quieras sumar alumnos o usar la IA."
        />
        <div className="flex flex-wrap gap-4">
          <div className="rounded-card relative flex flex-[1_1_20rem] flex-col gap-6 border bg-white p-7">
            <Sticker tone="resaltador" tilt="3" className="absolute -top-4 right-6">
              Gratis con 1 alumno
            </Sticker>
            <div className="space-y-2">
              <p className="title-h3">Gratis</p>
              <p>
                <span className="num-kpi">$ 0</span>{" "}
                <span className="text-ink-3">con 1 alumno</span>
              </p>
            </div>
            <Lista items={GRATIS} />
            <Link
              href="#crear-cuenta"
              className={buttonVariants({ variant: "secondary", className: "mt-auto w-full" })}
            >
              Crear mi cuenta gratis
            </Link>
          </div>
          <div className="rounded-card border-indigo flex flex-[1_1_20rem] flex-col gap-6 border bg-white p-7">
            <div className="space-y-2">
              <p className="title-h3">Plan pago</p>
              <p className="flex flex-wrap items-baseline gap-2">
                <span className="num border-border-input text-ink-3 rounded-tag border border-dashed px-2 py-1 text-lg">
                  {PRECIO_PENDIENTE}
                </span>
                <span className="text-ink-3">por mes, según tus alumnos</span>
              </p>
            </div>
            <Lista items={PAGO} />
            <p className="text-ink-3 mt-auto text-sm">
              Lo activás desde la app, cuando lo necesites. Se paga con Mercado Pago.
            </p>
          </div>
        </div>
      </div>
    </Seccion>
  );
}
