import { Suspense } from "react";
import Link from "next/link";
import { PageContainer, PageHeader } from "@/components/ui/page-header";
import { localDate } from "@/lib/dates";
import { listStudents } from "@/lib/students";
import { requireWorkspace } from "@/lib/workspace";
import { PaymentForm } from "./payment-form";

export const metadata = { title: "Me pagó" };

async function NewPayment({
  searchParams,
}: {
  searchParams: PageProps<"/cobros/pago">["searchParams"];
}) {
  const { org } = await requireWorkspace();
  const params = await searchParams;
  const students = await listStudents({});

  return (
    <PaymentForm
      students={students.map((student) => ({ id: student.id, name: student.full_name }))}
      defaults={{
        studentId: typeof params.alumno === "string" ? params.alumno : "",
        paidOn: localDate(new Date(), org.timezone),
      }}
    />
  );
}

export default function PagoPage(props: PageProps<"/cobros/pago">) {
  return (
    <PageContainer>
      <div className="space-y-1">
        <Link href="/cobros" className="text-ink-3 text-sm hover:underline">
          ← Cobros
        </Link>
        <PageHeader title="Me pagó" description="Anotar plata que recibí, por fuera de la app." />
      </div>
      <Suspense fallback={<div className="h-96" aria-hidden />}>
        <NewPayment searchParams={props.searchParams} />
      </Suspense>
    </PageContainer>
  );
}
