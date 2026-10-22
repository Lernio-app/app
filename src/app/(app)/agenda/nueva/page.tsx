import { Suspense } from "react";
import Link from "next/link";
import { PageContainer, PageHeader } from "@/components/page-header";
import { isYmd, localDate } from "@/lib/dates";
import { listStudents } from "@/lib/students";
import { DEFAULT_DURATION } from "@/lib/validation/lesson";
import { requireWorkspace } from "@/lib/workspace";
import { LessonForm } from "./lesson-form";

export const metadata = { title: "Nueva clase" };

async function NewLesson({
  searchParams,
}: {
  searchParams: PageProps<"/agenda/nueva">["searchParams"];
}) {
  const { org } = await requireWorkspace();
  const params = await searchParams;
  const students = await listStudents({});

  const date =
    typeof params.fecha === "string" && isYmd(params.fecha)
      ? params.fecha
      : localDate(new Date(), org.timezone);
  const preselected = typeof params.alumno === "string" ? [params.alumno] : [];

  return (
    <LessonForm
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
      students={students.map((student) => ({
        id: student.id,
        name: student.full_name,
        detail: [student.subject, student.level].filter(Boolean).join(" · "),
      }))}
    />
  );
}

export default function NuevaClasePage(props: PageProps<"/agenda/nueva">) {
  return (
    <PageContainer>
      <div className="space-y-1">
        <Link href="/agenda" className="text-muted-foreground text-sm hover:underline">
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
