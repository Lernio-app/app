import { Suspense } from "react";
import { notFound } from "next/navigation";
import { PageContainer, PageHeader } from "@/components/ui/page-header";
import { getCatalog } from "@/lib/catalog-data";
import { formatARS } from "@/lib/format";
import { currentPlan, getStudent, payerContact } from "@/lib/students";
import { OTHER_SUBJECT, type StudentValues } from "@/lib/validation/student";
import { requireWorkspace } from "@/lib/workspace";
import { updateStudent } from "../../actions";
import { StudentForm } from "../../student-form";

export const metadata = { title: "Editar alumno" };

// "$ 18.000" -> "18.000" para el campo de monto (sin el símbolo).
function amountField(centavos: number) {
  return formatARS(centavos).replace("$ ", "");
}

async function EditForm({ params }: { params: PageProps<"/alumnos/[id]/editar">["params"] }) {
  const { profile } = await requireWorkspace();
  const { id } = await params;
  const student = await getStudent(id);
  if (!student) notFound();

  const catalog = await getCatalog();
  const plan = currentPlan(student.price_plans);
  const payer = payerContact(student.student_contacts);
  const defaults: StudentValues = {
    fullName: student.full_name,
    phone: student.phone ?? "",
    email: student.email ?? "",
    subjectChoice: student.subject_id ?? OTHER_SUBJECT,
    areaId: student.area_id ?? "",
    subject: student.subject ?? "",
    levelId: student.level_id ?? "",
    notes: student.student_notes?.body ?? "",
    payerName: payer?.name ?? "",
    payerRelation: payer?.relation ?? "",
    payerPhone: payer?.phone ?? "",
    payerEmail: payer?.email ?? "",
    mode: (plan?.mode as StudentValues["mode"]) ?? "none",
    amount: plan ? amountField(plan.amount) : "",
    lessonsPerPackage: plan?.lessons_per_package?.toString() ?? "",
    billingDay: plan?.billing_day?.toString() ?? "",
    isMinor: student.is_minor,
    minorAge: student.is_minor ? (student.minor_13_plus ? "13_plus" : "under_13") : "",
  };

  return (
    <>
      <PageHeader title={`Editar a ${student.full_name}`} />
      <StudentForm
        action={updateStudent}
        defaults={defaults}
        studentId={student.id}
        catalog={catalog}
        mainAreaId={profile.main_area_id}
        submitLabel="Guardar cambios"
        pendingLabel="Guardando…"
      />
    </>
  );
}

export default function EditarAlumnoPage(props: PageProps<"/alumnos/[id]/editar">) {
  return (
    <PageContainer>
      <Suspense fallback={<div className="h-96" aria-hidden />}>
        <EditForm params={props.params} />
      </Suspense>
    </PageContainer>
  );
}
