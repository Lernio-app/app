import { Suspense } from "react";
import { PageContainer, PageHeader } from "@/components/page-header";
import { requireWorkspace } from "@/lib/workspace";
import { NewStudent } from "./new-student";

export const metadata = { title: "Nuevo alumno" };

async function Form() {
  const { profile } = await requireWorkspace();
  return <NewStudent subjects={profile.subjects} levels={profile.levels} />;
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
