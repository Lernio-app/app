import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { Contenedor } from "./contenedor";

// Pie del marketplace (§12.4): Blog, Contacto, Quiénes somos, Términos y Privacidad.
const ENLACES = [
  { href: "/blog", texto: "Blog" },
  { href: "/contacto", texto: "Contacto" },
  { href: "/quienes-somos", texto: "Quiénes somos" },
  { href: "/terminos", texto: "Términos" },
  { href: "/privacidad", texto: "Privacidad" },
];

export function PieMarketplace({ hechoCon = false }: { hechoCon?: boolean }) {
  return (
    <footer className="border-line border-t bg-white">
      <Contenedor className="flex flex-col gap-6 py-8">
        <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-5">
          <Logo />
          <nav aria-label="Pie" className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
            {ENLACES.map((enlace) => (
              <Link
                key={enlace.href}
                href={enlace.href}
                className="text-ink-3 hover:text-ink flex min-h-11 items-center"
              >
                {enlace.texto}
              </Link>
            ))}
          </nav>
        </div>
        {hechoCon && (
          <p className="text-ink-3 max-w-[62ch] text-sm">
            Hecho con Lernio. Lernio no cobra comisión ni procesa pagos: el pago se arregla con el
            profe.
          </p>
        )}
      </Contenedor>
    </footer>
  );
}
