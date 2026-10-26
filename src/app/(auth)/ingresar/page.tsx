import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Logo } from "@/components/ui/logo";
import { PageTitle } from "@/components/ui/page-header";
import { safeNext } from "@/lib/next-path";
import { getUser } from "@/lib/workspace";
import { LoginForm } from "./login-form";

export const metadata = { title: "Ingresar" };

const ERRORS: Record<string, string> = {
  enlace: "El link venció o ya se usó. Pedí uno nuevo.",
  google: "No pudimos ingresar con Google. Probá con tu email.",
};

async function LoginContent({
  searchParams,
}: {
  searchParams: PageProps<"/ingresar">["searchParams"];
}) {
  const params = await searchParams;
  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
  const errorKey = first(params.error);
  const next = safeNext(first(params.next));

  // Si ya tiene sesión, no tiene sentido pedirle que ingrese.
  if (await getUser()) redirect(next);

  return (
    <LoginForm
      initialError={errorKey ? (ERRORS[errorKey] ?? null) : null}
      googleEnabled={process.env.NEXT_PUBLIC_GOOGLE_ENABLED === "true"}
      next={next}
    />
  );
}

export default function IngresarPage(props: PageProps<"/ingresar">) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center gap-8 px-5 py-10">
      <header className="space-y-3">
        <Logo />
        <PageTitle>Ingresá a tu espacio</PageTitle>
        <p className="text-ink-2">
          Alumnos, clases y cobros en un solo lugar. Sin contraseñas: te mandamos un link por email.
        </p>
      </header>
      <Suspense fallback={<div className="h-40" aria-hidden />}>
        <LoginContent searchParams={props.searchParams} />
      </Suspense>
    </main>
  );
}
