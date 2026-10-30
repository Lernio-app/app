// Teléfonos argentinos. En la base se guardan en formato internacional de celular (549 + área +
// número), sin símbolos; la migración `f1_telefono_obligatorio` repite esta normalización.

// Teléfono argentino escrito de cualquier forma -> formato internacional de celular (549 + área + número).
// Devuelve null si no se puede interpretar.
export function normalizeArPhone(raw: string): string | null {
  let digits = raw.replace(/\D/g, "");
  if (!digits) return null;

  digits = digits.replace(/^0+/, "");
  if (digits.startsWith("54")) {
    digits = digits.slice(2);
    if (digits.startsWith("9")) digits = digits.slice(1);
  }
  // El 15 de los celulares se saca: 11 15 5555 1234 -> 11 5555 1234.
  if (digits.length === 12) {
    for (const at of [2, 3, 4]) {
      if (digits.slice(at, at + 2) === "15") {
        digits = digits.slice(0, at) + digits.slice(at + 2);
        break;
      }
    }
  }
  return digits.length === 10 ? `549${digits}` : null;
}

// Cómo se ve un teléfono guardado: «11 5555 1234». Lo que no tiene el formato guardado (un dato
// anterior a la normalización) se muestra tal cual.
export function formatArPhone(stored: string | null | undefined): string {
  if (!stored) return "";
  const match = /^549(\d{10})$/.exec(stored);
  if (!match) return stored;
  const national = match[1];
  // Buenos Aires tiene el área de dos dígitos; el resto, de tres en el caso más común.
  const area = national.startsWith("11") ? 2 : 3;
  const rest = national.slice(area);
  const split = rest.length - 4;
  return `${national.slice(0, area)} ${rest.slice(0, split)} ${rest.slice(split)}`;
}
