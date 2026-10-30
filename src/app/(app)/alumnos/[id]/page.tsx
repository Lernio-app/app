import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EmptyState, PageContainer, PageHeader, SectionTitle } from "@/components/ui/page-header";
import { StudentBilling } from "@/components/app/student-billing";
import { AreaTag } from "@/components/ui/area";
import { Button, buttonVariants } from "@/components/ui/button";
import { dayLabel, localDate } from "@/lib/dates";
import { formatARS, formatDate, formatTime } from "@/lib/format";
import { listStudentLessons } from "@/lib/lessons";
import { formatArPhone } from "@/lib/phone";
import { currentPlan, getStudent, studentAreaKey, studentDetailLine } from "@/lib/students";
import { ATTENDANCE_LABELS, type Attendance } from "@/lib/validation/lesson";
import { createClient } from "@/lib/supabase/server";
import { priceSummary } from "@/lib/validation/student";
import { requireWorkspace } from "@/lib/workspace";
import { archiveStudent, restoreStudent } from "../actions";
import { StudentAccount, type AccountInfo, type MinorInfo } from "./student-account";

export const metadata = { title: "Alumno" };

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-ink-3 text-sm">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

// Próximas clases del alumno y las últimas con su asistencia.
async function Clases({
  studentId,
  timeZone,
  archived,
}: {
  studentId: string;
  timeZone: string;
  archived: boolean;
}) {
  const { upcoming, past } = await listStudentLessons(studentId, new Date());

  const row = ({ attendee, lesson }: (typeof upcoming)[number]) => {
    const day = localDate(lesson.starts_at, timeZone);
    const status =
      lesson.status === "cancelled"
        ? "Cancelada"
        : attendee.attendance
          ? ATTENDANCE_LABELS[attendee.attendance as Attendance]
          : null;
    return (
      <li key={lesson.id}>
        <Link
          href={`/agenda/${lesson.id}`}
          className="bg-card hover:bg-paper rounded-card flex items-center justify-between gap-3 border p-4"
        >
          <span className="num first-letter:uppercase">
            {dayLabel(day, { weekday: "short", month: "short" })} ·{" "}
            {formatTime(lesson.starts_at, timeZone)}
          </span>
          {status && <span className="text-ink-3 text-sm">{status}</span>}
        </Link>
      </li>
    );
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <SectionTitle>Clases</SectionTitle>
        {!archived && (
          <Link
            href={`/agenda/nueva?alumno=${studentId}`}
            className="text-primary flex min-h-11 items-center text-sm font-medium"
          >
            + Agendar clase
          </Link>
        )}
      </div>
      {upcoming.length === 0 && past.length === 0 ? (
        <EmptyState title="Todavía no tiene clases" />
      ) : (
        <>
          {upcoming.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-ink-3 text-sm">Próximas</h3>
              <ul className="space-y-2">{upcoming.map(row)}</ul>
            </div>
          )}
          {past.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-ink-3 text-sm">Anteriores</h3>
              <ul className="space-y-2">{past.map(row)}</ul>
            </div>
          )}
        </>
      )}
    </section>
  );
}

// Cómo está la cuenta del alumno: vinculada (y con qué email) o pendiente de activación y, si es
// menor, cómo está el consentimiento de quien paga.
async function accountInfo(studentId: string, timeZone: string): Promise<AccountInfo | null> {
  const supabase = await createClient();
  const [{ data: link }, { data: consent }] = await Promise.all([
    supabase.rpc("student_link_info", { p_student_id: studentId }),
    supabase.rpc("student_consent_info", { p_student_id: studentId }),
  ]);
  const info = link?.[0];
  if (!info) return null;

  const day = (value: string) => formatDate(value, { day: "numeric", month: "long" }, timeZone);
  let invitation: AccountInfo["invitation"];
  if (info.linked_at) {
    invitation = { state: "linked", email: info.linked_email, since: day(info.linked_at) };
  } else {
    const until = info.pending_expires_at;
    invitation = {
      state: "pending",
      expired: until !== null && new Date(until).getTime() <= Date.now(),
      until: until ? day(until) : null,
    };
  }

  const minor = consent?.[0];
  if (!minor?.is_minor) return { invitation, minor: null };
  const status = minor.consent_status as MinorInfo["consent"];
  const date = status === "given" ? minor.given_at : status === "pending" ? minor.expires_at : null;
  return {
    invitation,
    minor: {
      under13: !minor.minor_13_plus,
      payerName: minor.payer_name,
      consent: status,
      on: date ? day(date) : null,
    },
  };
}

async function Ficha({ params }: { params: PageProps<"/alumnos/[id]">["params"] }) {
  const { org, profile } = await requireWorkspace();
  const { id } = await params;
  const student = await getStudent(id);
  if (!student) notFound();

  const plan = currentPlan(student.price_plans);
  const payer = student.student_contacts.find((contact) => contact.is_payer);
  const detail = studentDetailLine(student);
  const archived = student.archived_at !== null;
  const account = await accountInfo(student.id, org.timezone);

  return (
    <>
      <PageHeader
        title={student.full_name}
        back={{ href: "/alumnos", label: "Alumnos" }}
        actions={
          <Link
            href={`/alumnos/${student.id}/editar`}
            className={buttonVariants({ variant: "secondary" })}
          >
            Editar
          </Link>
        }
      >
        {archived && (
          <p className="text-pending text-sm font-medium">
            Archivado el{" "}
            {formatDate(student.archived_at!, { day: "numeric", month: "long" }, org.timezone)}
          </p>
        )}
      </PageHeader>

      <section className="space-y-3">
        <SectionTitle>Datos</SectionTitle>
        <dl className="bg-card rounded-card space-y-3 border p-4">
          <Detail label="Materia">
            <AreaTag area={studentAreaKey(student)}>{detail}</AreaTag>
          </Detail>
          <Detail label="WhatsApp">{formatArPhone(student.phone) || "—"}</Detail>
          <Detail label="Email">{student.email ?? "—"}</Detail>
          {student.student_notes?.body && (
            <Detail label="Notas">{student.student_notes.body}</Detail>
          )}
        </dl>
      </section>

      <section className="space-y-3">
        <SectionTitle>Precio</SectionTitle>
        <dl className="bg-card rounded-card space-y-3 border p-4">
          <Detail label="Precio">
            <span className="num">{priceSummary(plan, formatARS)}</span>
          </Detail>
          <Detail label="Quién paga">
            {payer ? (
              <>
                {payer.name}
                {payer.relation ? ` (${payer.relation})` : ""}
                {payer.phone ? ` · ${formatArPhone(payer.phone)}` : ""}
              </>
            ) : (
              "El propio alumno"
            )}
          </Detail>
        </dl>
      </section>

      {!archived && account && <StudentAccount studentId={student.id} info={account} />}

      <StudentBilling
        student={student}
        today={localDate(new Date(), org.timezone)}
        teacherName={profile.display_name}
        paymentAlias={org.payment_alias}
        paymentLink={org.payment_link}
      />

      <Clases studentId={student.id} timeZone={org.timezone} archived={archived} />

      <section className="space-y-3">
        <SectionTitle>Historial</SectionTitle>
        <EmptyState title="Todavía no hay nada para mostrar">
          Pronto vas a ver acá sus pagos, tareas y exámenes.
        </EmptyState>
      </section>

      <form action={archived ? restoreStudent : archiveStudent} className="border-t pt-6">
        <input type="hidden" name="studentId" value={student.id} />
        <Button type="submit" variant="secondary">
          {archived ? "Restaurar alumno" : "Archivar alumno"}
        </Button>
        {!archived && (
          <p className="text-ink-3 mt-2 text-sm">
            Deja de aparecer en tu lista y su invitación deja de abrirse. No se borra nada.
          </p>
        )}
      </form>
    </>
  );
}

export default function FichaPage(props: PageProps<"/alumnos/[id]">) {
  return (
    <PageContainer>
      <Suspense fallback={<div className="h-96" aria-hidden />}>
        <Ficha params={props.params} />
      </Suspense>
    </PageContainer>
  );
}
