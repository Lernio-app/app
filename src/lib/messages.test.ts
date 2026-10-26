import { describe, expect, it } from "vitest";
import {
  consentMessage,
  debtMessage,
  lessonReminderMessage,
  normalizeArPhone,
  waLink,
  welcomeMessage,
} from "./messages";

describe("normalizeArPhone", () => {
  it("entiende celulares escritos de distintas formas", () => {
    expect(normalizeArPhone("11 5555 1234")).toBe("5491155551234");
    expect(normalizeArPhone("011 15 5555-1234")).toBe("5491155551234");
    expect(normalizeArPhone("+54 9 11 5555 1234")).toBe("5491155551234");
    expect(normalizeArPhone("54 11 5555 1234")).toBe("5491155551234");
    expect(normalizeArPhone("0351 15 555 1234")).toBe("5493515551234");
  });
  it("devuelve null si no se entiende", () => {
    expect(normalizeArPhone("")).toBeNull();
    expect(normalizeArPhone("1234")).toBeNull();
  });
});

describe("waLink", () => {
  it("arma el link al contacto con el texto codificado", () => {
    expect(waLink("11 5555 1234", "Hola ñandú")).toBe(
      "https://wa.me/5491155551234?text=Hola%20%C3%B1and%C3%BA",
    );
  });
  it("sin teléfono válido deja elegir el contacto", () => {
    expect(waLink(null, "Hola")).toBe("https://wa.me/?text=Hola");
    expect(waLink("abc", "Hola")).toBe("https://wa.me/?text=Hola");
  });
});

describe("welcomeMessage", () => {
  it("saluda con voseo e invita a activar la cuenta", () => {
    const text = welcomeMessage({
      studentName: "Lucía Pérez",
      teacherName: "Ana Gómez",
      link: "https://app.test/invitacion/abc",
    });
    expect(text).toContain("Hola Lucía!");
    expect(text).toContain("Soy Ana.");
    expect(text).toContain("https://app.test/invitacion/abc");
    expect(text).toContain("Entrás con tu email");
    expect(text).toContain("vale 7 días");
    expect(text).not.toContain("ninguna cuenta");
  });
});

describe("consentMessage", () => {
  it("le pide el consentimiento al responsable con voseo y trae el link", () => {
    const text = consentMessage({
      payerName: "Marta Pérez",
      studentName: "Teo Pérez",
      teacherName: "Ana Gómez",
      link: "https://app.test/consentimiento/abc",
    });
    expect(text).toContain("Hola Marta! Soy Ana.");
    expect(text).toContain("que Teo tenga su cuenta");
    expect(text).toContain("https://app.test/consentimiento/abc");
    expect(text).toContain("lo podés retirar");
    expect(text).toContain("Vale 7 días");
  });
});

describe("lessonReminderMessage", () => {
  const base = {
    studentName: "Lucía Pérez",
    teacherName: "Ana Gómez",
    when: "mañana",
    time: "17:00",
    meetingUrl: null,
    lateCancelHours: 24,
  };

  it("recuerda el día y la hora con voseo", () => {
    const text = lessonReminderMessage(base);
    expect(text).toContain("Hola Lucía! Soy Ana.");
    expect(text).toContain("mañana tenemos clase a las 17:00");
    expect(text).toContain("avisame con al menos 24 horas");
    expect(text).not.toContain("Es por acá");
  });

  it("suma el link de la clase si lo hay", () => {
    const text = lessonReminderMessage({ ...base, meetingUrl: "https://meet.test/abc" });
    expect(text).toContain("Es por acá: https://meet.test/abc");
  });

  it("sin regla de cancelación no pide aviso", () => {
    expect(lessonReminderMessage({ ...base, lateCancelHours: 0 })).not.toContain("avisame");
  });
});

describe("debtMessage", () => {
  const base = {
    recipientName: "Marta Pérez",
    forStudent: "Lucía Pérez",
    teacherName: "Ana Gómez",
    amount: "$ 36.000",
    since: "3 de septiembre",
    paymentAlias: "ana.profe",
    paymentLink: null as string | null,
  };

  it("trae el monto, desde cuándo y el alias ya escritos", () => {
    const text = debtMessage(base);
    expect(text).toContain("Hola Marta! Soy Ana.");
    expect(text).toContain("las clases de Lucía");
    expect(text).toContain("$ 36.000 pendientes desde el 3 de septiembre");
    expect(text).toContain("alias ana.profe");
    expect(text).not.toContain("pagar acá");
  });

  it("suma el link de pago si lo hay", () => {
    expect(debtMessage({ ...base, paymentLink: "https://mpago.test/ana" })).toContain(
      "O pagar acá: https://mpago.test/ana",
    );
  });

  it("si escribe al alumno no aclara de quién son las clases", () => {
    const text = debtMessage({ ...base, forStudent: null, recipientName: "Lucía Pérez" });
    expect(text).toContain("Hola Lucía!");
    expect(text).toContain("Te escribo por las clases: quedan");
  });
});
