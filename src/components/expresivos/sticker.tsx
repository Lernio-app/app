import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// Sticker (§5.3): píldora o rectángulo rotado, siempre estático, solo con información real y
// verificable ("Gratis con 1 alumno", "Sin comisión"). Nunca un botón ni un claim de venta.
export type StickerTone = "resaltador" | "indigo" | "idiomas" | "ingreso" | "apoyo" | "musica";

const TONES: Record<StickerTone, string> = {
  resaltador: "bg-highlighter text-ink",
  indigo: "bg-indigo text-white",
  idiomas: "bg-subj-lang-bg text-subj-lang-ink",
  ingreso: "bg-subj-uni-bg text-subj-uni-ink",
  apoyo: "bg-subj-school-bg text-subj-school-ink",
  musica: "bg-subj-music-bg text-subj-music-ink",
};

// Rotaciones con nombre: entre ±2° y ±6° (§5.3).
const TILTS = {
  "-6": "-rotate-6",
  "-3": "-rotate-3",
  "-2": "-rotate-2",
  "2": "rotate-2",
  "3": "rotate-3",
  "5": "rotate-[5deg]",
} as const;

export function Sticker({
  tone = "resaltador",
  tilt = "-3",
  shape = "rect",
  icon: Icon,
  className,
  children,
}: {
  tone?: StickerTone;
  tilt?: keyof typeof TILTS;
  shape?: "rect" | "pill";
  icon?: LucideIcon;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-2 px-3.5 py-2 text-[0.9375rem] leading-none font-semibold whitespace-nowrap select-none",
        shape === "rect" ? "rounded-[10px]" : "rounded-full",
        TONES[tone],
        TILTS[tilt],
        className,
      )}
    >
      {Icon && <Icon className="size-4" strokeWidth={2.2} aria-hidden />}
      {children}
    </span>
  );
}
