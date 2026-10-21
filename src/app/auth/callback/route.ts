import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { trackEvent } from "@/lib/events";

// Solo rutas internas: evita que `next` mande a otro sitio.
function safeNext(value: string | null) {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/";
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user) {
      const { data: membership } = await supabase
        .from("memberships")
        .select("org_id")
        .eq("user_id", data.user.id)
        .limit(1)
        .maybeSingle();
      if (membership) {
        await trackEvent(supabase, { orgId: membership.org_id, userId: data.user.id }, "login");
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/ingresar?error=enlace`);
}
