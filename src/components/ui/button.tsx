import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Botones (§6). Un solo `default` (índigo) por vista: el resto, secondary o ghost.
// No hay variante roja: el rojo es solo para errores del sistema. El alto sale de la superficie.
const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-control border border-transparent text-sm font-semibold whitespace-nowrap transition-colors select-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-indigo-strong",
        secondary: "border-border-control bg-white text-ink hover:bg-paper",
        ghost: "text-ink-3 hover:bg-paper hover:text-ink",
        onIndigo: "bg-white text-indigo-strong hover:bg-indigo-soft",
        outlineOnIndigo: "border-indigo-outline text-white hover:bg-indigo-strong",
        link: "text-indigo-strong underline-offset-4 hover:underline",
      },
      size: {
        default: "h-(--control-h) px-4",
        compact: "h-7.5 px-2.5 text-[13px]",
        icon: "size-(--control-h)",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
