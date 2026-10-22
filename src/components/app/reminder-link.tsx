"use client";

import { useTransition } from "react";
import { markReminded } from "@/app/(app)/agenda/actions";
import { buttonVariants } from "@/components/ui/button";

// Abre WhatsApp con el recordatorio escrito y anota que ya se mandó para no volver a mostrarlo.
// Va en filas de lista: nunca es el primario de la vista.
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
      className={buttonVariants({ variant: sent ? "ghost" : "secondary" })}
    >
      {label}
    </a>
  );
}
