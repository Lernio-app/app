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
    `Te invito a Lernio para que veas tus clases, tus tareas y cómo pagar: ${link}`,
    "Entrás con tu email, sin contraseña. La invitación es solo tuya y vale 7 días.",
  ].join("\n");
}

// Pedido de consentimiento al responsable de pago de un menor (ADR-0009): lo da desde el link, sin cuenta.
export function consentMessage({
  payerName,
  studentName,
  teacherName,
  link,
}: {
  payerName: string;
  studentName: string;
  teacherName: string;
  link: string;
}) {
  return [
    `Hola ${firstName(payerName)}! Soy ${firstName(teacherName)}.`,
    `Para que ${firstName(studentName)} tenga su cuenta de Lernio (ahí ve sus clases y sus tareas) necesito tu consentimiento: ${link}`,
    "Lo das desde ese link, sin crear ninguna cuenta, y lo podés retirar cuando quieras. Vale 7 días.",
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

// Aviso de deuda: el monto y cómo pagar ya escritos. `forStudent` va cuando el mensaje es para el
// responsable de pago y no para el alumno. `amount` y `since` llegan ya formateados.
export function debtMessage({
  recipientName,
  forStudent,
  teacherName,
  amount,
  since,
  paymentAlias,
  paymentLink,
}: {
  recipientName: string;
  forStudent: string | null;
  teacherName: string;
  amount: string;
  since: string;
  paymentAlias: string | null;
  paymentLink: string | null;
}) {
  const lines = [
    `Hola ${firstName(recipientName)}! Soy ${firstName(teacherName)}.`,
    forStudent
      ? `Te escribo por las clases de ${firstName(forStudent)}: quedan ${amount} pendientes desde el ${since}.`
      : `Te escribo por las clases: quedan ${amount} pendientes desde el ${since}.`,
  ];
  if (paymentAlias) lines.push(`Podés transferir al alias ${paymentAlias}.`);
  if (paymentLink) lines.push(`O pagar acá: ${paymentLink}`);
  lines.push("Cuando lo hagas avisame así lo registro. ¡Gracias!");
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
