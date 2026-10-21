export function PageContainer({ children }: { children: React.ReactNode }) {
  return <main className="mx-auto w-full max-w-3xl space-y-6 px-5 py-6 md:py-10">{children}</main>;
}

export function PageHeader({ title, description }: { title: string; description?: string }) {
  return (
    <header className="space-y-1">
      <h1 className="text-2xl md:text-3xl">{title}</h1>
      {description && <p className="text-muted-foreground">{description}</p>}
    </header>
  );
}

export function EmptyState({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="bg-card rounded-xl border border-dashed px-5 py-8 text-center">
      <p className="font-medium">{title}</p>
      {children && (
        <p className="text-muted-foreground mx-auto mt-1 max-w-sm text-sm">{children}</p>
      )}
    </div>
  );
}
