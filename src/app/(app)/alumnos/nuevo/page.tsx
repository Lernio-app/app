import { Suspense } from "react";
import { PageContainer, PageHeader } from "@/components/ui/page-header";
import { defaultAreaFor } from "@/lib/catalog";
import { getCatalog } from "@/lib/catalog-data";
import { requireWorkspace } from "@/lib/workspace";
import { EMPTY_STUDENT } from "../student-form";
import { NewStudent } from "./new-student";

export const metadata = { title: "Nuevo alumno" };

async function Form() {
  const { profile } = await requireWorkspace();
  const catalog = await getCatalog();

  // Si el profe da una sola materia, viene elegida: el alta no suma ningún toque.
  const only =
    profile.subject_ids.length === 1
      ? catalog.subjects.find((subject) => subject.id === profile.subject_ids[0])
      : undefined;
  const defaults = only
    ? {
        ...EMPTY_STUDENT,
        subjectChoice: only.id,
        areaId: defaultAreaFor(only, catalog, profile.main_area_id),
      }
    : EMPTY_STUDENT;

  return <NewStudent catalog={catalog} mainAreaId={profile.main_area_id} defaults={defaults} />;
}

export default function NuevoAlumnoPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Nuevo alumno"
        description="Con el nombre y cómo le cobrás alcanza. El resto lo podés completar después."
      />
      <Suspense fallback={<div className="h-96" aria-hidden />}>
        <Form />
      </Suspense>
    </PageContainer>
  );
}
