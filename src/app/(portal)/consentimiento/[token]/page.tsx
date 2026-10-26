import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { ConfirmForm } from "@/components/ui/confirm-form";
import { PageTitle } from "@/components/ui/page-header";
import { formatDate } from "@/lib/format";
import { firstName } from "@/lib/messages";
import { createClient } from "@/lib/supabase/server";
import { revokeConsent } from "./actions";
import { ConsentForm } from "./consent-form";

// El token va en la URL: que no se indexe ni se filtre a otros sitios.
export const metadata: Metadata = {
  title: "Consentimiento",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

async function Consent({ params }: { params: PageProps<"/consentimiento/[token]">["params"] }) {
  await connection();
  const { token } = await params;

  const supabase = await createClient();
  const { data } = await supabase.rpc("consent_by_token", { p_token: token });
  const consent = data?.[0];
  if (!consent) notFound();

  const teacher = firstName(consent.teacher_name);
  const student = firstName(consent.student_name);
  const greeting = <PageTitle>Hola, {firstName(consent.payer_name)}</PageTitle>;

  if (consent.status === "given") {
    return (
      <>
        {greeting}
        <p className="text-ink-2">
          Diste tu consentimiento el{" "}
          {consent.given_at ? formatDate(consent.given_at, { day: "numeric", month: "long" }) : ""}.{" "}
          {student} puede activar su cuenta con la invitación que le mande {teacher}.
        </p>
        <p className="text-ink-3 text-sm">
          Lo podés retirar cuando quieras. Si lo hacés, la cuenta de {student} deja de ver las
          clases con {teacher}.
        </p>
        <ConfirmForm
          action={revokeConsent}
          fields={{ token }}
          message={`¿Retirar el consentimiento? ${student} deja de ver sus clases con ${teacher}.`}
          label="Retirar mi consentimiento"
        />
      </>
    );
  }

  if (consent.status !== "valid") {
    const text =
      consent.status === "revoked"
        ? `Retiraste el consentimiento: ${student} no tiene cuenta con ${teacher}. Si cambiás de idea, pedile a ${teacher} un pedido nuevo.`
        : consent.status === "expired"
          ? `Este pedido venció. Pedile a ${teacher} que te mande uno nuevo.`
          : `Este pedido ya no está disponible. Pedile a ${teacher} que te mande uno nuevo.`;
    return (
      <>
        {greeting}
        <p className="text-ink-2">{text}</p>
      </>
    );
  }

  return (
    <>
      {greeting}
      <p className="text-ink-2">
        {teacher} da clases a {student} y quiere que tenga su propia cuenta de alumno en Lernio: ahí
        ve sus clases y sus tareas y queda su historial. Como {student} es menor, antes necesitamos
        tu consentimiento.
      </p>
      <p className="text-ink-3 text-sm">
        No necesitás crear ninguna cuenta. Lo podés retirar cuando quieras desde este mismo link.
      </p>
      <ConsentForm token={token} studentName={student} />
    </>
  );
}

export default function ConsentimientoPage(props: PageProps<"/consentimiento/[token]">) {
  return (
    // En el portal el profe va primero; Lernio, a lo sumo en un pie (§8, pendiente en §14).
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center gap-4 px-5 py-10">
      <Suspense fallback={<div className="h-32" aria-hidden />}>
        <Consent params={props.params} />
      </Suspense>
    </main>
  );
}
