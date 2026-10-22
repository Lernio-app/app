import * as React from "react";
import { Input as InputPrimitive } from "@base-ui/react/input";
import { cn } from "@/lib/utils";

// Campos (§6): 16 px siempre (iOS no hace zoom) y borde --border-input, que llega a 3:1.
export const fieldClasses =
  "border-border-input placeholder:text-ink-3 aria-invalid:border-error rounded-control w-full min-w-0 border bg-white px-3 text-base text-ink transition-colors disabled:cursor-not-allowed disabled:bg-paper disabled:opacity-60";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(fieldClasses, "h-(--control-h)", className)}
      {...props}
    />
  );
}

export { Input };
