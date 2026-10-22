import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// Único lugar del rojo fuera de los controles: errores del sistema y de validación (§2.5).
// El texto dice qué pasó y qué hacer, sin "Error:" y sin culpar a nadie.
export function FormError({
  id,
  className,
  children,
}: {
  id?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <p id={id} role="alert" className={cn("text-error text-sm", className)}>
      {children}
    </p>
  );
}

export function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && !error && <p className="text-ink-3 text-sm">{hint}</p>}
      {error && <FormError>{error}</FormError>}
    </div>
  );
}
