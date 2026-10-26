"use client";

import { useEffect, useRef, useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { LinkShareData } from "./actions";
import { SectionTitle } from "@/components/ui/page-header";

// El link completo solo se ve una vez: acá el profe lo manda por WhatsApp o lo copia. Es la
// invitación del alumno o, para un menor, el pedido de consentimiento a su responsable de pago.
export function LinkShare({ share }: { share: LinkShareData }) {
  const [copied, setCopied] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const consent = share.kind === "consent";

  // El formulario deja al profe abajo de todo: se lo lleva a ver el link.
  useEffect(() => {
    container.current?.scrollIntoView({ block: "start" });
  }, []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(share.link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Sin permiso de portapapeles, el link queda a la vista para copiarlo a mano.
    }
  }

  return (
    <div ref={container} className="bg-card rounded-card scroll-mt-4 space-y-4 border p-5">
      <div className="space-y-1">
        <SectionTitle>
          {consent
            ? `Consentimiento por ${share.studentName}`
            : `Invitación de ${share.studentName}`}
        </SectionTitle>
        <p className="text-ink-3 text-sm">
          {consent
            ? "Se lo mandás a su responsable de pago, no al alumno. Mandáselo ahora: por seguridad no lo podés volver a ver. Vale 7 días. Si lo perdés, pedís uno nuevo y el anterior deja de funcionar."
            : "Mandásela ahora: por seguridad no la podés volver a ver. Vale 7 días. Si la perdés, generás una nueva y la anterior deja de funcionar."}
        </p>
      </div>
      <p className="bg-paper rounded-control p-3 text-sm break-all select-all">{share.link}</p>
      <pre className="text-ink-3 font-sans text-sm [overflow-wrap:anywhere] whitespace-pre-wrap">
        {share.message}
      </pre>
      <div className="flex flex-col gap-2 sm:flex-row">
        <a
          href={share.whatsappUrl}
          target="_blank"
          rel="noreferrer"
          className={cn(buttonVariants(), "flex-1")}
        >
          Mandar por WhatsApp
        </a>
        <Button type="button" variant="secondary" className="flex-1" onClick={copy}>
          {copied ? "Link copiado" : "Copiar link"}
        </Button>
      </div>
    </div>
  );
}
