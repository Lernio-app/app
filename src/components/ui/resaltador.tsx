import { cn } from "@/lib/utils";

// Resaltador (§5.2). Máximo uno por pantalla, solo en la frase clave de un título, la fecha o el mes
// de la pantalla y una frase del comentario del profe. Nunca en montos, estados, botones ni links:
// por eso solo acepta texto (el lint lernio/resaltador controla el resto).
// Sobre fondo índigo no va el trazo: va un bloque amarillo entero, con tinta y rotado −2°.
export function Resaltador({
  children,
  variant = "trazo",
}: {
  children: string;
  variant?: "trazo" | "bloque";
}) {
  return (
    <span
      className={cn(
        variant === "trazo" && "resaltador",
        variant === "bloque" &&
          "bg-highlighter text-ink rounded-control inline-block -rotate-2 px-[0.15em]",
      )}
    >
      {children}
    </span>
  );
}
