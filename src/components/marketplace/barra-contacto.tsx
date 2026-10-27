import { Button } from "@/components/ui/button";

// Barra fija del celular (§12.8): el precio y "Consultar". Respeta el área segura de abajo; la
// página lleva un padding inferior igual a su alto (§12.12).
export function BarraContacto({
  precio,
  alConsultar,
  abierta,
}: {
  precio: React.ReactNode;
  alConsultar: () => void;
  abierta: boolean;
}) {
  return (
    <div className="border-line fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-4 border-t bg-white px-5 pt-3 pb-[max(env(safe-area-inset-bottom),--spacing(3))] lg:hidden">
      <div className="leading-tight">{precio}</div>
      <Button type="button" aria-expanded={abierta} onClick={alConsultar} className="px-8">
        Consultar
      </Button>
    </div>
  );
}
