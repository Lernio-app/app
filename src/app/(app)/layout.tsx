import { Suspense } from "react";
import { BottomNav, SideNav } from "@/components/app/app-nav";
import { Logo } from "@/components/ui/logo";
import { Surface } from "@/components/ui/surface";
import { requireWorkspace } from "@/lib/workspace";

async function Shell({ children }: { children: React.ReactNode }) {
  const { profile } = await requireWorkspace();

  return (
    <div className="min-h-dvh md:flex">
      <aside className="sticky top-0 hidden h-dvh w-58 shrink-0 flex-col gap-6 border-r bg-white p-4 md:flex">
        <Logo className="px-2 pt-2" />
        <SideNav />
        <p className="text-ink-3 truncate px-3 text-sm">{profile.display_name}</p>
      </aside>
      <div className="min-w-0 flex-1 pb-24 md:pb-0">{children}</div>
      <BottomNav />
    </div>
  );
}

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <Surface name="app">
      <Suspense fallback={<div className="min-h-dvh" aria-hidden />}>
        <Shell>{children}</Shell>
      </Suspense>
    </Surface>
  );
}
