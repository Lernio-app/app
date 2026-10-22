import * as React from "react";
import { fieldClasses } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// Selector nativo con el aspecto de los campos de la app. En el celular abre el selector del sistema.
export function NativeSelect({ className, ...props }: React.ComponentProps<"select">) {
  return <select className={cn(fieldClasses, "h-(--control-h)", className)} {...props} />;
}
