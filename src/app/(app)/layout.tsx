import { Suspense } from "react";
import { BottomNav, SideNav } from "@/components/app-nav";
import { requireWorkspace } from "@/lib/workspace";

async function Shell({ children }: { children: React.ReactNode }) {
  const { profile } = await requireWorkspace();

  return (
    <div className="min-h-dvh md:flex">
      <aside className="bg-sidebar sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-6 border-r p-4 md:flex">
        <p className="text-primary px-3 pt-2 text-lg font-bold tracking-tight">Lernio</p>
        <SideNav />
        <p className="text-muted-foreground truncate px-3 text-sm">{profile.display_name}</p>
      </aside>
      <div className="min-w-0 flex-1 pb-24 md:pb-0">{children}</div>
      <BottomNav />
    </div>
  );
}

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <Suspense fallback={<div className="min-h-dvh" aria-hidden />}>
      <Shell>{children}</Shell>
    </Suspense>
  );
}
