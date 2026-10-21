import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/lib/supabase/database.types";

// Registra un uso del sistema en la tabla `events`. Medir no puede romper la acción del profe:
// si falla, se ignora.
export async function trackEvent(
  supabase: SupabaseClient<Database>,
  actor: { orgId: string; userId: string },
  name: string,
  props: Record<string, Json | undefined> = {},
) {
  try {
    await supabase.from("events").insert({
      org_id: actor.orgId,
      actor_type: "teacher",
      actor_id: actor.userId,
      name,
      props: props as NonNullable<Json>,
    });
  } catch {
    // sin efecto
  }
}
