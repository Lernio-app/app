import { Suspense } from "react";
import Link from "next/link";
import { EmptyState, PageContainer, PageHeader } from "@/components/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { debtors } from "@/lib/billing";
import { listOpenCharges } from "@/lib/billing-data";
import { localDate } from "@/lib/dates";
import { formatARS } from "@/lib/format";
import { currentPlan, listStudents } from "@/lib/students";
import { priceSummary } from "@/lib/validation/student";
import { requireWorkspace } from "@/lib/workspace";
import { cn } from "@/lib/utils";

export const metadata = { title: "Alumnos" };

async function StudentList({
  searchParams,
}: {
  searchParams: PageProps<"/alumnos">["searchParams"];
}) {
  const { org } = await requireWorkspace();
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q : "";
  const archived = params.archivados === "1";
  const [students, charges] = await Promise.all([
    listStudents({ query, archived }),
    listOpenCharges(),
  ]);
  const owed = new Map(
    debtors(charges, localDate(new Date(), org.timezone)).map((debtor) => [
      debtor.studentId,
      debtor.owed,
    ]),
  );

  return (
    <>
      <form action="/alumnos" className="flex gap-2" role="search">
        <Input
          name="q"
          type="search"
          defaultValue={query}
          placeholder="Buscar por nombre"
          aria-label="Buscar alumno por nombre"
          className="h-11"
        />
        {archived && <input type="hidden" name="archivados" value="1" />}
      </form>

      <nav aria-label="Filtro" className="flex gap-2 text-sm">
        <Link
          href="/alumnos"
          aria-current={!archived ? "page" : undefined}
          className={cn(
            "rounded-full border px-3 py-1.5",
            !archived ? "border-primary bg-accent font-medium" : "text-muted-foreground",
          )}
        >
          Activos
        </Link>
        <Link
          href="/alumnos?archivados=1"
          aria-current={archived ? "page" : undefined}
          className={cn(
            "rounded-full border px-3 py-1.5",
            archived ? "border-primary bg-accent font-medium" : "text-muted-foreground",
          )}
        >
          Archivados
        </Link>
      </nav>

      {students.length === 0 ? (
        query ? (
          <EmptyState title="No encontramos a nadie con ese nombre" />
        ) : archived ? (
          <EmptyState title="No tenés alumnos archivados" />
        ) : (
          <EmptyState title="Todavía no cargaste alumnos">
            Cargá al primero y mandale su link por WhatsApp.
          </EmptyState>
        )
      ) : (
        <ul className="space-y-2">
          {students.map((student) => {
            const plan = currentPlan(student.price_plans);
            const detail = [student.subject, student.level].filter(Boolean).join(" · ");
            return (
              <li key={student.id}>
                <Link
                  href={`/alumnos/${student.id}`}
                  className="bg-card hover:bg-muted/50 block rounded-xl border p-4"
                >
                  <p className="font-medium">{student.full_name}</p>
                  {detail && <p className="text-muted-foreground text-sm">{detail}</p>}
                  <p className="tabular text-muted-foreground text-sm">
                    {priceSummary(plan, formatARS)}
                  </p>
                  {owed.has(student.id) && (
                    <p className="tabular text-status-owed text-sm font-medium">
                      Debe {formatARS(owed.get(student.id) ?? 0)}
                    </p>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

export default function AlumnosPage(props: PageProps<"/alumnos">) {
  return (
    <PageContainer>
      <div className="flex items-start justify-between gap-3">
        <PageHeader title="Alumnos" description="Todos tus alumnos, con su precio." />
        <Link href="/alumnos/nuevo" className={cn(buttonVariants({ size: "lg" }), "h-11 shrink-0")}>
          Nuevo
        </Link>
      </div>
      <Suspense fallback={<div className="h-64" aria-hidden />}>
        <StudentList searchParams={props.searchParams} />
      </Suspense>
    </PageContainer>
  );
}
