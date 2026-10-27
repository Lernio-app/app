import { EncabezadoSeccion, Seccion } from "@/components/expresivos/marco";
import { AreaSwatch } from "@/components/ui/area";
import { DATOS_DE_USO, TESTIMONIOS, type Testimonio } from "@/content/ensenar";
import { cn } from "@/lib/utils";

// Prueba social: frases de los primeros profes y datos de uso. Lo pendiente se ve como pendiente
// (borde punteado), igual que el precio del plan pago, para que nadie lo publique por error.

function Cita({ testimonio, grande = false }: { testimonio: Testimonio; grande?: boolean }) {
  return (
    <figure
      className={cn(
        "rounded-card flex flex-col gap-5 border bg-white p-6 sm:p-7",
        testimonio.pendiente && "border-border-input border-dashed",
      )}
    >
      <blockquote
        className={cn(
          "text-ink leading-snug",
          grande ? "title-h3" : "text-lg",
          testimonio.pendiente && "text-ink-3",
        )}
      >
        {testimonio.frase}
      </blockquote>
      <figcaption className="mt-auto flex items-center gap-3">
        <AreaSwatch area={testimonio.area} />
        <span className="leading-tight">
          <span className="block font-semibold">{testimonio.nombre}</span>
          <span className="text-ink-3">{testimonio.detalle}</span>
        </span>
      </figcaption>
    </figure>
  );
}

// En /ensenar: las cuatro áreas y los datos de uso.
export function Testimonios() {
  return (
    <Seccion aria-labelledby="testimonios-titulo">
      <div className="flex flex-col gap-10">
        <EncabezadoSeccion
          id="testimonios-titulo"
          titulo="Lo que cuentan los primeros profes"
          bajada="Profes que ya corrigen, cobran y mandan el reporte desde Lernio, con sus alumnos de verdad."
        />
        <div className="grid gap-4 md:grid-cols-2">
          {TESTIMONIOS.map((testimonio) => (
            <Cita key={testimonio.area} testimonio={testimonio} />
          ))}
        </div>
        <dl className="border-line grid gap-x-10 gap-y-4 border-t pt-8 sm:grid-cols-3">
          {DATOS_DE_USO.map((dato) => (
            <div key={dato.texto} className="flex flex-col gap-1">
              <dt className="text-ink-2 order-2">{dato.texto}</dt>
              <dd className="num-kpi text-ink order-1">{dato.valor}</dd>
            </div>
          ))}
        </dl>
      </div>
    </Seccion>
  );
}

// En /ensenar/[area]: la frase de un profe de esa área, grande.
export function TestimonioDelArea({ area }: { area: Testimonio["area"] }) {
  const testimonio = TESTIMONIOS.find((item) => item.area === area);
  if (!testimonio) return null;
  return (
    <Seccion fondo="paper" aria-label="Lo que cuenta un profe">
      <div className="mx-auto max-w-3xl">
        <Cita testimonio={testimonio} grande />
      </div>
    </Seccion>
  );
}
