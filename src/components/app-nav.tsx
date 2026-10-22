"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Home, Settings, Users, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: LucideIcon };

// Solo lo que existe. Cada fase suma su pantalla acá: Tareas (F5), Exámenes (F6), Cobros (F3) y Reportes (F8).
const ITEMS: NavItem[] = [
  { href: "/", label: "Inicio", icon: Home },
  { href: "/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/alumnos", label: "Alumnos", icon: Users },
  { href: "/ajustes", label: "Ajustes", icon: Settings },
];

function useIsActive() {
  const pathname = usePathname();
  return (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
}

// Barra inferior para el celular: todo se resuelve con el pulgar.
export function BottomNav() {
  const isActive = useIsActive();
  return (
    <nav
      aria-label="Principal"
      className="bg-card fixed inset-x-0 bottom-0 z-20 border-t pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className="grid grid-cols-4">
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-1 text-xs font-medium",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className="size-5" aria-hidden />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

// Navegación lateral para escritorio.
export function SideNav() {
  const isActive = useIsActive();
  return (
    <nav aria-label="Principal" className="flex-1">
      <ul className="space-y-1">
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium",
                  active
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="size-4" aria-hidden />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
