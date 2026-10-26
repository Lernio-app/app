import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Logo } from "@/components/ui/logo";
import { PageTitle } from "@/components/ui/page-header";
import { hasAcceptedLegal } from "@/lib/legal";
import { safeNext } from "@/lib/next-path";
import { getUser } from "@/lib/workspace";
import { AcceptForm } from "./accept-form";

export const metadata = { title: "Términos y privacidad" };

async function Accept({ searchParams }: { searchParams: PageProps<"/aceptar">["searchParams"] }) {
  const { next: nextParam } = await searchParams;
  const next = safeNext(Array.isArray(nextParam) ? nextParam[0] : nextParam);

  const user = await getUser();
  if (!user) redirect("/ingresar");
  if (await hasAcceptedLegal(user.id)) redirect(next);

  return <AcceptForm next={next} />;
}

export default function AceptarPage(props: PageProps<"/aceptar">) {
  return (
    <main className="mx-auto w-full max-w-lg space-y-8 px-5 py-10">
      <header className="space-y-3">
        <Logo />
        <PageTitle>Antes de seguir</PageTitle>
        <p className="text-ink-2">
          Para seguir usando Lernio, leé y aceptá los términos y la política de privacidad.
        </p>
      </header>
      <Suspense fallback={<div className="h-32" aria-hidden />}>
        <Accept searchParams={props.searchParams} />
      </Suspense>
    </main>
  );
}
