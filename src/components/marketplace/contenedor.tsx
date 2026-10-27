import { cn } from "@/lib/utils";

// Mismo contenedor que el sitio para profes (§7): 75 rem y padding lateral fluido.
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
