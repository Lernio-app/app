import { describe, expect, it } from "vitest";
import { parseAccountForm } from "./account";

function form(entries: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) data.append(key, value);
  return data;
}

describe("parseAccountForm", () => {
  it("confirma el nombre y guarda el teléfono normalizado", () => {
    const result = parseAccountForm(form({ fullName: "  Ana Pérez ", phone: "011 15 5555-1234" }));
    expect(result).toEqual({
      success: true,
      data: { fullName: "Ana Pérez", phone: "5491155551234" },
    });
  });

  it("el teléfono es opcional: sin él la cuenta se activa igual", () => {
    const result = parseAccountForm(form({ fullName: "Ana", phone: "  " }));
    expect(result).toEqual({ success: true, data: { fullName: "Ana", phone: null } });
  });

  it("pide el nombre", () => {
    const result = parseAccountForm(form({ fullName: " ", phone: "" }));
    expect(result.success).toBe(false);
    if (!result.success) expect(result.fieldErrors.fullName).toBe("Poné tu nombre.");
  });

  it("un teléfono que no se entiende marca el campo", () => {
    const result = parseAccountForm(form({ fullName: "Ana", phone: "1234" }));
    expect(result.success).toBe(false);
    if (!result.success) expect(result.fieldErrors.phone).toMatch(/No entendimos el teléfono/);
  });

  it("marca los dos campos juntos", () => {
    const result = parseAccountForm(form({ fullName: "", phone: "abc" }));
    expect(result.success).toBe(false);
    if (!result.success) expect(Object.keys(result.fieldErrors)).toEqual(["fullName", "phone"]);
  });
});
