import { Suspense } from "react";
import { redirect } from "next/navigation";
import { WorkspaceForm } from "@/components/workspace-form";
import { getUser, getWorkspace } from "@/lib/workspace";
import { createWorkspace } from "./actions";

export const metadata = { title: "Bienvenida" };

async function Welcome() {
  if (!(await getUser())) redirect("/ingresar");
  if (await getWorkspace()) redirect("/");

  return (
    <WorkspaceForm
      action={createWorkspace}
      submitLabel="Crear mi espacio"
      pendingLabel="Creando…"
      defaults={{
        displayName: "",
        phone: "",
        subjects: [],
        levels: [],
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
      <header className="space-y-2">
        <p className="text-primary text-sm font-medium">Lernio</p>
        <h1 className="text-3xl">Armemos tu espacio</h1>
        <p className="text-muted-foreground">
          Son unos minutos. Después podés cambiar todo desde Ajustes.
        </p>
      </header>
      <Suspense fallback={<div className="h-96" aria-hidden />}>
        <Welcome />
      </Suspense>
    </main>
  );
}
