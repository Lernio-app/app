import type { Area } from "@/components/ui/area";

// Modelo del marketplace (§12.1 de la especificación) y las funciones puras que usan las pantallas
// públicas: leer filtros de la URL, filtrar, ordenar y resumir la disponibilidad. Los datos reales
// los trae la base (F11): hoy las pantallas leen `content/marketplace-ejemplo.ts`.

export type AreaSlug = "idiomas" | "ingreso-universidad" | "apoyo-escolar" | "musica";

export type DiaSemana = "L" | "M" | "X" | "J" | "V" | "S" | "D";
export type Franja = "manana" | "tarde" | "noche";
export type Disponibilidad = Partial<Record<DiaSemana, Franja[]>>;
export type Modalidad = "online" | "presencial";

export const DIAS: { clave: DiaSemana; param: string; nombre: string }[] = [
  { clave: "L", param: "lun", nombre: "lunes" },
  { clave: "M", param: "mar", nombre: "martes" },
  { clave: "X", param: "mie", nombre: "miércoles" },
  { clave: "J", param: "jue", nombre: "jueves" },
  { clave: "V", param: "vie", nombre: "viernes" },
  { clave: "S", param: "sab", nombre: "sábado" },
  { clave: "D", param: "dom", nombre: "domingo" },
];

export const FRANJAS: { clave: Franja; nombre: string; horas: string; frase: string }[] = [
  { clave: "manana", nombre: "Mañana", horas: "8–12", frase: "a la mañana" },
  { clave: "tarde", nombre: "Tarde", horas: "12–19", frase: "a la tarde" },
  { clave: "noche", nombre: "Noche", horas: "19–23", frase: "a la noche" },
];

export type Publicacion = {
  slug: string;
  titulo: string;
  area: AreaSlug;
  materia: string;
  nivel: string;
  modalidades: Modalidad[];
  // Barrio o localidad. Solo si la clase es presencial.
  zona?: string;
  formato: { tipo: "individual" } | { tipo: "grupal"; cupo: number };
  duracionMin: number;
  // Centavos, como el resto de los montos.
  precio: number;
  // Si la clase tiene un precio distinto para el grupo, la tarjeta dice "Desde".
  precioDesde?: boolean;
  paquete?: { clases: number; precio: number };
  disponibilidad: Disponibilidad;
  profe: string;
  // YYYY-MM-DD. Orden de "Más nuevas" y desempate de "Más completas".
  publicada: string;
  descripcion: string;
  trabajo: string[];
  comoSon: {
    frecuencia: string;
    plataforma: string;
    materiales: string;
    // Solo si el profe usa tareas y simulacros de Lernio.
    tareasEnPortal: boolean;
  };
};

export type PerfilProfe = {
  slug: string;
  nombre: string;
  area: AreaSlug;
  materias: string[];
  modalidades: Modalidad[];
  zona?: string;
  bio: string;
};

export type NivelesPorArea = Record<AreaSlug, string[]>;

// Color de cada área del sitio (§2.4). `ingreso-universidad` es la clave `ingreso` del token.
export const COLOR_DEL_AREA: Record<AreaSlug, Exclude<Area, "otra">> = {
  idiomas: "idiomas",
  "ingreso-universidad": "ingreso",
  "apoyo-escolar": "apoyo",
  musica: "musica",
};

export function slugify(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function sinTildes(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

// ---------------------------------------------------------------------------------------------
// Disponibilidad

const dias = new Map(DIAS.map((dia) => [dia.clave, dia]));

function frasesDeFranjas(franjas: Franja[]): string {
  if (franjas.length === 3) return "todo el día";
  const frases = FRANJAS.filter((franja) => franjas.includes(franja.clave)).map((f) => f.frase);
  return frases.join(" y ");
}

function unir(nombres: string[]): string {
  if (nombres.length <= 1) return nombres.join("");
  return `${nombres.slice(0, -1).join(", ")} y ${nombres[nombres.length - 1]}`;
}

// "Martes y jueves a la tarde". Los días con las mismas franjas se agrupan; los grupos se separan
// con " · ". Es el texto equivalente de los casilleros (§12.12).
export function resumenDisponibilidad(disponibilidad: Disponibilidad): string {
  const grupos = new Map<string, DiaSemana[]>();
  for (const { clave } of DIAS) {
    const franjas = disponibilidad[clave];
    if (!franjas || franjas.length === 0) continue;
    const key = FRANJAS.filter((f) => franjas.includes(f.clave))
      .map((f) => f.clave)
      .join(",");
    grupos.set(key, [...(grupos.get(key) ?? []), clave]);
  }
  if (grupos.size === 0) return "Sin horarios cargados";
  const frases = [...grupos.entries()].map(([key, claves]) => {
    const nombres = claves.map((clave) => dias.get(clave)?.nombre ?? "");
    return `${unir(nombres)} ${frasesDeFranjas(key.split(",") as Franja[])}`;
  });
  const texto = frases.join(" · ");
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function diasConHorario(disponibilidad: Disponibilidad): DiaSemana[] {
  return DIAS.filter(({ clave }) => (disponibilidad[clave]?.length ?? 0) > 0).map((d) => d.clave);
}

// ---------------------------------------------------------------------------------------------
// Filtros en la URL (§12.2): cada combinación queda en la dirección, para poder compartirla.

export type Orden = "completas" | "coincidencia" | "cerca" | "precio-asc" | "precio-desc" | "nuevas";

export type Filtros = {
  q: string;
  area?: AreaSlug;
  materias: string[];
  niveles: string[];
  modalidades: Modalidad[];
  zona?: string;
  formatos: ("individual" | "grupal")[];
  precioMin?: number;
  precioMax?: number;
  dias: DiaSemana[];
  franjas: Franja[];
  orden?: Orden;
};

type SearchParams = Record<string, string | string[] | undefined>;

function valor(params: SearchParams, clave: string): string {
  const raw = params[clave];
  return (Array.isArray(raw) ? raw[0] : raw)?.trim() ?? "";
}

function lista(params: SearchParams, clave: string): string[] {
  return valor(params, clave)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function pesos(params: SearchParams, clave: string): number | undefined {
  const numero = Number(valor(params, clave));
  return Number.isFinite(numero) && numero > 0 ? Math.round(numero * 100) : undefined;
}

const ORDENES: Orden[] = ["completas", "coincidencia", "cerca", "precio-asc", "precio-desc", "nuevas"];

export function leerFiltros(params: SearchParams, base: Partial<Filtros> = {}): Filtros {
  const orden = valor(params, "orden") as Orden;
  return {
    q: valor(params, "q"),
    area: base.area,
    materias: base.materias ?? lista(params, "materia"),
    niveles: lista(params, "nivel"),
    modalidades: lista(params, "modalidad").filter(
      (item): item is Modalidad => item === "online" || item === "presencial",
    ),
    zona: valor(params, "zona") || undefined,
    formatos: lista(params, "formato").filter(
      (item): item is "individual" | "grupal" => item === "individual" || item === "grupal",
    ),
    precioMin: pesos(params, "precio_min"),
    precioMax: pesos(params, "precio_max"),
    dias: lista(params, "dias")
      .map((param) => DIAS.find((dia) => dia.param === param)?.clave)
      .filter((clave): clave is DiaSemana => Boolean(clave)),
    franjas: lista(params, "franja").filter((item): item is Franja =>
      FRANJAS.some((franja) => franja.clave === item),
    ),
    orden: ORDENES.includes(orden) ? orden : undefined,
  };
}

export function hayFiltros(filtros: Filtros): boolean {
  return Boolean(
    filtros.q ||
    filtros.niveles.length ||
    filtros.modalidades.length ||
    filtros.zona ||
    filtros.formatos.length ||
    filtros.precioMin ||
    filtros.precioMax ||
    filtros.dias.length ||
    filtros.franjas.length,
  );
}

// ---------------------------------------------------------------------------------------------
// Búsqueda. En producción es una consulta a la vista pública de publicaciones; esta versión sirve
// para ver las pantallas con sus estados.

export function completitud(publicacion: Publicacion, perfil?: PerfilProfe): number {
  return (
    (publicacion.paquete ? 1 : 0) +
    (diasConHorario(publicacion.disponibilidad).length > 0 ? 1 : 0) +
    (perfil?.bio ? 1 : 0)
  );
}

export function buscar(
  publicaciones: Publicacion[],
  perfiles: PerfilProfe[],
  filtros: Filtros,
): Publicacion[] {
  const perfilDe = (slug: string) => perfiles.find((perfil) => perfil.slug === slug);
  const termino = sinTildes(filtros.q);

  const resultado = publicaciones.filter((p) => {
    if (filtros.area && p.area !== filtros.area) return false;
    if (filtros.materias.length && !filtros.materias.includes(slugify(p.materia))) return false;
    if (filtros.niveles.length && !filtros.niveles.includes(slugify(p.nivel))) return false;
    if (filtros.modalidades.length && !filtros.modalidades.some((m) => p.modalidades.includes(m)))
      return false;
    if (filtros.zona && sinTildes(p.zona ?? "") !== sinTildes(filtros.zona)) return false;
    if (filtros.formatos.length && !filtros.formatos.includes(p.formato.tipo)) return false;
    if (filtros.precioMin && p.precio < filtros.precioMin) return false;
    if (filtros.precioMax && p.precio > filtros.precioMax) return false;
    if (filtros.dias.length && !filtros.dias.some((dia) => p.disponibilidad[dia]?.length))
      return false;
    if (
      filtros.franjas.length &&
      !Object.values(p.disponibilidad).some((franjas) =>
        franjas?.some((franja) => filtros.franjas.includes(franja)),
      )
    )
      return false;
    if (termino) {
      const texto = sinTildes(
        [p.titulo, p.materia, p.nivel, p.descripcion, p.trabajo.join(" "), perfilDe(p.profe)?.nombre]
          .filter(Boolean)
          .join(" "),
      );
      if (!termino.split(/\s+/).every((palabra) => texto.includes(palabra))) return false;
    }
    return true;
  });

  const orden = filtros.orden ?? (termino ? "coincidencia" : "completas");
  return [...resultado].sort((a, b) => {
    switch (orden) {
      case "precio-asc":
        return a.precio - b.precio;
      case "precio-desc":
        return b.precio - a.precio;
      case "nuevas":
        return b.publicada.localeCompare(a.publicada);
      default: {
        // "Más completas": suman los datos opcionales; a igual puntaje, la publicada más reciente.
        const diferencia = completitud(b, perfilDe(b.profe)) - completitud(a, perfilDe(a.profe));
        return diferencia !== 0 ? diferencia : b.publicada.localeCompare(a.publicada);
      }
    }
  });
}

// Texto de la línea de datos: "Online · Presencial en Palermo".
export function textoModalidad(publicacion: Pick<Publicacion, "modalidades" | "zona">): string {
  return publicacion.modalidades
    .map((modalidad) =>
      modalidad === "online"
        ? "Online"
        : publicacion.zona
          ? `Presencial en ${publicacion.zona}`
          : "Presencial",
    )
    .join(" · ");
}

export function textoFormato(formato: Publicacion["formato"]): string {
  return formato.tipo === "individual" ? "Individual" : `Grupal, hasta ${formato.cupo}`;
}
