import { Surface } from "@/components/ui/surface";

// Las páginas públicas del sitio que no son el marketplace: «Para profes», legales, Contacto (§1.1).
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return <Surface name="marketing">{children}</Surface>;
}
