import { cn } from "@/lib/utils";

// Carpetas por área (§2.4). La clave es la que guarda `areas.color`; "otra" usa el gris de Pendiente.
// El color nunca aparece solo: siempre acompaña al nombre del área, la materia o el alumno.
export type Area = "idiomas" | "ingreso" | "apoyo" | "musica" | "otra";

const AREAS: Record<Area, { solid: string; tint: string; ink: string }> = {
  idiomas: { solid: "bg-subj-lang", tint: "bg-subj-lang-bg", ink: "text-subj-lang-ink" },
  ingreso: { solid: "bg-subj-uni", tint: "bg-subj-uni-bg", ink: "text-subj-uni-ink" },
  apoyo: { solid: "bg-subj-school", tint: "bg-subj-school-bg", ink: "text-subj-school-ink" },
  musica: { solid: "bg-subj-music", tint: "bg-subj-music-bg", ink: "text-subj-music-ink" },
  otra: { solid: "bg-pending-solid", tint: "bg-pending-bg", ink: "text-pending" },
};

// Cuadrado de 9–10 px junto al nombre, o barra de 10×28 en la agenda.
export function AreaSwatch({ area, shape = "square" }: { area: Area; shape?: "square" | "bar" }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-block shrink-0",
        shape === "square" ? "size-2.5 rounded-[2px]" : "h-7 w-2.5 rounded-[3px]",
        AREAS[area].solid,
      )}
    />
  );
}

// Tag con el tint del área y el nombre de la materia.
export function AreaTag({ area, children }: { area: Area; children: React.ReactNode }) {
  const { tint, ink } = AREAS[area];
  return (
    <span
      className={cn(
        "rounded-tag inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold",
        tint,
        ink,
      )}
    >
      <AreaSwatch area={area} />
      {children}
    </span>
  );
}

// Avatar del profe: el sólido de su área principal con las iniciales en Bricolage.
export function TeacherAvatar({
  area,
  name,
  size = 44,
}: {
  area: Area;
  name: string;
  size?: 32 | 44 | 56 | 72;
}) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");
  return (
    <span
      aria-hidden
      style={{ width: size, height: size, fontSize: size * 0.4, borderRadius: size * 0.32 }}
      className={cn(
        "font-display inline-flex shrink-0 items-center justify-center font-extrabold text-white",
        AREAS[area].solid,
      )}
    >
      {initials}
    </span>
  );
}
