import { cn } from "@/lib/utils";

// Logo provisional (§5.6): cuadrado índigo de radio 9 con un trazo de resaltador en el tercio
// inferior, más "Lernio" en Bricolage 800.
export function Logo({ className, withWord = true }: { className?: string; withWord?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span aria-hidden className="bg-indigo relative size-7 shrink-0 rounded-[9px]">
        <span className="bg-highlighter absolute inset-x-1.5 bottom-[22%] h-1.5 rounded-[2px]" />
      </span>
      {withWord ? (
        <span className="font-display text-ink text-xl font-extrabold tracking-[-0.03em]">
          Lernio
        </span>
      ) : (
        <span className="sr-only">Lernio</span>
      )}
    </span>
  );
}
