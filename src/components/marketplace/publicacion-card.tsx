import Link from "next/link";
import { ArrowRight, MapPin, Monitor, User, Users } from "lucide-react";
import { AreaTag, TeacherAvatar } from "@/components/ui/area";
import {
  COLOR_DEL_AREA,
  textoFormato,
  textoModalidad,
  type PerfilProfe,
  type Publicacion,
} from "@/lib/marketplace";
import { formatARS } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Casilleros } from "./disponibilidad";

// Tarjeta de clase (§12.7). Toda la tarjeta es un solo link, el del título, que la cubre con un
// ::after: no se anidan botones. No lleva puntajes, insignias, stickers ni urgencia.
export function PublicacionCard({
  publicacion,
  profe,
}: {
  publicacion: Publicacion;
  profe: PerfilProfe | undefined;
}) {
  const area = COLOR_DEL_AREA[publicacion.area];
  const online = publicacion.modalidades.includes("online");
  const grupal = publicacion.formato.tipo === "grupal";
  return (
    <article
      className={cn(
        "bg-card rounded-card border-line relative flex h-full flex-col gap-4 border p-5 transition-colors",
        "hover:border-indigo-strong focus-within:border-indigo-strong",
      )}
    >
      <div className="flex flex-col gap-3">
        <div>
          <AreaTag area={area}>{`${publicacion.materia} · ${publicacion.nivel}`}</AreaTag>
        </div>
        <h3 className="card-title text-ink line-clamp-2 text-balance">
          <Link
            href={`/clase/${publicacion.slug}`}
            className="after:rounded-card focus-visible:after:outline-ring after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-2"
          >
            {publicacion.titulo}
          </Link>
        </h3>
      </div>

      {profe && (
        <div className="flex items-center gap-2.5">
          <TeacherAvatar area={area} name={profe.nombre} size={32} />
          <div className="min-w-0 leading-tight">
            <p className="truncate font-semibold">{profe.nombre}</p>
            <p className="text-ink-3 truncate text-xs">{`Profe de ${publicacion.materia.toLowerCase()}`}</p>
          </div>
        </div>
      )}

      <ul className="text-ink-2 space-y-1.5 text-sm">
        <li className="flex items-center gap-2">
          {online ? (
            <Monitor className="size-4 shrink-0" strokeWidth={1.8} aria-hidden />
          ) : (
            <MapPin className="size-4 shrink-0" strokeWidth={1.8} aria-hidden />
          )}
          <span className="truncate">{textoModalidad(publicacion)}</span>
        </li>
        <li className="flex items-center gap-2">
          {grupal ? (
            <Users className="size-4 shrink-0" strokeWidth={1.8} aria-hidden />
          ) : (
            <User className="size-4 shrink-0" strokeWidth={1.8} aria-hidden />
          )}
          <span className="truncate">{textoFormato(publicacion.formato)}</span>
        </li>
      </ul>

      <Casilleros disponibilidad={publicacion.disponibilidad} area={publicacion.area} />

      <div className="border-line-soft mt-auto flex items-end justify-between gap-3 border-t pt-4">
        <p className="flex flex-wrap items-baseline gap-x-1.5">
          {publicacion.precioDesde && <span className="text-ink-3 text-xs">Desde</span>}
          <span className="num price text-ink">{formatARS(publicacion.precio)}</span>
          <span className="text-ink-3 text-xs">por clase</span>
        </p>
        <ArrowRight className="text-ink-2 size-5 shrink-0" strokeWidth={1.8} aria-hidden />
      </div>
    </article>
  );
}

// Esqueleto de la misma altura que la tarjeta (§12.5, "Cargando").
export function PublicacionCardEsqueleto() {
  return (
    <div
      aria-hidden
      className="bg-card rounded-card border-line flex h-[26rem] animate-pulse flex-col gap-4 border p-5"
    >
      <div className="bg-paper rounded-tag h-6 w-32" />
      <div className="space-y-2">
        <div className="bg-paper rounded-tag h-5 w-full" />
        <div className="bg-paper rounded-tag h-5 w-2/3" />
      </div>
      <div className="flex items-center gap-2.5">
        <div className="bg-paper rounded-control size-8" />
        <div className="bg-paper rounded-tag h-8 w-36" />
      </div>
      <div className="bg-paper rounded-tag h-4 w-48" />
      <div className="bg-paper rounded-tag h-4 w-32" />
      <div className="bg-paper rounded-tag h-10 w-full" />
      <div className="bg-paper rounded-tag mt-auto h-8 w-28" />
    </div>
  );
}
