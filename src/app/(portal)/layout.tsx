import { Surface } from "@/components/ui/surface";

// Lo que abre el alumno o el responsable de pago: el profe primero, Lernio a lo sumo en el pie (§8).
export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return <Surface name="portal">{children}</Surface>;
}
