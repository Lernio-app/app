import Link from "next/link";
import { Search } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { Contenedor } from "./contenedor";
import { MenuCelular } from "./menu-celular";

// Menú del sitio (ADR-0008): Clases, Para profes e Ingresar. Ingresar es uno solo para profes y
// alumnos. En el celular: logo, búsqueda y menú con los mismos tres ítems (§12.4).
const ITEMS = [
  { href: "/clases", texto: "Clases" },
  { href: "/ensenar", texto: "Para profes" },
  { href: "/ingresar", texto: "Ingresar" },
];

export function EncabezadoMarketplace({ actual }: { actual?: "clases" }) {
  return (
    <header className="border-line sticky top-0 z-20 border-b bg-white">
      <Contenedor className="relative flex h-16 items-center justify-between gap-4">
        <Link href="/" className="rounded-control -m-1 p-1" aria-label="Lernio, inicio">
          <Logo />
        </Link>
        <nav aria-label="Principal" className="hidden items-center gap-1 sm:flex">
          <Link
            href="/clases"
            aria-current={actual === "clases" ? "page" : undefined}
            className={buttonVariants({
              variant: "ghost",
              className: actual === "clases" ? "text-ink" : undefined,
            })}
          >
            Clases
          </Link>
          <Link href="/ensenar" className={buttonVariants({ variant: "ghost" })}>
            Para profes
          </Link>
          <Link href="/ingresar" className={buttonVariants({ variant: "secondary" })}>
            Ingresar
          </Link>
        </nav>
        <div className="flex items-center gap-1 sm:hidden">
          <Link
            href="/clases"
            aria-label="Buscar clases"
            className={buttonVariants({ variant: "ghost", size: "icon" })}
          >
            <Search strokeWidth={1.8} aria-hidden />
          </Link>
          <MenuCelular items={ITEMS} />
        </div>
      </Contenedor>
    </header>
  );
}
