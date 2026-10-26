import { FormError } from "@/components/ui/field";

// Casilla para aceptar los términos y la privacidad. Los textos se abren en otra pestaña para no
// perder lo que se escribió en el formulario.
export function LegalCheck({ error }: { error?: string }) {
  return (
    <div className="space-y-2">
      <label className="bg-card rounded-control flex min-h-11 cursor-pointer items-start gap-3 border px-3 py-3 text-sm">
        <input type="checkbox" name="legal" className="accent-primary mt-0.5 size-4 shrink-0" />
        <span>
          Leí y acepto los{" "}
          <a
            href="/terminos"
            target="_blank"
            rel="noreferrer"
            className="text-primary font-medium underline"
          >
            términos y condiciones
          </a>{" "}
          y la{" "}
          <a
            href="/privacidad"
            target="_blank"
            rel="noreferrer"
            className="text-primary font-medium underline"
          >
            política de privacidad
          </a>
          .
        </span>
      </label>
      {error && <FormError>{error}</FormError>}
    </div>
  );
}

export const LEGAL_REQUIRED_MESSAGE = "Para seguir tenés que aceptar los términos y la privacidad.";
