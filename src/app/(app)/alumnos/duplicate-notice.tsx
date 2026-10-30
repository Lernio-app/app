import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SectionTitle } from "@/components/ui/page-header";
import type { PossibleDuplicate } from "./actions";

const MATCHED_BY = {
  name: "mismo nombre",
  phone: "mismo teléfono",
  both: "mismo nombre y teléfono",
} as const;

// Aviso de posible duplicado: no bloquea, el profe decide con «Cargar igual» o corrige los datos.
// Dentro del formulario completo «Cargar igual» envía el formulario; con `onConfirm` (alta rápida,
// que no es un formulario) es un botón común.
export function DuplicateNotice({
  duplicates,
  pending,
  onConfirm,
}: {
  duplicates: PossibleDuplicate[];
  pending: boolean;
  onConfirm?: () => void;
}) {
  const same = duplicates.some((item) => item.sameSubject);
  return (
    <div role="status" className="bg-card rounded-card space-y-3 border p-5">
      <SectionTitle>
        {same ? "Puede que ya tengas a este alumno" : "Ya tenés un alumno parecido"}
      </SectionTitle>
      <ul className="space-y-2 text-sm">
        {duplicates.map((item) => (
          <li key={item.id}>
            <Link
              href={`/alumnos/${item.id}`}
              target="_blank"
              className="text-primary font-medium underline"
            >
              {item.fullName}
            </Link>
            {item.detail && <span className="text-ink-3"> · {item.detail}</span>}
            <span className="text-ink-3">
              {" "}
              ({MATCHED_BY[item.matchedBy]}
              {item.archived ? ", archivado" : ""})
            </span>
          </li>
        ))}
      </ul>
      <p className="text-ink-3 text-sm">
        {same
          ? "Está cargado en la misma materia. Si es otra persona, cargalo igual."
          : "Está cargado en otra materia. Si es la misma persona con otra clase, cargalo igual: quedan como dos alumnos."}
      </p>
      <Button
        type={onConfirm ? "button" : "submit"}
        name={onConfirm ? undefined : "confirmDuplicates"}
        value={onConfirm ? undefined : "1"}
        onClick={onConfirm}
        variant="secondary"
        className="w-full sm:w-auto"
        disabled={pending}
      >
        Cargar igual
      </Button>
    </div>
  );
}
