import { describe, expect, it } from "vitest";
import { parseChargeForm, parseIncreaseForm, parseMarkPaidForm, parsePaymentForm } from "./billing";

const STUDENT = "5b1c8c3e-6a63-4c0e-9c0b-0f6f0e0b1a11";
const CHARGE = "9a2d7e41-1b8f-4f6b-8d55-2c1f3a7e9b22";

function form(entries: Record<string, string | string[]>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    for (const item of Array.isArray(value) ? value : [value]) data.append(key, item);
  }
  return data;
}

describe("parsePaymentForm", () => {
  const base = { studentId: STUDENT, amount: "18.000", method: "transfer", paidOn: "2026-10-22" };

  it("pasa el monto a centavos", () => {
    const result = parsePaymentForm(form(base));
    expect(result.success && result.data.amount).toBe(1800000);
    expect(result.success && result.data.reference).toBeNull();
  });

  it("revisa monto, medio, fecha y alumno", () => {
    expect(parsePaymentForm(form({ ...base, amount: "" })).success).toBe(false);
    expect(parsePaymentForm(form({ ...base, amount: "0" })).success).toBe(false);
    expect(parsePaymentForm(form({ ...base, amount: "mucho" })).success).toBe(false);
    expect(parsePaymentForm(form({ ...base, amount: "30.000.000" })).success).toBe(false);
    expect(parsePaymentForm(form({ ...base, method: "bitcoin" })).success).toBe(false);
    expect(parsePaymentForm(form({ ...base, paidOn: "ayer" })).success).toBe(false);
    expect(parsePaymentForm(form({ ...base, studentId: "" })).success).toBe(false);
  });
});

describe("parseChargeForm", () => {
  it("acepta un cargo con vencimiento y descripción opcional", () => {
    const result = parseChargeForm(
      form({
        studentId: STUDENT,
        amount: "1.500,50",
        dueOn: "2026-12-01",
        description: " Material ",
      }),
    );
    expect(result.success && result.data.amount).toBe(150050);
    expect(result.success && result.data.description).toBe("Material");
  });

  it("pide el vencimiento", () => {
    expect(parseChargeForm(form({ studentId: STUDENT, amount: "1000", dueOn: "" })).success).toBe(
      false,
    );
  });
});

describe("parseMarkPaidForm", () => {
  it("pide cargo, medio y fecha", () => {
    expect(
      parseMarkPaidForm(form({ chargeId: CHARGE, method: "cash", paidOn: "2026-10-22" })).success,
    ).toBe(true);
    expect(
      parseMarkPaidForm(form({ chargeId: CHARGE, method: "", paidOn: "2026-10-22" })).success,
    ).toBe(false);
  });
});

describe("parseIncreaseForm", () => {
  it("acepta porcentaje con coma y alumnos elegidos", () => {
    const result = parseIncreaseForm(form({ percent: "7,5", studentIds: [STUDENT] }));
    expect(result.success && result.data.percent).toBe(7.5);
  });

  it("revisa el porcentaje y que haya alumnos", () => {
    expect(parseIncreaseForm(form({ percent: "0", studentIds: [STUDENT] })).success).toBe(false);
    expect(parseIncreaseForm(form({ percent: "500", studentIds: [STUDENT] })).success).toBe(false);
    expect(parseIncreaseForm(form({ percent: "abc", studentIds: [STUDENT] })).success).toBe(false);
    expect(parseIncreaseForm(form({ percent: "10", studentIds: [] })).success).toBe(false);
  });
});
