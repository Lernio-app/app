// Mensajes listos para WhatsApp. El profe los manda con un toque desde su teléfono (links wa.me).

import { normalizeArPhone } from "@/lib/phone";

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

// Aviso de que el profe movió una clase (F2-4). `from` y `to` son "mañana" o "el lunes 2 de noviembre"
// más la hora, ya dichos para un mensaje.
export function lessonMovedMessage({
  studentName,
  teacherName,
  from,
  to,
  meetingUrl,
}: {
  studentName: string;
  teacherName: string;
  from: { when: string; time: string };
  to: { when: string; time: string };
  meetingUrl: string | null;
}) {
  const lines = [
    `Hola ${firstName(studentName)}! Soy ${firstName(teacherName)}.`,
    `Tuve que mover nuestra clase: era ${from.when} a las ${from.time} y pasa a ser ${to.when} a las ${to.time}.`,
  ];
  if (meetingUrl) lines.push(`Es por acá: ${meetingUrl}`);
  lines.push("Avisame si te sirve. ¡Gracias!");
  return lines.join("\n");
}

// Aviso de que el profe canceló una clase (F2-4). `when` es "mañana" o "el lunes 2 de noviembre".
export function lessonCancelledMessage({
  studentName,
  teacherName,
  when,
  time,
  reason,
}: {
  studentName: string;
  teacherName: string;
  when: string;
  time: string;
  reason: string | null;
}) {
  const lines = [
    `Hola ${firstName(studentName)}! Soy ${firstName(teacherName)}.`,
    `Tuve que cancelar la clase que teníamos ${when} a las ${time}.`,
  ];
  if (reason) lines.push(`Motivo: ${reason}`);
  lines.push("Después coordinamos otro día. ¡Perdoná las molestias!");
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

// Link de WhatsApp con el texto escrito. Sin teléfono válido abre WhatsApp para elegir el contacto.
export function waLink(phone: string | null | undefined, text: string) {
  const normalized = phone ? normalizeArPhone(phone) : null;
  const query = `text=${encodeURIComponent(text)}`;
  return normalized ? `https://wa.me/${normalized}?${query}` : `https://wa.me/?${query}`;
}
