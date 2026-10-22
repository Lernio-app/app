import { Surface } from "@/components/ui/surface";

// /ingresar es pública y la mayoría llega desde el sitio: va en el marketplace (§1.1).
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <Surface name="marketplace">{children}</Surface>;
}
