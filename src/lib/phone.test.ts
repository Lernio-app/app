import { describe, expect, it } from "vitest";
import { formatArPhone, normalizeArPhone } from "./phone";

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
    expect(normalizeArPhone("abc")).toBeNull();
    expect(normalizeArPhone("1234")).toBeNull();
    expect(normalizeArPhone("11 5555 123")).toBeNull();
  });
  it("normalizar dos veces da lo mismo", () => {
    const once = normalizeArPhone("011 15 5555-1234");
    expect(once && normalizeArPhone(once)).toBe(once);
  });
});

describe("formatArPhone", () => {
  it("muestra el teléfono guardado en grupos", () => {
    expect(formatArPhone("5491155551234")).toBe("11 5555 1234");
    expect(formatArPhone("5493515551234")).toBe("351 555 1234");
  });
  it("deja tal cual lo que no tiene el formato guardado", () => {
    expect(formatArPhone("155551234")).toBe("155551234");
    expect(formatArPhone(null)).toBe("");
  });
});
