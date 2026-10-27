import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, Monitor } from "lucide-react";
import { notFound } from "next/navigation";
import { Contenedor } from "@/components/marketplace/contenedor";
import { PublicacionCard } from "@/components/marketplace/publicacion-card";
import { AreaTag, TeacherAvatar } from "@/components/ui/area";
import { PERFILES, PUBLICACIONES, perfilPorSlug } from "@/content/marketplace-ejemplo";
import { COLOR_DEL_AREA } from "@/lib/marketplace";

// Perfil del profe (§12.9): es de lectura. No lleva "Consultar": cada tarjeta lleva a su clase y
// se consulta desde ahí, porque una consulta siempre pertenece a una publicación.

export function generateStaticParams() {
  return PERFILES.map((perfil) => ({ slug: perfil.slug }));
}

export async function generateMetadata(props: PageProps<"/perfil/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const perfil = perfilPorSlug(slug);
  if (!perfil) return {};
  return { title: perfil.nombre, description: perfil.bio };
}

export default async function PerfilPage(props: PageProps<"/perfil/[slug]">) {
  const { slug } = await props.params;
  const perfil = perfilPorSlug(slug);
  if (!perfil) notFound();

  const color = COLOR_DEL_AREA[perfil.area];
  const clases = PUBLICACIONES.filter((publicacion) => publicacion.profe === perfil.slug);
  const online = perfil.modalidades.includes("online");
  const presencial = perfil.modalidades.includes("presencial");

  return (
    <main>
      <section className="bg-cuadricula border-line border-b">
        <Contenedor className="flex flex-col gap-6 py-[clamp(2rem,5vw,3.5rem)] sm:flex-row sm:items-start sm:gap-8">
          <TeacherAvatar area={color} name={perfil.nombre} size={72} />
          <div className="min-w-0 space-y-4">
            <h1 className="title-page text-ink">{perfil.nombre}</h1>
            <ul className="flex flex-wrap gap-2">
              {perfil.materias.map((materia) => (
                <li key={materia}>
                  <AreaTag area={color}>{materia}</AreaTag>
                </li>
              ))}
            </ul>
            <p className="text-ink-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
              {online && (
                <span className="flex items-center gap-1.5">
                  <Monitor className="size-4" strokeWidth={1.8} aria-hidden />
                  Online
                </span>
              )}
              {presencial && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="size-4" strokeWidth={1.8} aria-hidden />
                  {perfil.zona ? `Presencial en ${perfil.zona}` : "Presencial"}
                </span>
              )}
            </p>
            <p className="text-ink-2 max-w-[62ch] text-base leading-relaxed">{perfil.bio}</p>
          </div>
        </Contenedor>
      </section>

      <Contenedor className="space-y-6 py-10">
        <h2 className="title-h3">
          {clases.length === 1 ? "Su clase" : "Sus clases"}
        </h2>
        {clases.length === 0 ? (
          <p className="text-ink-2">
            {perfil.nombre.split(" ")[0]} todavía no tiene clases publicadas.{" "}
            <Link href="/clases" className="text-indigo-strong font-semibold underline">
              Ver otras clases
            </Link>
          </p>
        ) : (
          <ul className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(min(100%,18rem),1fr))]">
            {clases.map((publicacion) => (
              <li key={publicacion.slug}>
                <PublicacionCard publicacion={publicacion} profe={perfil} />
              </li>
            ))}
          </ul>
        )}
      </Contenedor>
    </main>
  );
}
