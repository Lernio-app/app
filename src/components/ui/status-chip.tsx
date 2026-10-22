import { AlertCircle, Check, Clock, X, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// Chip de estado (§2.3 y §6). El estado nunca va solo por color: el ícono es obligatorio y viene
// con la variante. Deudas en ámbar, nunca en rojo. "Próxima" es el único chip índigo sólido.
export type Status = "ok" | "pending" | "debt" | "next";

const STYLES: Record<Status, { className: string; icon: LucideIcon | null }> = {
  ok: { className: "bg-ok-bg text-ok", icon: Check },
  pending: { className: "bg-pending-bg text-pending", icon: Clock },
  debt: { className: "bg-debt-bg text-debt", icon: AlertCircle },
  next: { className: "bg-indigo text-white", icon: null },
};

export function StatusChip({
  status,
  cross = false,
  children,
  className,
}: {
  status: Status;
  // Para "Faltó sin avisar" y "Cancelada": cambia el ícono por una x.
  cross?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  const { className: tone, icon } = STYLES[status];
  const Icon = cross ? X : icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full py-0.75 pr-2.25 pl-1.75 text-xs leading-none font-semibold whitespace-nowrap",
        !Icon && "pl-2.25",
        tone,
        className,
      )}
    >
      {Icon && <Icon className="size-3" strokeWidth={2.6} aria-hidden />}
      {children}
    </span>
  );
}
