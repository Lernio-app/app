import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export function PageContainer({ children }: { children: React.ReactNode }) {
  return <main className="mx-auto w-full max-w-3xl space-y-6 px-5 py-6 md:py-10">{children}</main>;
}

// Título de pantalla (§3.2). Lleva, como mucho, un <Resaltador> en la fecha o la frase clave.
export function PageTitle({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <h1 className={cn("title-page text-ink", className)}>{children}</h1>;
}

export function SectionTitle({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <h2 className={cn("title-section text-ink", className)}>{children}</h2>;
}

// Encabezado de pantalla sobre cuadrícula (§5.1). La cuadrícula no va debajo de listas ni tablas:
// termina con el encabezado. Las acciones van a la derecha; como mucho una es primaria.
export function PageHeader({
  title,
  label,
  description,
  back,
  actions,
  children,
}: {
  title: React.ReactNode;
  label?: string;
  description?: string;
  back?: { href: string; label: string };
  actions?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <header className="bg-cuadricula rounded-card flex flex-wrap items-end justify-between gap-4 border px-5 pt-5 pb-5 md:px-6">
      <div className="min-w-0 space-y-2">
        {back && (
          <Link
            href={back.href}
            className="text-ink-2 inline-flex min-h-8 items-center gap-1 text-sm hover:underline"
          >
            <ArrowLeft className="size-4" strokeWidth={1.8} aria-hidden />
            {back.label}
          </Link>
        )}
        {label && <p className="label-mono text-ink-3">{label}</p>}
        <PageTitle>{title}</PageTitle>
        {description && <p className="text-ink-2">{description}</p>}
        {children}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

// Estado vacío: en segunda persona y sin ilustración.
export function EmptyState({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-card border border-dashed bg-white px-5 py-8 text-center">
      <p className="font-semibold">{title}</p>
      {children && <p className="text-ink-3 mx-auto mt-1 max-w-sm text-sm">{children}</p>}
    </div>
  );
}
