import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EmptyState, PageContainer, PageHeader, SectionTitle } from "@/components/ui/page-header";
import { StudentBilling } from "@/components/app/student-billing";
import { Button, buttonVariants } from "@/components/ui/button";
import { dayLabel, localDate } from "@/lib/dates";
import { formatARS, formatDate, formatTime } from "@/lib/format";
import { listStudentLessons } from "@/lib/lessons";
import { currentPlan, getStudent } from "@/lib/students";
import { ATTENDANCE_LABELS, type Attendance } from "@/lib/validation/lesson";
import { priceSummary } from "@/lib/validation/student";
import { requireWorkspace } from "@/lib/workspace";
import { archiveStudent, restoreStudent } from "../actions";
import { RegenerateLink } from "./regenerate-link";

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

async function Ficha({ params }: { params: PageProps<"/alumnos/[id]">["params"] }) {
  const { org, profile } = await requireWorkspace();
  const { id } = await params;
  const student = await getStudent(id);
  if (!student) notFound();

  const plan = currentPlan(student.price_plans);
  const payer = student.student_contacts.find((contact) => contact.is_payer);
  const detail = [student.subject, student.level].filter(Boolean).join(" · ");
  const archived = student.archived_at !== null;

  return (
    <>
      <PageHeader
        title={student.full_name}
        description={detail || undefined}
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
          <Detail label="WhatsApp">{student.phone ?? "—"}</Detail>
          <Detail label="Email">{student.email ?? "—"}</Detail>
          {student.notes && <Detail label="Notas">{student.notes}</Detail>}
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
                {payer.phone ? ` · ${payer.phone}` : ""}
              </>
            ) : (
              "El propio alumno"
            )}
          </Detail>
        </dl>
      </section>

      {!archived && <RegenerateLink studentId={student.id} />}

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
            Deja de aparecer en tu lista y su link deja de abrirse. No se borra nada.
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
