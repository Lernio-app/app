import { cn } from "@/lib/utils";

// Piezas de maquetación del sitio para profes (§7, "Sitio para profes"): contenedor de 75 rem,
// padding lateral fluido y secciones de 5,5 rem. Compartidas con la home del marketplace.

export function Contenedor({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-300 px-[clamp(1.25rem,4vw,2.5rem)]", className)}>
      {children}
    </div>
  );
}

export function Seccion({
  id,
  fondo = "blanco",
  className,
  children,
  ...props
}: {
  id?: string;
  // "cuadricula" alterna secciones (§5.1); nunca debajo de texto largo.
  fondo?: "blanco" | "cuadricula" | "paper";
  className?: string;
  children: React.ReactNode;
} & React.AriaAttributes) {
  return (
    <section
      id={id}
      className={cn(
        "scroll-mt-20",
        fondo === "cuadricula" && "bg-cuadricula border-line border-y",
        fondo === "paper" && "bg-paper border-line border-y",
        className,
      )}
      {...props}
    >
      <Contenedor className="py-[clamp(4rem,9vw,5.5rem)]">{children}</Contenedor>
    </section>
  );
}

// Título de sección con bajada opcional a la derecha en escritorio.
export function EncabezadoSeccion({
  titulo,
  bajada,
  id,
}: {
  titulo: React.ReactNode;
  bajada?: React.ReactNode;
  id?: string;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-12 gap-y-4">
      <h2 id={id} className="title-h2 text-ink max-w-[18ch] text-balance">
        {titulo}
      </h2>
      {bajada && <p className="text-ink-2 max-w-md text-[1.0625rem] leading-relaxed">{bajada}</p>}
    </div>
  );
}
