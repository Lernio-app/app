import { EncabezadoMarketplace } from "@/components/marketplace/encabezado";
import { PieMarketplace } from "@/components/marketplace/pie";
import { Surface } from "@/components/ui/surface";

// Lo que busca un alumno o una familia: home, clases, perfil del profe y blog (§1.1).
export default function MarketplaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <Surface name="marketplace">
      <EncabezadoMarketplace />
      <div className="flex flex-1 flex-col">{children}</div>
      <PieMarketplace />
    </Surface>
  );
}
