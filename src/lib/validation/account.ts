import { normalizeArPhone } from "@/lib/phone";

// Nombre y teléfono que el alumno confirma al activar su cuenta (F1-5). Son datos de su cuenta: no se
// comparan con la ficha del profe ni sirven para vincular (ADR-0012 y ADR-0013). El teléfono es
// opcional: sin él la cuenta se activa igual.
export type AccountFieldErrors = { fullName?: string; phone?: string };

export function parseAccountForm(
  formData: FormData,
):
  | { success: true; data: { fullName: string; phone: string | null } }
  | { success: false; fieldErrors: AccountFieldErrors } {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const rawPhone = String(formData.get("phone") ?? "").trim();

  const fieldErrors: AccountFieldErrors = {};
  if (fullName === "") fieldErrors.fullName = "Poné tu nombre.";
  else if (fullName.length > 120) fieldErrors.fullName = "Usá hasta 120 caracteres.";

  const phone = rawPhone === "" ? null : normalizeArPhone(rawPhone);
  if (rawPhone !== "" && phone === null) {
    fieldErrors.phone =
      "No entendimos el teléfono. Escribilo con el código de área, por ejemplo 11 5555 1234.";
  }

  if (fieldErrors.fullName || fieldErrors.phone) return { success: false, fieldErrors };
  return { success: true, data: { fullName, phone } };
}
