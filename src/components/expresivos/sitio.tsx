import Link from "next/link";
import { ArrowRight, Music, Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import type { Area } from "@/components/ui/area";
import { cn } from "@/lib/utils";
import { Contenedor } from "./marco";

// Menú del sitio (ADR-0008): Clases, Para profes e Ingresar. "Clases" aparece cuando exista el
// catálogo del marketplace (F11): hasta entonces no se muestra lo que no está disponible (§9).
export const MARKETPLACE_PUBLICADO = false;

export function EncabezadoSitio({ actual }: { actual?: "ensenar" }) {
  return (
    <header className="border-line sticky top-0 z-20 border-b bg-white">
      <Contenedor className="flex h-16 items-center justify-between gap-4">
        <Link href="/ensenar" className="rounded-control -m-1 p-1" aria-label="Lernio, para profes">
          <Logo />
        </Link>
        <nav aria-label="Principal" className="flex items-center gap-1 sm:gap-2">
          {MARKETPLACE_PUBLICADO && (
            <Link href="/clases" className={buttonVariants({ variant: "ghost" })}>
              Clases
            </Link>
          )}
          <Link
            href="/ensenar"
            aria-current={actual === "ensenar" ? "page" : undefined}
            className={cn(
              buttonVariants({ variant: "ghost" }),
              "hidden sm:inline-flex",
              actual === "ensenar" && "text-ink",
            )}
          >
            Para profes
          </Link>
          <Link href="/ingresar" className={buttonVariants({ variant: "ghost" })}>
            Ingresar
          </Link>
          <Link href="/ensenar#crear-cuenta" className={buttonVariants({ variant: "secondary" })}>
            Crear cuenta
          </Link>
        </nav>
      </Contenedor>
    </header>
  );
}

const PIE = [
  { href: "/ensenar", texto: "Para profes" },
  { href: "/quienes-somos", texto: "Quiénes somos" },
  { href: "/contacto", texto: "Contacto" },
  { href: "/terminos", texto: "Términos" },
  { href: "/privacidad", texto: "Privacidad" },
];

export function PieSitio() {
  return (
    <footer className="border-line border-t bg-white">
      <Contenedor className="flex flex-wrap items-center justify-between gap-x-8 gap-y-5 py-8">
        <Logo />
        <nav aria-label="Pie" className="flex flex-wrap gap-x-6 gap-y-2 text-[14px]">
          {PIE.map((link) => (
            <Link key={link.href} href={link.href} className="text-ink-3 hover:text-ink py-1.5">
              {link.texto}
            </Link>
          ))}
        </nav>
      </Contenedor>
    </footer>
  );
}

// Banda índigo con ejemplos del oficio (§7, sección 3). Los separadores alternan resaltador y
// tintes de área: es una lista, no un gráfico.
const SEPARADORES = ["bg-highlighter", "bg-subj-school-bg", "bg-subj-music-bg", "bg-subj-lang-bg"];

export function BandaOficio({ ejemplos }: { ejemplos: string[] }) {
  return (
    <div className="bg-indigo text-white">
      <Contenedor className="py-7">
        <p className="title-strip flex flex-wrap items-center gap-x-6 gap-y-2">
          {ejemplos.map((ejemplo, i) => (
            <span key={ejemplo} className="inline-flex items-center gap-6">
              <span>{ejemplo}</span>
              {i < ejemplos.length - 1 && (
                <span
                  aria-hidden
                  className={cn("size-3.5 rounded-[4px]", SEPARADORES[i % SEPARADORES.length])}
                />
              )}
            </span>
          ))}
        </p>
      </Contenedor>
    </div>
  );
}

const TILE: Record<Exclude<Area, "otra">, { fondo: string; glifo: string; texto: string }> = {
  idiomas: { fondo: "bg-subj-lang-bg", glifo: "text-subj-lang", texto: "text-subj-lang-ink" },
  ingreso: { fondo: "bg-subj-uni-bg", glifo: "text-subj-uni", texto: "text-subj-uni-ink" },
  apoyo: { fondo: "bg-subj-school-bg", glifo: "text-subj-school", texto: "text-subj-school-ink" },
  musica: { fondo: "bg-subj-music-bg", glifo: "text-subj-music", texto: "text-subj-music-ink" },
};

// Tile de área con glifo grande (§7, sección 6). Todo el tile es un link.
export function TileArea({
  area,
  href,
  nombre,
  glifo,
  accion = "Ver cómo te sirve",
  children,
}: {
  area: Exclude<Area, "otra">;
  href: string;
  nombre: string;
  glifo: string | null;
  // Texto del link del tile. En la home del marketplace lleva al catálogo del área.
  accion?: string;
  children: React.ReactNode;
}) {
  const estilo = TILE[area];
  return (
    <Link
      href={href}
      className={cn(
        "group flex min-h-72 flex-[1_1_15rem] flex-col gap-3 rounded-[22px] p-6 transition-colors",
        "hover:outline-indigo-strong hover:outline hover:outline-1",
        estilo.fondo,
      )}
    >
      {glifo ? (
        <span
          aria-hidden
          className={cn(
            "font-display text-[3.5rem] leading-none font-extrabold tracking-[-0.04em]",
            estilo.glifo,
          )}
        >
          {glifo}
        </span>
      ) : (
        <Music aria-hidden className={cn("size-14", estilo.glifo)} strokeWidth={2.2} />
      )}
      <span className="title-h3 text-ink mt-auto">{nombre}</span>
      <span className={cn("text-[15px] leading-relaxed", estilo.texto)}>{children}</span>
      <span
        className={cn("inline-flex items-center gap-1.5 text-[15px] font-semibold", estilo.texto)}
      >
        {accion}
        <ArrowRight
          className="size-4 transition-transform group-hover:translate-x-0.5"
          aria-hidden
        />
      </span>
    </Link>
  );
}

// Preguntas: lista con bordes finos, abiertas con <details> (sin JavaScript).
export function Preguntas({
  items,
}: {
  items: { pregunta: string; respuesta: React.ReactNode }[];
}) {
  return (
    <div className="border-line flex flex-col border-t">
      {items.map((item) => (
        <details key={item.pregunta} className="group border-line border-b">
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 text-[17px] font-semibold [&::-webkit-details-marker]:hidden">
            {item.pregunta}
            <span
              aria-hidden
              className="border-border-control text-ink-3 flex size-7 shrink-0 items-center justify-center rounded-full border transition-transform group-open:rotate-45"
            >
              <Plus className="size-4" strokeWidth={2} />
            </span>
          </summary>
          <p className="text-ink-2 max-w-[62ch] pb-5 text-base leading-relaxed">{item.respuesta}</p>
        </details>
      ))}
    </div>
  );
}
