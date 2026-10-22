"use client";

import { Button } from "@/components/ui/button";

// Botón de una acción que no se deshace con un toque: pide confirmar antes de enviar.
export function ConfirmForm({
  action,
  fields,
  message,
  label,
}: {
  action: (formData: FormData) => void | Promise<void>;
  fields: Record<string, string>;
  message: string;
  label: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm(message)) event.preventDefault();
      }}
    >
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <Button type="submit" variant="ghost">
        {label}
      </Button>
    </form>
  );
}
