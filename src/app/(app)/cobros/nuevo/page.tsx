import { Suspense } from "react";
import Link from "next/link";
import { PageContainer, PageHeader } from "@/components/page-header";
import { localDate } from "@/lib/dates";
import { listStudents } from "@/lib/students";
import { requireWorkspace } from "@/lib/workspace";
import { ChargeForm } from "./charge-form";

export const metadata = { title: "Nuevo cargo" };

async function NewCharge({
  searchParams,
}: {
  searchParams: PageProps<"/cobros/nuevo">["searchParams"];
}) {
  const { org } = await requireWorkspace();
  const params = await searchParams;
  const students = await listStudents({});

  return (
    <ChargeForm
      students={students.map((student) => ({ id: student.id, name: student.full_name }))}
      defaults={{
        studentId: typeof params.alumno === "string" ? params.alumno : "",
        dueOn: localDate(new Date(), org.timezone),
      }}
    />
  );
}

export default function NuevoCargoPage(props: PageProps<"/cobros/nuevo">) {
  return (
    <PageContainer>
      <div className="space-y-1">
        <Link href="/cobros" className="text-muted-foreground text-sm hover:underline">
          ← Cobros
        </Link>
        <PageHeader
          title="Nuevo cargo"
          description="Algo que le cobrás a un alumno, ahora o a futuro."
        />
      </div>
      <Suspense fallback={<div className="h-96" aria-hidden />}>
        <NewCharge searchParams={props.searchParams} />
      </Suspense>
    </PageContainer>
  );
}
