import { Label } from "@/components/ui/label";

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
      {hint && !error && <p className="text-muted-foreground text-sm">{hint}</p>}
      {error && (
        <p role="alert" className="text-status-error text-sm">
          {error}
        </p>
      )}
    </div>
  );
}
