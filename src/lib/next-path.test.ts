import { describe, expect, it } from "vitest";
import { safeNext } from "./next-path";

describe("safeNext", () => {
  it("acepta rutas internas, con su búsqueda", () => {
    expect(safeNext("/invitacion/abc")).toBe("/invitacion/abc");
    expect(safeNext("/clases?area=musica")).toBe("/clases?area=musica");
  });
  it("rechaza lo que sale del sitio", () => {
    expect(safeNext("https://otro.test")).toBe("/app");
    expect(safeNext("//otro.test")).toBe("/app");
    expect(safeNext("/\\otro.test")).toBe("/app");
  });
  it("sin valor usa la ruta de reserva", () => {
    expect(safeNext(null)).toBe("/app");
    expect(safeNext("", "/portal")).toBe("/portal");
  });
});
