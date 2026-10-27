"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Menú del celular (§12.4): los mismos tres ítems que la barra de escritorio.
export function MenuCelular({ items }: { items: { href: string; texto: string }[] }) {
  const [abierto, setAbierto] = useState(false);
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierto) return;
    const alTeclear = (evento: KeyboardEvent) => evento.key === "Escape" && setAbierto(false);
    document.addEventListener("keydown", alTeclear);
    return () => document.removeEventListener("keydown", alTeclear);
  }, [abierto]);

  return (
    <div className="sm:hidden">
      <button
        type="button"
        aria-expanded={abierto}
        aria-controls="menu-celular"
        aria-label={abierto ? "Cerrar menú" : "Abrir menú"}
        onClick={() => setAbierto((valor) => !valor)}
        className={buttonVariants({ variant: "ghost", size: "icon" })}
      >
        {abierto ? <X strokeWidth={1.8} aria-hidden /> : <Menu strokeWidth={1.8} aria-hidden />}
      </button>
      <div
        ref={panel}
        id="menu-celular"
        hidden={!abierto}
        className="border-line absolute inset-x-0 top-full border-b bg-white"
      >
        <nav aria-label="Menú" className="flex flex-col px-5 py-3">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              // El layout no se vuelve a montar al navegar: se cierra al tocar un ítem.
              onClick={() => setAbierto(false)}
              className={cn(
                "border-line-soft flex min-h-12 items-center border-b text-base font-semibold last:border-b-0",
              )}
            >
              {item.texto}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
