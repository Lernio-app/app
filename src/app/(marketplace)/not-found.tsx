import Link from "next/link";
import { Contenedor } from "@/components/marketplace/contenedor";
import { buttonVariants } from "@/components/ui/button";

// Una clase, un perfil o una entrada que no existe, o que el profe despublicó.
export default function NoEncontrado() {
  return (
    <main>
      <Contenedor className="flex flex-col items-start gap-5 py-20">
        <h1 className="title-listing text-ink max-w-[20ch] text-balance">
          No encontramos esa página.
        </h1>
        <p className="text-ink-2 max-w-[52ch]">
          Puede que el profe haya despublicado la clase o que el link esté incompleto. Probá buscar
          de nuevo.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/clases" className={buttonVariants({ variant: "secondary" })}>
            Ver las clases
          </Link>
          <Link href="/" className={buttonVariants({ variant: "ghost" })}>
            Ir al inicio
          </Link>
        </div>
      </Contenedor>
    </main>
  );
}
