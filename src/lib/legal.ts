import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

// Versión vigente de los términos y la privacidad. Subirla pide que cada cuenta acepte de nuevo.
// Los textos son los de `content/legal.ts`; los dos documentos comparten versión.
export const LEGAL_VERSION = "0";

// ¿Esta cuenta aceptó los dos documentos en la versión vigente? Se resuelve una vez por request.
export const hasAcceptedLegal = cache(async (userId: string): Promise<boolean> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("legal_acceptances")
    .select("document")
    .eq("user_id", userId)
    .eq("version", LEGAL_VERSION);
  if (error) throw new Error("No se pudo comprobar la aceptación de los términos");
  return new Set(data.map((row) => row.document)).size === 2;
});

// Registra la aceptación de la versión vigente. Repetirla no cambia nada.
export async function acceptLegal(): Promise<boolean> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("accept_legal", { p_version: LEGAL_VERSION });
  return !error;
}
