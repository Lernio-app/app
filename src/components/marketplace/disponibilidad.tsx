import { Check } from "lucide-react";
import {
  COLOR_DEL_AREA,
  DIAS,
  FRANJAS,
  resumenDisponibilidad,
  type AreaSlug,
  type Disponibilidad,
} from "@/lib/marketplace";
import { cn } from "@/lib/utils";

// Color del área (§2.4) para los casilleros y la grilla. Siempre acompañan a un texto equivalente.
const SOLIDO = {
  idiomas: "bg-subj-lang",
  ingreso: "bg-subj-uni",
  apoyo: "bg-subj-school",
  musica: "bg-subj-music",
} as const;
const TINT = {
  idiomas: "bg-subj-lang-bg text-subj-lang-ink",
  ingreso: "bg-subj-uni-bg text-subj-uni-ink",
  apoyo: "bg-subj-school-bg text-subj-school-ink",
  musica: "bg-subj-music-bg text-subj-music-ink",
} as const;

// Fila de 7 casilleros (L a D) con el resumen debajo (§12.7). Los días con horario van en el
// sólido del área y los demás en gris papel.
export function Casilleros({
  disponibilidad,
  area,
  className,
}: {
  disponibilidad: Disponibilidad;
  area: AreaSlug;
  className?: string;
}) {
  const resumen = resumenDisponibilidad(disponibilidad);
  const hay = Object.values(disponibilidad).some((franjas) => franjas && franjas.length > 0);
  const color = COLOR_DEL_AREA[area];
  return (
    <div className={cn("space-y-1.5", className)}>
      <div
        role="img"
        aria-label={hay ? `Tiene horarios: ${resumen.toLowerCase()}` : "Sin horarios cargados"}
        className="flex gap-1"
      >
        {DIAS.map(({ clave }) => {
          const activo = (disponibilidad[clave]?.length ?? 0) > 0;
          return (
            <span
              key={clave}
              aria-hidden
              className={cn(
                "rounded-key flex size-4.5 items-center justify-center text-xs leading-none font-semibold",
                activo ? cn(SOLIDO[color], "text-white") : "bg-paper text-ink-3",
              )}
            >
              {clave}
            </span>
          );
        })}
      </div>
      <p className="text-ink-2 truncate text-sm">{resumen}</p>
    </div>
  );
}

// Grilla de 7 días por 3 franjas (§12.8). Las celdas libres van en el tint del área y, además, con
// un check y un texto para lectores de pantalla: el color nunca va solo.
export function GrillaHorarios({
  disponibilidad,
  area,
}: {
  disponibilidad: Disponibilidad;
  area: AreaSlug;
}) {
  const color = COLOR_DEL_AREA[area];
  return (
    <div className="space-y-3">
      <div className="relative overflow-x-auto">
        <table className="w-full min-w-[20rem] table-fixed border-separate border-spacing-1 text-sm">
          <caption className="sr-only">
            Horarios aproximados por día y franja. {resumenDisponibilidad(disponibilidad)}.
          </caption>
          <thead>
            <tr>
              <td className="w-16" />
              {DIAS.map(({ clave, nombre }) => (
                <th key={clave} scope="col" className="text-ink-3 pb-1 text-xs font-medium">
                  <span aria-hidden>{clave}</span>
                  <span className="sr-only">{nombre}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FRANJAS.map((franja) => (
              <tr key={franja.clave}>
                <th scope="row" className="pr-2 text-left align-middle text-xs font-medium">
                  <span className="text-ink block">{franja.nombre}</span>
                  <span className="text-ink-3 num block">{franja.horas}</span>
                </th>
                {DIAS.map(({ clave, nombre }) => {
                  const libre = disponibilidad[clave]?.includes(franja.clave) ?? false;
                  return (
                    <td
                      key={clave}
                      className={cn(
                        "rounded-tag h-10 text-center align-middle",
                        libre ? TINT[color] : "bg-paper text-ink-3",
                      )}
                    >
                      {libre ? (
                        <Check className="mx-auto size-4" strokeWidth={2.4} aria-hidden />
                      ) : (
                        <span aria-hidden>·</span>
                      )}
                      <span className="sr-only">
                        {`${nombre}, ${franja.nombre.toLowerCase()}: ${libre ? "con horario" : "sin horario"}`}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-ink-3 text-sm">Horarios aproximados. Los confirmás con el profe.</p>
    </div>
  );
}
