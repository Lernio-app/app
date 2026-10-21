import { describe, expect, it } from "vitest";
import { normalizeArPhone, waLink, welcomeMessage } from "./messages";

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
  it("saluda con voseo y trae el link", () => {
    const text = welcomeMessage({
      studentName: "Lucía Pérez",
      teacherName: "Ana Gómez",
      link: "https://app.test/a/abc",
    });
    expect(text).toContain("Hola Lucía!");
    expect(text).toContain("Soy Ana.");
    expect(text).toContain("https://app.test/a/abc");
    expect(text).toContain("Guardalo");
  });
});
