import Link from "next/link";
import { Banknote, Check, MessageCircle, PenLine } from "lucide-react";
import { CapturaParaCorregir, FotoDelChat } from "@/components/expresivos/capturas";
import { Contenedor } from "@/components/expresivos/marco";
import { Sticker } from "@/components/expresivos/sticker";
import { buttonVariants } from "@/components/ui/button";
import { Resaltador } from "@/components/ui/resaltador";

// Hero de /ensenar (§7, sección 2). Lo académico es lo que se vende (plan del MVP): la promesa es
// que las entregas dejen el chat, y la prueba es la pantalla "Para corregir" con la foto del chat
// de fondo, el antes y el después en un solo cuadro.
export function Hero() {
  return (
    <section className="bg-cuadricula border-line border-b">
      <Contenedor className="flex flex-col gap-10 pt-[clamp(3rem,6vw,4.5rem)] pb-[clamp(3.5rem,7vw,5rem)]">
        <div className="flex flex-col gap-6">
          <Sticker tone="resaltador" tilt="-3">
            Gratis con 1 alumno
          </Sticker>
          <h1 className="title-display text-ink max-w-[21ch] text-balance">
            Que la tarea deje de llegar como <Resaltador>foto torcida</Resaltador> por WhatsApp.
          </h1>
        </div>
        <div className="grid grid-cols-1 items-start gap-x-14 gap-y-12 lg:grid-cols-[minmax(0,27rem)_minmax(0,1fr)]">
          <div className="flex flex-col gap-7">
            <p className="lead text-ink-2">
              Tus alumnos entregan y rinden desde su cuenta, y vos corregís desde el celular, con la
              IA proponiéndote la devolución. La agenda y los cobros quedan en el mismo lugar.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="#crear-cuenta"
                className={buttonVariants({ className: "px-6 text-base" })}
              >
                Crear mi cuenta gratis
              </Link>
              <Link
                href="#como-funciona"
                className={buttonVariants({ variant: "secondary", className: "px-6 text-base" })}
              >
                Ver cómo funciona
              </Link>
            </div>
            <p className="text-ink-3 -mt-3 text-sm">Gratis con 1 alumno. Sin tarjeta.</p>
            <ul aria-label="Lo básico" className="flex flex-wrap gap-2.5">
              <li>
                <Sticker tone="idiomas" tilt="-2" shape="pill" icon={Banknote}>
                  Todo en pesos
                </Sticker>
              </li>
              <li>
                <Sticker tone="musica" tilt="2" shape="pill" icon={MessageCircle}>
                  Con tu WhatsApp
                </Sticker>
              </li>
              <li>
                <Sticker tone="apoyo" tilt="-2" shape="pill" icon={Check}>
                  Sin comisión
                </Sticker>
              </li>
              <li>
                <Sticker tone="ingreso" tilt="3" shape="pill" icon={PenLine}>
                  La IA te arma el borrador
                </Sticker>
              </li>
            </ul>
            <FotoDelChat className="mt-6 ml-20 hidden w-56 -rotate-6 xl:block" />
          </div>

          <figure className="relative flex flex-col gap-3">
            <div className="relative z-10">
              <CapturaParaCorregir />
              <Sticker
                tone="indigo"
                tilt="-3"
                shape="pill"
                className="absolute right-6 -bottom-4 z-10 text-sm"
              >
                Se corrige desde el celular
              </Sticker>
            </div>
            <figcaption className="label-mono text-ink-3 pt-4 text-right">
              Pantalla de Lernio con datos de ejemplo.
            </figcaption>
          </figure>
        </div>
      </Contenedor>
    </section>
  );
}
