import type { Area } from "@/components/ui/area";

// Áreas, materias y niveles: la lista cerrada que mantiene Lernio (§12.13 de la especificación).

export type CatalogArea = {
  id: string;
  code: string;
  name: string;
  color: Exclude<Area, "otra">;
  position: number;
};
export type CatalogSubject = {
  id: string;
  code: string;
  name: string;
  position: number;
  // Una o dos áreas: la misma materia (Física) se enseña en Apoyo escolar o en Ingreso y universidad.
  areaIds: string[];
};
export type CatalogLevel = {
  id: string;
  code: string;
  name: string;
  position: number;
  areaId: string;
};
export type Catalog = {
  areas: CatalogArea[];
  subjects: CatalogSubject[];
  levels: CatalogLevel[];
};

// Materias agrupadas por las áreas en que se enseñan, para listarlas sin repetir ninguna. Los grupos
// salen en el orden de su primera materia. El título dice en qué área o áreas se puede enseñar.
export function groupSubjects(catalog: Catalog): { label: string; subjects: CatalogSubject[] }[] {
  const areaById = new Map(catalog.areas.map((area) => [area.id, area]));
  const groups = new Map<string, CatalogSubject[]>();
  for (const subject of catalog.subjects) {
    const key = [...subject.areaIds].sort().join("|");
    groups.set(key, [...(groups.get(key) ?? []), subject]);
  }
  const sharedAreas = new Set(
    catalog.subjects.filter((s) => s.areaIds.length > 1).flatMap((s) => s.areaIds),
  );
  return [...groups.values()].map((subjects) => {
    const areas = subjects[0].areaIds
      .map((id) => areaById.get(id))
      .filter((area): area is CatalogArea => Boolean(area))
      .sort((a, b) => a.position - b.position);
    const names = areas.map((area) => area.name).join(" y/o ");
    const label = areas.length === 1 && sharedAreas.has(areas[0].id) ? `Solo ${names}` : names;
    return { label, subjects };
  });
}

// El área que se propone al elegir una materia: la única en que se enseña o, si son dos, la
// principal del profe cuando sirve y, si no, la primera.
export function defaultAreaFor(
  subject: CatalogSubject,
  catalog: Catalog,
  mainAreaId: string | null,
): string {
  if (mainAreaId && subject.areaIds.includes(mainAreaId)) return mainAreaId;
  const first = catalog.areas.find((area) => subject.areaIds.includes(area.id));
  return first?.id ?? "";
}
