import { Contenedor } from "./contenedor";
import { PublicacionCardEsqueleto } from "./publicacion-card";

// Cargando (§12.5): encabezado y 6 esqueletos de la misma altura que la tarjeta. Lo usan el
// `loading.tsx` de /clases y el Suspense de cada página del catálogo.
export function CatalogoEsqueleto() {
  return (
    <main aria-busy="true" aria-label="Cargando las clases">
      <div className="bg-cuadricula border-line border-b">
        <Contenedor className="space-y-4 py-[clamp(1.75rem,4vw,2.75rem)]">
          <div className="bg-paper rounded-tag h-4 w-40 animate-pulse" aria-hidden />
          <div className="bg-paper rounded-tag h-12 w-72 animate-pulse" aria-hidden />
        </Contenedor>
      </div>
      <Contenedor className="py-8">
        <ul className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(min(100%,18rem),1fr))]">
          {Array.from({ length: 6 }, (_, indice) => (
            <li key={indice}>
              <PublicacionCardEsqueleto />
            </li>
          ))}
        </ul>
      </Contenedor>
    </main>
  );
}
