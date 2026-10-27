"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Home, Settings, Users, Wallet, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: LucideIcon };

// Solo lo que existe. Cada fase suma su pantalla acá: Tareas (F5), Exámenes (F6) y Reportes (F8).
const ITEMS: NavItem[] = [
  { href: "/app", label: "Inicio", icon: Home },
  { href: "/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/alumnos", label: "Alumnos", icon: Users },
  { href: "/cobros", label: "Cobros", icon: Wallet },
  { href: "/ajustes", label: "Ajustes", icon: Settings },
];

function useIsActive() {
  const pathname = usePathname();
  return (href: string) => (href === "/app" ? pathname === "/app" : pathname.startsWith(href));
}

// Barra inferior para el celular: todo se resuelve con el pulgar.
export function BottomNav() {
  const isActive = useIsActive();
  return (
    <nav
      aria-label="Principal"
      className="fixed inset-x-0 bottom-0 z-20 border-t bg-white pb-[max(env(safe-area-inset-bottom),--spacing(3))] md:hidden"
    >
      <ul className="grid grid-cols-5">
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs font-semibold",
                  active ? "text-indigo-strong" : "text-ink-2",
                )}
              >
                {/* El activo lleva una píldora de 52×28 detrás del ícono. */}
                <span
                  className={cn(
                    "flex h-7 w-13 items-center justify-center rounded-full",
                    active && "bg-indigo-soft",
                  )}
                >
                  <Icon className="size-5" strokeWidth={1.8} aria-hidden />
                </span>
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
                  "rounded-control flex h-9 items-center gap-3 px-3 text-sm font-medium",
                  active
                    ? "bg-indigo-soft text-indigo-strong font-semibold"
                    : "text-ink-2 hover:bg-paper hover:text-ink",
                )}
              >
                <Icon className="size-4" strokeWidth={1.8} aria-hidden />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
