import { headers } from "next/headers";

// Origen público de la app: el del request si está, o el configurado.
export async function siteOrigin() {
  const h = await headers();
  return h.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}
