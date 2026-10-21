export const DEFAULT_TIMEZONE = "America/Argentina/Buenos_Aires";

const LOCALE = "es-AR";

// Los montos viven en centavos de peso, como enteros.
export function formatARS(centavos: number): string {
  const pesos = Math.round(centavos) / 100;
  const hasCents = !Number.isInteger(pesos);
  const number = new Intl.NumberFormat(LOCALE, {
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: hasCents ? 2 : 0,
  }).format(Math.abs(pesos));
  return `${pesos < 0 ? "-" : ""}$ ${number}`;
}

// Pesos que escribe el profe ("18.000", "1.500,50") a centavos. null si no se entiende.
export function parseARSToCentavos(input: string): number | null {
  const cleaned = input.replace(/[\s$]/g, "");
  if (!/^\d{1,3}(\.\d{3})*(,\d{1,2})?$|^\d+(,\d{1,2})?$/.test(cleaned)) return null;
  const [whole, cents = ""] = cleaned.replace(/\./g, "").split(",");
  return Number(whole) * 100 + Number(cents.padEnd(2, "0"));
}

export function formatDate(
  date: Date | string,
  options: Intl.DateTimeFormatOptions = { day: "numeric", month: "long" },
  timeZone: string = DEFAULT_TIMEZONE,
): string {
  return new Intl.DateTimeFormat(LOCALE, { ...options, timeZone }).format(new Date(date));
}

export function formatTime(date: Date | string, timeZone: string = DEFAULT_TIMEZONE): string {
  return new Intl.DateTimeFormat(LOCALE, {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone,
  }).format(new Date(date));
}
