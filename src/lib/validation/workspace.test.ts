import { describe, expect, it } from "vitest";
import { parseWorkspaceForm, splitList } from "./workspace";

function form(entries: Record<string, string | string[]>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    for (const v of Array.isArray(value) ? value : [value]) data.append(key, v);
  }
  return data;
}

describe("splitList", () => {
  it("separa por coma, recorta y saca repetidos", () => {
    expect(splitList("Matemática, Física ; Matemática,,")).toEqual(["Matemática", "Física"]);
  });
});

describe("parseWorkspaceForm", () => {
  it("junta casillas y materias escritas a mano", () => {
    const result = parseWorkspaceForm(
      form({ displayName: " Ana ", subjects: ["Música"], subjectsOther: "Canto", levels: [] }),
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.displayName).toBe("Ana");
      expect(result.data.subjects).toEqual(["Música", "Canto"]);
      expect(result.data.lateCancelHours).toBe(24);
      expect(result.data.paymentAlias).toBeNull();
    }
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
