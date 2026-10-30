import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { buttonVariants } from "@/components/ui/button";
import { PageTitle } from "@/components/ui/page-header";
import { firstName } from "@/lib/messages";
import { formatArPhone } from "@/lib/phone";
import { getStudentProfile } from "@/lib/portal";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { getUser } from "@/lib/workspace";
import { ActivateForm } from "./activate-form";

// El token va en la URL: que no se indexe ni se filtre a otros sitios.
export const metadata: Metadata = {
  title: "Tu invitación",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

const UNAVAILABLE: Record<string, string> = {
  expired: "Esta invitación venció. Pedile a {teacher} que te mande una nueva.",
  accepted: "Esta invitación ya se usó. Si es tuya, entrá a tu cuenta.",
  unavailable: "Esta invitación ya no está disponible. Pedile a {teacher} que te mande una nueva.",
};

async function Invitation({ params }: { params: PageProps<"/invitacion/[token]">["params"] }) {
  await connection();
  const { token } = await params;

  const supabase = await createClient();
  const { data } = await supabase.rpc("invitation_by_token", { p_token: token });
  const invitation = data?.[0];
  if (!invitation) notFound();

  const user = await getUser();
  const teacher = firstName(invitation.teacher_name);

  if (invitation.status !== "valid") {
    return (
      <>
        <PageTitle>Hola, {firstName(invitation.student_name)}</PageTitle>
        <p className="text-ink-2">
          {(UNAVAILABLE[invitation.status] ?? UNAVAILABLE.unavailable).replace(
            "{teacher}",
            teacher,
          )}
        </p>
        {invitation.status === "accepted" && (
          <Link href="/portal" className={cn(buttonVariants(), "w-full")}>
            Ir a mi cuenta
          </Link>
        )}
      </>
    );
  }

  // Si la cuenta ya existe se propone lo que tiene; si no, el nombre con que el profe la cargó.
  const profile = user ? await getStudentProfile() : null;
  const defaults = {
    fullName: profile?.display_name ?? invitation.student_name,
    phone: formatArPhone(profile?.phone),
  };

  return (
    <>
      <PageTitle>Hola, {firstName(invitation.student_name)}</PageTitle>
      <p className="text-ink-2">
        {teacher} te invitó a Lernio. Con tu cuenta vas a ver tus clases, tus tareas y cómo pagar, y
        te queda todo el historial con {teacher}.
      </p>
      {user ? (
        <>
          <p className="text-ink-3 text-sm">
            Vas a activar tu cuenta con <strong className="text-ink">{user.email}</strong>.
          </p>
          <ActivateForm token={token} defaults={defaults} />
        </>
      ) : (
        <>
          <p className="text-ink-3 text-sm">Entrás con tu email, sin contraseña.</p>
          <Link
            href={`/ingresar?next=${encodeURIComponent(`/invitacion/${token}`)}`}
            className={cn(buttonVariants(), "w-full")}
          >
            Activar mi cuenta
          </Link>
        </>
      )}
    </>
  );
}

export default function InvitacionPage(props: PageProps<"/invitacion/[token]">) {
  return (
    // En el portal el profe va primero; Lernio, a lo sumo en un pie (§8, pendiente en §14).
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center gap-4 px-5 py-10">
      <Suspense fallback={<div className="h-32" aria-hidden />}>
        <Invitation params={props.params} />
      </Suspense>
    </main>
  );
}
