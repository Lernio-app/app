import { describe, expect, it } from "vitest";
import { parseWorkspaceForm } from "./workspace";

const INGLES = "11111111-1111-4111-8111-111111111111";
const PIANO = "22222222-2222-4222-8222-222222222222";

function form(entries: Record<string, string | string[]>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    for (const v of Array.isArray(value) ? value : [value]) data.append(key, v);
  }
  return data;
}

describe("parseWorkspaceForm", () => {
  it("toma las materias marcadas, sin repetir", () => {
    const result = parseWorkspaceForm(
      form({ displayName: " Ana ", subjects: [INGLES, PIANO, INGLES] }),
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.displayName).toBe("Ana");
      expect(result.data.subjectIds).toEqual([INGLES, PIANO]);
      expect(result.data.lateCancelHours).toBe(24);
      expect(result.data.paymentAlias).toBeNull();
    }
  });

  it("las materias son opcionales", () => {
    const result = parseWorkspaceForm(form({ displayName: "Ana" }));
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.subjectIds).toEqual([]);
  });

  it("rechaza una materia que no es un id", () => {
    expect(parseWorkspaceForm(form({ displayName: "Ana", subjects: ["Inglés"] })).success).toBe(
      false,
    );
  });

  it("pide el nombre", () => {
    const result = parseWorkspaceForm(form({ displayName: "  " }));
    expect(result.success).toBe(false);
  });

  it("rechaza un link de pago sin https", () => {
    const result = parseWorkspaceForm(
      form({ displayName: "Ana", paymentLink: "mercadopago.com/ana" }),
    );
    expect(result.success).toBe(false);
  });

  it("acota las horas de cancelación", () => {
    expect(parseWorkspaceForm(form({ displayName: "Ana", lateCancelHours: "-1" })).success).toBe(
      false,
    );
    expect(parseWorkspaceForm(form({ displayName: "Ana", lateCancelHours: "12" })).success).toBe(
      true,
    );
  });
});
