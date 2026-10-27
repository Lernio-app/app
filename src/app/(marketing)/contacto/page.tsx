import type { Metadata } from "next";
import Link from "next/link";
import { Contenedor } from "@/components/expresivos/marco";
import { Resaltador } from "@/components/ui/resaltador";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = {
  title: "Contacto",
  description: "Escribile al equipo de Lernio: dudas, sugerencias o pedidos sobre tus datos.",
};

// Contacto general con Lernio (F10). La bandeja que lo recibe es del panel interno (F13). La página
// no promete plazos de respuesta.
const ATAJOS = [
  {
    titulo: "¿Das clases?",
    texto: "Lo que hace Lernio, los planes y las preguntas frecuentes están en Para profes.",
    href: "/ensenar",
    link: "Ir a Para profes",
  },
  {
    titulo: "¿Falta tu materia?",
    texto: "Contanos cuál das y para qué estudian tus alumnos. La lista la mantenemos nosotros.",
    href: null,
    link: null,
  },
  {
    titulo: "¿Tus datos personales?",
    texto: "Para ver, corregir o borrar tus datos, elegí ese motivo en el formulario.",
    href: "/privacidad",
    link: "Leer la privacidad",
  },
];

export default function ContactoPage() {
  return (
    <main className="flex-1">
      <section className="bg-cuadricula border-line border-b">
        <Contenedor className="flex flex-col gap-5 py-[clamp(3rem,7vw,4.5rem)]">
          <h1 className="title-h2 text-ink max-w-[16ch]">
            Escribinos, <Resaltador>lo lee una persona</Resaltador>.
          </h1>
          <p className="lead text-ink-2 max-w-[36rem]">
            Somos un equipo chico. Si tenés una duda, una idea o algo no anda, contanos.
          </p>
        </Contenedor>
      </section>
      <Contenedor className="flex flex-wrap gap-x-16 gap-y-12 py-[clamp(3rem,7vw,5rem)]">
        <div className="rounded-card flex-[2_1_24rem] border bg-white p-6 sm:p-8">
          <ContactForm />
        </div>
        <aside className="flex flex-[1_1_18rem] flex-col">
          {ATAJOS.map((atajo) => (
            <div
              key={atajo.titulo}
              className="border-line flex flex-col gap-1.5 border-b py-5 first:pt-0"
            >
              <h2 className="text-lg font-semibold">{atajo.titulo}</h2>
              <p className="text-ink-2 leading-relaxed">{atajo.texto}</p>
              {atajo.href && (
                <Link
                  href={atajo.href}
                  className="text-indigo-strong w-fit py-1 font-semibold underline-offset-4 hover:underline"
                >
                  {atajo.link}
                </Link>
              )}
            </div>
          ))}
        </aside>
      </Contenedor>
    </main>
  );
}
