import { Suspense } from "react";
import Link from "next/link";
import { PageContainer, PageHeader } from "@/components/ui/page-header";
import { getCatalog } from "@/lib/catalog-data";
import { isYmd, localDate } from "@/lib/dates";
import { listStudents, studentDetailLine } from "@/lib/students";
import { DEFAULT_DURATION } from "@/lib/validation/lesson";
import { requireWorkspace } from "@/lib/workspace";
import { LessonForm } from "./lesson-form";

export const metadata = { title: "Nueva clase" };

async function NewLesson({
  searchParams,
}: {
  searchParams: PageProps<"/agenda/nueva">["searchParams"];
}) {
  const { org, profile } = await requireWorkspace();
  const params = await searchParams;
  const [students, catalog] = await Promise.all([listStudents({}), getCatalog()]);

  const date =
    typeof params.fecha === "string" && isYmd(params.fecha)
      ? params.fecha
      : localDate(new Date(), org.timezone);
  // `alumno` puede repetirse: la clase grupal que vuelve del alta completa trae a todos los elegidos.
  const preselected = [params.alumno ?? []].flat();

  return (
    <LessonForm
      // Al volver del alta completa con otros alumnos en la URL, el formulario se arma de nuevo en
      // vez de conservar el estado de la visita anterior.
      key={`${date}|${preselected.join(",")}`}
      defaults={{
        date,
        start: "",
        durationMin: String(DEFAULT_DURATION),
        studentIds: preselected,
        meetingUrl: "",
        topic: "",
        repeat: false,
        endsOn: "",
      }}
      catalog={catalog}
      mainAreaId={profile.main_area_id}
      defaultSubjectId={profile.subject_ids.length === 1 ? profile.subject_ids[0] : ""}
      students={students.map((student) => ({
        id: student.id,
        name: student.full_name,
        detail: studentDetailLine(student),
      }))}
    />
  );
}

export default function NuevaClasePage(props: PageProps<"/agenda/nueva">) {
  return (
    <PageContainer>
      <div className="space-y-1">
        <Link href="/agenda" className="text-ink-3 text-sm hover:underline">
          ← Agenda
        </Link>
        <PageHeader title="Nueva clase" description="Individual, grupal o de horario fijo." />
      </div>
      <Suspense fallback={<div className="h-96" aria-hidden />}>
        <NewLesson searchParams={props.searchParams} />
      </Suspense>
    </PageContainer>
  );
}
