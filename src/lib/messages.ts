// Mensajes listos para WhatsApp. El profe los manda con un toque desde su teléfono (links wa.me).

export function firstName(fullName: string) {
  return fullName.trim().split(/\s+/)[0] ?? "";
}

export function welcomeMessage({
  studentName,
  teacherName,
  link,
}: {
  studentName: string;
  teacherName: string;
  link: string;
}) {
  return [
    `Hola ${firstName(studentName)}! Soy ${firstName(teacherName)}.`,
    `Este es tu link personal para ver tus clases y cómo pagar: ${link}`,
    "Guardalo, es solo tuyo y no necesitás crear ninguna cuenta.",
  ].join("\n");
}

// Recordatorio de una clase. `when` es "hoy", "mañana" o "el lunes 2 de noviembre".
export function lessonReminderMessage({
  studentName,
  teacherName,
  when,
  time,
  meetingUrl,
  lateCancelHours,
}: {
  studentName: string;
  teacherName: string;
  when: string;
  time: string;
  meetingUrl: string | null;
  lateCancelHours: number;
}) {
  const lines = [
    `Hola ${firstName(studentName)}! Soy ${firstName(teacherName)}.`,
    `Te recuerdo que ${when} tenemos clase a las ${time}.`,
  ];
  if (meetingUrl) lines.push(`Es por acá: ${meetingUrl}`);
  if (lateCancelHours > 0) {
    lines.push(`Si no podés, avisame con al menos ${lateCancelHours} horas de anticipación.`);
  }
  return lines.join("\n");
}

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

// Link de WhatsApp con el texto escrito. Sin teléfono válido abre WhatsApp para elegir el contacto.
export function waLink(phone: string | null | undefined, text: string) {
  const normalized = phone ? normalizeArPhone(phone) : null;
  const query = `text=${encodeURIComponent(text)}`;
  return normalized ? `https://wa.me/${normalized}?${query}` : `https://wa.me/?${query}`;
}
