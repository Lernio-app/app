import { Surface } from "@/components/ui/surface";

// El alta del espacio del profe va en la app (§1.1).
export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return <Surface name="app">{children}</Surface>;
}
