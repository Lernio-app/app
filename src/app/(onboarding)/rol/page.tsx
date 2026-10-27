import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { PageTitle } from "@/components/ui/page-header";
import { getStudentProfile } from "@/lib/portal";
import { cn } from "@/lib/utils";
import { getUser, getWorkspace } from "@/lib/workspace";
import { chooseStudent } from "./actions";

export const metadata = { title: "Elegí cómo entrás" };

// Quien entra sin invitación y sin espacio elige una sola vez (ADR-0004 #4).
async function Choice() {
  if (!(await getUser())) redirect("/ingresar");
  if (await getWorkspace()) redirect("/app");
  if (await getStudentProfile()) redirect("/portal");

  return (
    <div className="space-y-3">
      <Link href="/bienvenida" className={cn(buttonVariants(), "w-full")}>
        Soy profe
      </Link>
      <form action={chooseStudent}>
        <Button type="submit" variant="secondary" className="w-full">
          Soy alumno
        </Button>
      </form>
    </div>
  );
}

export default function RolPage() {
  return (
    <main className="mx-auto w-full max-w-lg space-y-8 px-5 py-10">
      <header className="space-y-3">
        <Logo />
        <PageTitle>¿Cómo vas a usar Lernio?</PageTitle>
        <p className="text-ink-2">
          Si das clases, armamos tu espacio. Si tomás clases, creamos tu cuenta de alumno: cuando un
          profe te invite, la vinculás con un toque.
        </p>
      </header>
      <Suspense fallback={<div className="h-32" aria-hidden />}>
        <Choice />
      </Suspense>
    </main>
  );
}
