import { DEFAULT_TIMEZONE } from "@/lib/format";

// Los días se manejan como texto "YYYY-MM-DD" y las horas como "HH:mm", siempre en la zona de la
// organización. Solo se convierten a instantes (UTC) en el borde con la base.

const YMD = /^\d{4}-\d{2}-\d{2}$/;
const HM = /^([01]\d|2[0-3]):[0-5]\d$/;

export function isYmd(value: string): boolean {
  if (!YMD.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

export function isHm(value: string): boolean {
  return HM.test(value);
}

function parts(ymd: string) {
  const [y, m, d] = ymd.split("-").map(Number);
  return { y, m, d };
}

function toYmd(date: Date): string {
  return date.toISOString().slice(0, 10);
}

// Día de hoy (o del instante dado) en la zona indicada.
export function localDate(instant: Date | string, timeZone: string = DEFAULT_TIMEZONE): string {
  const formatted = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(instant));
  return formatted;
}

// Hora "HH:mm" local de un instante.
export function localTime(instant: Date | string, timeZone: string = DEFAULT_TIMEZONE): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(instant));
}

export function addDays(ymd: string, days: number): string {
  const { y, m, d } = parts(ymd);
  return toYmd(new Date(Date.UTC(y, m - 1, d + days)));
}

// Días de diferencia entre dos días ("YYYY-MM-DD"): positivo si `to` es posterior.
export function daysBetween(from: string, to: string): number {
  const a = parts(from);
  const b = parts(to);
  return Math.round((Date.UTC(b.y, b.m - 1, b.d) - Date.UTC(a.y, a.m - 1, a.d)) / 86_400_000);
}

// Mes ("YYYY-MM") de un día.
export function monthOf(ymd: string): string {
  return ymd.slice(0, 7);
}

// Los últimos `count` meses terminando en el de `ymd`, del más viejo al más nuevo.
export function monthsBack(ymd: string, count: number): string[] {
  const { y, m } = parts(ymd);
  return Array.from({ length: count }, (_, i) => {
    const date = new Date(Date.UTC(y, m - 1 - (count - 1 - i), 1));
    return toYmd(date).slice(0, 7);
  });
}

// Día de la semana ISO: 1 lunes ... 7 domingo.
export function isoWeekday(ymd: string): number {
  const { y, m, d } = parts(ymd);
  const day = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return day === 0 ? 7 : day;
}

// Lunes de la semana en la que cae el día.
export function startOfWeek(ymd: string): string {
  return addDays(ymd, 1 - isoWeekday(ymd));
}

// Los siete días de la semana, de lunes a domingo.
export function weekDays(ymd: string): string[] {
  const monday = startOfWeek(ymd);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

// Diferencia entre la hora de pared de la zona y UTC para un instante, en milisegundos.
function offsetMs(instant: Date, timeZone: string): number {
  const p = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(instant);
  const get = (type: string) => Number(p.find((part) => part.type === type)?.value);
  const wall = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour"),
    get("minute"),
    get("second"),
  );
  return wall - Math.floor(instant.getTime() / 1000) * 1000;
}

// Día y hora locales de la zona -> instante.
export function zonedToUtc(ymd: string, hm: string, timeZone: string = DEFAULT_TIMEZONE): Date {
  const { y, m, d } = parts(ymd);
  const [h, min] = hm.split(":").map(Number);
  const wall = Date.UTC(y, m - 1, d, h, min);
  // Se corrige dos veces por si el primer cálculo cae del otro lado de un cambio de horario.
  let utc = wall - offsetMs(new Date(wall), timeZone);
  utc = wall - offsetMs(new Date(utc), timeZone);
  return new Date(utc);
}

// Rango [desde, hasta) de una semana, para consultar la base.
export function weekRange(ymd: string, timeZone: string = DEFAULT_TIMEZONE) {
  const monday = startOfWeek(ymd);
  return {
    monday,
    from: zonedToUtc(monday, "00:00", timeZone),
    to: zonedToUtc(addDays(monday, 7), "00:00", timeZone),
  };
}

// Rango de una semana, de lunes a domingo: "2 al 8 de noviembre" o "26 de octubre al 1 de noviembre".
export function weekLabel(monday: string): string {
  const sunday = addDays(monday, 6);
  const last = dayLabel(sunday, { weekday: undefined });
  if (parts(monday).m === parts(sunday).m) return `${parts(monday).d} al ${last}`;
  return `${dayLabel(monday, { weekday: undefined })} al ${last}`;
}

// Cuándo es una clase, dicho para un mensaje: "hoy", "mañana" o "el lunes 2 de noviembre".
export function spokenDay(day: string, today: string): string {
  if (day === today) return "hoy";
  if (day === addDays(today, 1)) return "mañana";
  return `el ${dayLabel(day).replace(",", "")}`;
}

// Nombre del día de la semana ISO (1 lunes ... 7 domingo): "martes".
export function weekdayName(weekday: number): string {
  return dayLabel(addDays("2026-11-02", weekday - 1), { day: undefined, month: undefined });
}

// Etiqueta de un día suelto: "lunes 2 de noviembre".
export function dayLabel(ymd: string, options: Intl.DateTimeFormatOptions = {}): string {
  const { y, m, d } = parts(ymd);
  return new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    ...options,
    timeZone: "UTC",
  }).format(new Date(Date.UTC(y, m - 1, d)));
}
