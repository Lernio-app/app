import { Suspense } from "react";
import { redirect } from "next/navigation";
import { WorkspaceForm } from "@/components/app/workspace-form";
import { Logo } from "@/components/ui/logo";
import { PageTitle } from "@/components/ui/page-header";
import { getCatalog } from "@/lib/catalog-data";
import { getUser, getWorkspace } from "@/lib/workspace";
import { createWorkspace } from "./actions";

export const metadata = { title: "Bienvenida" };

async function Welcome() {
  if (!(await getUser())) redirect("/ingresar");
  if (await getWorkspace()) redirect("/app");

  const catalog = await getCatalog();

  return (
    <WorkspaceForm
      action={createWorkspace}
      catalog={catalog}
      submitLabel="Crear mi espacio"
      pendingLabel="Creando…"
      requireLegal
      defaults={{
        displayName: "",
        phone: "",
        subjectIds: [],
        paymentAlias: "",
        paymentLink: "",
        lateCancelHours: 24,
      }}
    />
  );
}

export default function BienvenidaPage() {
  return (
    <main className="mx-auto w-full max-w-lg space-y-8 px-5 py-10">
      <header className="space-y-3">
        <Logo />
        <PageTitle>Armemos tu espacio</PageTitle>
        <p className="text-ink-2">Son unos minutos. Después podés cambiar todo desde Ajustes.</p>
      </header>
      <Suspense fallback={<div className="h-96" aria-hidden />}>
        <Welcome />
      </Suspense>
    </main>
  );
}
