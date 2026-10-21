import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { firstName } from "@/lib/messages";
import { createClient } from "@/lib/supabase/server";

// El token va en la URL: que no se indexe ni se filtre a otros sitios.
export const metadata: Metadata = {
  title: "Tu espacio de clases",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

// Hasta F4 (portal del alumno) el link solo saluda: valida el token y muestra nombres.
async function Welcome({ params }: { params: PageProps<"/a/[token]">["params"] }) {
  await connection();
  const { token } = await params;

  const supabase = await createClient();
  const { data } = await supabase.rpc("student_by_token", { p_token: token });
  const access = data?.[0];
  if (!access) notFound();

  return (
    <>
      <h1 className="text-3xl">Hola, {firstName(access.student_name)}</h1>
      <p className="text-muted-foreground">
        {firstName(access.teacher_name)} está preparando tu espacio de clases. Guardá este link: acá
        vas a ver tus próximas clases, tus tareas y cómo pagar.
      </p>
    </>
  );
}

export default function AlumnoPage(props: PageProps<"/a/[token]">) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center gap-4 px-5 py-10">
      <p className="text-primary text-sm font-medium">Lernio</p>
      <Suspense fallback={<div className="h-32" aria-hidden />}>
        <Welcome params={props.params} />
      </Suspense>
    </main>
  );
}
