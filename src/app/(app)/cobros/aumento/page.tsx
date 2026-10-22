import { Suspense } from "react";
import Link from "next/link";
import { PageContainer, PageHeader } from "@/components/page-header";
import { formatARS } from "@/lib/format";
import { currentPlan, listStudents } from "@/lib/students";
import { requireWorkspace } from "@/lib/workspace";
import { IncreaseForm, type IncreaseStudent } from "./increase-form";

export const metadata = { title: "Aumentar precios" };

const UNITS: Record<string, string> = {
  per_lesson: "por clase",
  package: "por paquete",
  monthly: "por mes",
};

async function Increase() {
  await requireWorkspace();
  const students = await listStudents({});

  const rows: IncreaseStudent[] = students.flatMap((student) => {
    const plan = currentPlan(student.price_plans);
    return plan && plan.amount > 0
      ? [
          {
            id: student.id,
            name: student.full_name,
            amount: plan.amount,
            unit: UNITS[plan.mode] ?? "",
          },
        ]
      : [];
  });

  return <IncreaseForm students={rows} />;
}

export default function AumentoPage() {
  return (
    <PageContainer>
      <div className="space-y-1">
        <Link href="/cobros" className="text-muted-foreground text-sm hover:underline">
          ← Cobros
        </Link>
        <PageHeader
          title="Aumentar precios"
          description={`Elegí el porcentaje y a quiénes aplica. Ejemplo: ${formatARS(1800000)} con 10% queda ${formatARS(1980000)}.`}
        />
      </div>
      <Suspense fallback={<div className="h-96" aria-hidden />}>
        <Increase />
      </Suspense>
    </PageContainer>
  );
}
