import * as React from "react";
import { cn } from "@/lib/utils";

// Selector nativo con el aspecto de los campos de la app. En el celular abre el selector del sistema.
export function NativeSelect({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      className={cn(
        "border-input focus-visible:border-ring focus-visible:ring-ring/50 dark:bg-input/30 h-11 w-full rounded-lg border bg-transparent px-2.5 text-base outline-none focus-visible:ring-3 md:text-sm",
        className,
      )}
      {...props}
    />
  );
}
