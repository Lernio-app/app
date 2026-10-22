import { cn } from "@/lib/utils";

// Las cinco superficies (§1.1). La marca el layout de cada grupo de rutas; los componentes leen sus
// tokens (radio, alto de control, cuadrícula) y no deciden por su cuenta. Se anida cuando una
// superficie se muestra dentro de otra (capturas de la app en marketing, vista previa de una clase).
export type SurfaceName = "marketplace" | "marketing" | "app" | "portal" | "interno";

export function Surface({
  name,
  className,
  children,
}: {
  name: SurfaceName;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div data-surface={name} className={cn("flex min-h-full flex-1 flex-col", className)}>
      {children}
    </div>
  );
}
