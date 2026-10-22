"use client";

import { useTransition } from "react";
import { markReminded } from "@/app/(app)/agenda/actions";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Abre WhatsApp con el recordatorio escrito y anota que ya se mandó para no volver a mostrarlo.
export function ReminderLink({
  href,
  lessonId,
  studentId,
  label,
  sent = false,
}: {
  href: string;
  lessonId: string;
  studentId: string;
  label: string;
  sent?: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-disabled={pending}
      onClick={() => {
        const data = new FormData();
        data.set("lessonId", lessonId);
        data.set("studentId", studentId);
        startTransition(() => markReminded(data));
      }}
      className={cn(buttonVariants({ variant: sent ? "outline" : "default", size: "lg" }), "h-11")}
    >
      {label}
    </a>
  );
}
