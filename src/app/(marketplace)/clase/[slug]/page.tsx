import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, ChevronRight, Flag } from "lucide-react";
import { Contenedor } from "@/components/marketplace/contenedor";
import { GrillaHorarios } from "@/components/marketplace/disponibilidad";
import { PanelConsulta } from "@/components/marketplace/panel-consulta";
import { PublicacionCard } from "@/components/marketplace/publicacion-card";
import { AreaTag, TeacherAvatar } from "@/components/ui/area";
import { buttonVariants } from "@/components/ui/button";
import {
  NIVELES,
  PUBLICACIONES,
  areaPorSlug,
  perfilPorSlug,
  publicacionPorSlug,
} from "@/content/marketplace-ejemplo";
import {
  COLOR_DEL_AREA,
  slugify,
  textoFormato,
  textoModalidad,
  type AreaSlug,
} from "@/lib/marketplace";

// Página de la clase (§12.8): la publicación del profe. Lee datos de ejemplo hasta F11.

export function generateStaticParams() {
  return PUBLICACIONES.map((publicacion) => ({ slug: publicacion.slug }));
}

export async function generateMetadata(props: PageProps<"/clase/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const publicacion = publicacionPorSlug(slug);
  if (!publicacion) return {};
  return { title: publicacion.titulo, description: publicacion.descripcion };
}

const EJEMPLO_DE_MENSAJE: Record<AreaSlug, string> = {
  idiomas: "Rindo el First en diciembre y quiero practicar Writing",
  "ingreso-universidad": "Curso Álgebra y rindo el parcial en noviembre",
  "apoyo-escolar": "Mi hijo está en tercer año y le cuesta Lengua",
  musica: "Quiero empezar y tengo una guitarra criolla",
};

export default async function ClasePage(props: PageProps<"/clase/[slug]">) {
  const { slug } = await props.params;
  const publicacion = publicacionPorSlug(slug);
  if (!publicacion) notFound();
  const profe = perfilPorSlug(publicacion.profe);
  const area = areaPorSlug(publicacion.area);
  if (!profe || !area) notFound();

  const color = COLOR_DEL_AREA[publicacion.area];
  const otras = PUBLICACIONES.filter(
    (otra) => otra.profe === publicacion.profe && otra.slug !== publicacion.slug,
  ).slice(0, 3);

  const filas = [
    ["Duración", `${publicacion.duracionMin} min`],
    ["Frecuencia sugerida", publicacion.comoSon.frecuencia],
    ["Modalidad", textoModalidad(publicacion)],
    ["Plataforma", publicacion.comoSon.plataforma],
    ["Materiales", publicacion.comoSon.materiales],
    ...(publicacion.comoSon.tareasEnPortal
      ? [["Tareas y simulacros", "En tu portal de alumno"]]
      : []),
  ];

  return (
    <main className="pb-24 lg:pb-0">
      <section className="bg-cuadricula border-line border-b">
        <Contenedor className="flex flex-col gap-5 py-[clamp(1.75rem,4vw,2.75rem)]">
          <nav aria-label="Migas" className="text-ink-3 flex flex-wrap items-center gap-x-1 text-sm">
            <Link href="/clases" className="hover:text-ink flex min-h-8 items-center">
              Clases
            </Link>
            <ChevronRight className="size-3.5" aria-hidden />
            <Link
              href={`/clases/${publicacion.area}/${slugify(publicacion.materia)}`}
              className="hover:text-ink flex min-h-8 items-center"
            >
              {publicacion.materia}
            </Link>
            <ChevronRight className="size-3.5" aria-hidden />
            <span aria-current="page" className="text-ink-2">
              {publicacion.titulo}
            </span>
          </nav>
          <div className="space-y-4">
            <div>
              <AreaTag area={color}>{`${publicacion.materia} · ${publicacion.nivel}`}</AreaTag>
            </div>
            <h1 className="title-listing text-ink max-w-[22ch] text-balance">
              {publicacion.titulo}
            </h1>
            <p className="text-ink-2 flex flex-wrap items-center gap-x-2 gap-y-1">
              <span>{textoModalidad(publicacion)}</span>
              <span aria-hidden className="text-ink-3">
                ·
              </span>
              <span>{textoFormato(publicacion.formato)}</span>
              <span aria-hidden className="text-ink-3">
                ·
              </span>
              <span className="num">{`${publicacion.duracionMin} min`}</span>
            </p>
            <Link
              href={`/perfil/${profe.slug}`}
              className="border-border-control hover:border-indigo-strong inline-flex min-h-11 items-center gap-2.5 rounded-full border bg-white py-1.5 pr-4 pl-1.5"
            >
              <TeacherAvatar area={color} name={profe.nombre} size={32} />
              <span className="text-sm font-semibold">{profe.nombre}</span>
            </Link>
          </div>
        </Contenedor>
      </section>

      <Contenedor className="grid gap-x-12 gap-y-10 py-10 lg:grid-cols-[minmax(0,44rem)_22rem] lg:justify-center">
        <div className="min-w-0 space-y-12">
          <p className="text-ink-2 max-w-[62ch] text-lg leading-relaxed">{publicacion.descripcion}</p>

          <section aria-labelledby="trabajo-titulo" className="space-y-4">
            <h2 id="trabajo-titulo" className="title-h3">
              Qué vas a trabajar
            </h2>
            <ul className="space-y-3">
              {publicacion.trabajo.map((item) => (
                <li key={item} className="flex items-start gap-3 text-base">
                  <Check
                    className="text-indigo-strong mt-0.5 size-5 shrink-0"
                    strokeWidth={2.2}
                    aria-hidden
                  />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="clases-titulo" className="space-y-4">
            <h2 id="clases-titulo" className="title-h3">
              Cómo son las clases
            </h2>
            <dl className="border-line rounded-card divide-line-soft divide-y border bg-white">
              {filas.map(([nombre, valor]) => (
                <div
                  key={nombre}
                  className="grid gap-x-6 gap-y-1 px-5 py-3.5 sm:grid-cols-[11rem_minmax(0,1fr)]"
                >
                  <dt className="text-ink-3 text-sm">{nombre}</dt>
                  <dd className="text-base">{valor}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section aria-labelledby="horarios-titulo" className="space-y-4">
            <h2 id="horarios-titulo" className="title-h3">
              Horarios
            </h2>
            <GrillaHorarios disponibilidad={publicacion.disponibilidad} area={publicacion.area} />
          </section>

          <section aria-labelledby="profe-titulo" className="space-y-4">
            <h2 id="profe-titulo" className="title-h3">
              Sobre {profe.nombre.split(" ")[0]}
            </h2>
            <div className="border-line rounded-card flex flex-col gap-4 border bg-white p-5 sm:flex-row sm:p-6">
              <TeacherAvatar area={color} name={profe.nombre} size={56} />
              <div className="min-w-0 space-y-3">
                <p className="text-lg font-semibold">{profe.nombre}</p>
                <ul className="flex flex-wrap gap-2">
                  {profe.materias.map((materia) => (
                    <li key={materia}>
                      <AreaTag area={color}>{materia}</AreaTag>
                    </li>
                  ))}
                </ul>
                <p className="text-ink-2 max-w-[62ch] text-base leading-relaxed">{profe.bio}</p>
                <Link
                  href={`/perfil/${profe.slug}`}
                  className="text-indigo-strong flex min-h-11 items-center text-sm font-semibold underline-offset-4 hover:underline"
                >
                  Ver perfil
                </Link>
              </div>
            </div>
          </section>

          {otras.length > 0 && (
            <section aria-labelledby="otras-titulo" className="space-y-4">
              <h2 id="otras-titulo" className="title-h3">
                Otras clases de {profe.nombre.split(" ")[0]}
              </h2>
              <ul className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2">
                {otras.map((otra) => (
                  <li key={otra.slug}>
                    <PublicacionCard publicacion={otra} profe={profe} />
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className="border-line-soft border-t pt-6">
            <Link
              href={`/contacto?motivo=reportar&clase=${publicacion.slug}`}
              className={buttonVariants({ variant: "ghost", className: "-ml-4" })}
            >
              <Flag aria-hidden />
              Reportar esta clase
            </Link>
          </div>
        </div>

        <aside aria-label="Consultar" className="lg:sticky lg:top-24 lg:self-start">
          <PanelConsulta
            precio={publicacion.precio}
            paquete={publicacion.paquete}
            profe={profe.nombre}
            niveles={NIVELES[publicacion.area]}
            placeholder={EJEMPLO_DE_MENSAJE[publicacion.area]}
          />
        </aside>
      </Contenedor>

      <Contenedor className="border-line-soft border-t py-6">
        <p className="text-ink-3 max-w-[62ch] text-sm">
          Hecho con Lernio. Lernio no cobra comisión ni procesa pagos: el pago se arregla con el
          profe.
        </p>
      </Contenedor>
    </main>
  );
}
