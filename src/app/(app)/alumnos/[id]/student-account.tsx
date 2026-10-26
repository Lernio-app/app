"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ConfirmForm } from "@/components/ui/confirm-form";
import { FormError } from "@/components/ui/field";
import { SectionTitle } from "@/components/ui/page-header";
import { regenerateLink, requestConsent, unlinkStudent, type LinkState } from "../actions";
import { LinkShare } from "../link-share";

// Lo que la ficha sabe de la cuenta del alumno, ya con las fechas escritas.
export type InvitationInfo =
  | { state: "linked"; email: string | null; since: string }
  | { state: "pending"; expired: boolean; until: string | null };

// El consentimiento de un menor: cómo está el último pedido y quién lo da.
export type MinorInfo = {
  under13: boolean;
  payerName: string | null;
  consent: "none" | "pending" | "expired" | "given" | "revoked";
  // Cuándo se dio o cuándo vence el pedido, según el estado.
  on: string | null;
};

export type AccountInfo = { invitation: InvitationInfo; minor: MinorInfo | null };

// Un menor de 13 o más necesita el consentimiento de quien paga antes de la invitación.
function ConsentRequest({ studentId, minor }: { studentId: string; minor: MinorInfo }) {
  const [state, action, pending] = useActionState<LinkState, FormData>(requestConsent, {});

  if (state.share) return <LinkShare share={state.share} />;

  if (!minor.payerName) {
    return (
      <div className="bg-card rounded-card space-y-3 border p-4">
        <p className="font-medium">Falta el consentimiento de un adulto</p>
        <p className="text-ink-3 text-sm">
          Desde los 13 años tiene su propia cuenta, pero primero lo tiene que autorizar quien paga.
          Cargá al responsable de pago y pedile el consentimiento desde acá.
        </p>
        <Link
          href={`/alumnos/${studentId}/editar`}
          className="text-primary flex min-h-11 items-center text-sm font-medium"
        >
          Cargar al responsable de pago
        </Link>
      </div>
    );
  }

  const status = {
    none: `Falta el consentimiento de ${minor.payerName}.`,
    pending: `Le pediste el consentimiento a ${minor.payerName}. El pedido vence el ${minor.on}.`,
    expired: `El pedido de consentimiento a ${minor.payerName} venció.`,
    revoked: `${minor.payerName} retiró su consentimiento. Sin él no puede tener cuenta.`,
    given: "",
  }[minor.consent];

  return (
    <div className="bg-card rounded-card space-y-3 border p-4">
      <p className="font-medium">Falta el consentimiento de un adulto</p>
      <p className="text-ink-3 text-sm">
        {status} Desde los 13 años tiene su propia cuenta, pero recibe la invitación recién después
        de que quien paga lo autorice. Se lo pedís con un link, sin que tenga que crear una cuenta.
      </p>
      <form action={action}>
        <input type="hidden" name="studentId" value={studentId} />
        <Button type="submit" variant="secondary" disabled={pending}>
          {pending
            ? "Armando el pedido…"
            : minor.consent === "none"
              ? "Pedir consentimiento"
              : "Nuevo pedido"}
        </Button>
      </form>
      {state.message && <FormError>{state.message}</FormError>}
    </div>
  );
}

function Invitation({ studentId, info }: { studentId: string; info: InvitationInfo }) {
  const [state, action, pending] = useActionState<LinkState, FormData>(regenerateLink, {});

  if (info.state === "linked") {
    return (
      <div className="bg-card rounded-card space-y-3 border p-4">
        <p>
          Activó su cuenta
          {info.email ? (
            <>
              {" "}
              con <strong className="font-semibold">{info.email}</strong>
            </>
          ) : null}{" "}
          el {info.since}.
        </p>
        <p className="text-ink-3 text-sm">
          Si esa cuenta no es la suya, deshacé el vínculo y mandale una invitación nueva.
        </p>
        <ConfirmForm
          action={unlinkStudent}
          fields={{ studentId }}
          message="¿Deshacer el vínculo? El alumno deja de ver sus clases con vos hasta que lo invites de nuevo."
          label="Deshacer vínculo"
        />
      </div>
    );
  }
  if (state.share) return <LinkShare share={state.share} />;

  return (
    <div className="bg-card rounded-card space-y-3 border p-4">
      <p className="font-medium">Pendiente de activación</p>
      <p className="text-ink-3 text-sm">
        {info.expired
          ? "La invitación venció. "
          : info.until
            ? `La invitación vence el ${info.until}. `
            : "No tiene una invitación vigente. "}
        Por seguridad una invitación no se puede volver a ver: generá una nueva para mandársela y la
        anterior deja de funcionar.
      </p>
      <form action={action}>
        <input type="hidden" name="studentId" value={studentId} />
        <Button type="submit" variant="secondary" disabled={pending}>
          {pending ? "Generando…" : "Nueva invitación"}
        </Button>
      </form>
      {state.message && <FormError>{state.message}</FormError>}
    </div>
  );
}

export function StudentAccount({ studentId, info }: { studentId: string; info: AccountInfo }) {
  const { invitation, minor } = info;
  const linked = invitation.state === "linked";

  return (
    <section className="space-y-3">
      <SectionTitle>Cuenta del alumno</SectionTitle>
      {minor?.under13 ? (
        <div className="bg-card rounded-card space-y-2 border p-4">
          <p className="font-medium">Es menor de 13 años: no tiene cuenta</p>
          <p className="text-ink-3 text-sm">
            Trabajás con él desde tu lado. Su responsable de pago ve las devoluciones en el reporte
            del mes.
          </p>
        </div>
      ) : minor && minor.consent !== "given" && !linked ? (
        <ConsentRequest studentId={studentId} minor={minor} />
      ) : (
        <>
          {minor?.consent === "given" && (
            <p className="text-ink-3 text-sm">
              {minor.payerName ?? "Quien paga"} dio su consentimiento el {minor.on}. Lo puede
              retirar cuando quiera desde el link que le mandaste: si lo hace, la cuenta deja de ver
              tus clases.
            </p>
          )}
          <Invitation studentId={studentId} info={invitation} />
        </>
      )}
    </section>
  );
}
