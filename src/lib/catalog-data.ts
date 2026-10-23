import { cache } from "react";
import type { Catalog, CatalogArea } from "@/lib/catalog";
import { createClient } from "@/lib/supabase/server";

// Se lee una vez por request. Las pantallas llaman antes a requireWorkspace().
export const getCatalog = cache(async (): Promise<Catalog> => {
  const supabase = await createClient();
  const [areas, subjects, levels] = await Promise.all([
    supabase.from("areas").select("*").order("position"),
    supabase.from("subjects").select("*, subject_areas(area_id)").order("position"),
    supabase.from("levels").select("*").order("position"),
  ]);
  if (areas.error || subjects.error || levels.error) {
    throw new Error("No se pudo cargar el catálogo de materias");
  }
  return {
    areas: (areas.data ?? []).map((a) => ({
      id: a.id,
      code: a.code,
      name: a.name,
      color: a.color as CatalogArea["color"],
      position: a.position,
    })),
    subjects: (subjects.data ?? []).map((s) => ({
      id: s.id,
      code: s.code,
      name: s.name,
      position: s.position,
      areaIds: s.subject_areas.map((sa) => sa.area_id),
    })),
    levels: (levels.data ?? []).map((l) => ({
      id: l.id,
      code: l.code,
      name: l.name,
      position: l.position,
      areaId: l.area_id,
    })),
  };
});
