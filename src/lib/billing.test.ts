import { describe, expect, it } from "vitest";
import {
  chargeLabel,
  chargeState,
  collected,
  credit,
  debtRecipient,
  debtors,
  dueLabel,
  increasedAmount,
  totals,
  type ChargeRow,
  type PaymentRow,
} from "./billing";

const TODAY = "2026-10-22";

function charge(overrides: Partial<ChargeRow> = {}): ChargeRow {
  return {
    id: "c",
    student_id: "s1",
    source: "manual",
    lesson_id: null,
    period: null,
    description: null,
    amount: 1000000,
    paid: 0,
    remaining: 1000000,
    due_on: "2026-10-01",
    ...overrides,
  };
}

function payment(overrides: Partial<PaymentRow> = {}): PaymentRow {
  return {
    id: "p",
    student_id: "s1",
    amount: 500000,
    method: "cash",
    paid_on: "2026-10-05",
    reference: null,
    unallocated: 0,
    voided_at: null,
    ...overrides,
  };
}

describe("chargeState", () => {
  it("pasa a vencido cuando la fecha se cumple", () => {
    expect(chargeState(charge({ remaining: 0 }), TODAY)).toBe("paid");
    expect(chargeState(charge({ due_on: "2026-10-21" }), TODAY)).toBe("overdue");
    expect(chargeState(charge({ due_on: TODAY }), TODAY)).toBe("due");
    expect(chargeState(charge({ due_on: "2026-10-23" }), TODAY)).toBe("upcoming");
  });
});

describe("chargeLabel y dueLabel", () => {
  it("nombra cada tipo de cargo", () => {
    expect(chargeLabel(charge({ source: "lesson", due_on: "2026-09-03" }))).toBe(
      "Clase del 3 de septiembre",
    );
    expect(chargeLabel(charge({ source: "monthly", period: "2026-10" }))).toBe(
      "Mensualidad de octubre",
    );
    expect(chargeLabel(charge({ source: "package", description: "Paquete de 4 clases" }))).toBe(
      "Paquete de 4 clases",
    );
    expect(chargeLabel(charge({ description: "Material" }))).toBe("Material");
    expect(chargeLabel(charge())).toBe("Cargo");
  });

  it("dice cuándo vence", () => {
    expect(dueLabel("2026-10-17", TODAY)).toBe("vencido hace 5 días");
    expect(dueLabel("2026-10-21", TODAY)).toBe("vencido ayer");
    expect(dueLabel(TODAY, TODAY)).toBe("vence hoy");
    expect(dueLabel("2026-11-12", TODAY)).toBe("vence el 12 de noviembre");
  });
});

describe("totals", () => {
  it("separa lo exigible, lo vencido y lo que viene", () => {
    const result = totals(
      [
        charge({ remaining: 100, due_on: "2026-10-01" }),
        charge({ remaining: 200, due_on: TODAY }),
        charge({ remaining: 400, due_on: "2026-11-01" }),
        charge({ remaining: 0, due_on: "2026-09-01" }),
      ],
      TODAY,
    );
    expect(result).toEqual({ pending: 700, owed: 300, overdue: 100, upcoming: 400 });
  });
});

describe("debtors", () => {
  it("lista a quien debe, desde cuándo, y no cuenta lo que vence después", () => {
    const list = debtors(
      [
        charge({ id: "a", student_id: "s1", remaining: 300, due_on: "2026-10-10" }),
        charge({ id: "b", student_id: "s1", remaining: 200, due_on: "2026-09-20" }),
        charge({ id: "c", student_id: "s2", remaining: 900, due_on: "2026-10-15" }),
        charge({ id: "d", student_id: "s3", remaining: 500, due_on: "2026-12-01" }),
        charge({ id: "e", student_id: "s4", remaining: 0, due_on: "2026-09-01" }),
      ],
      TODAY,
    );
    expect(list.map((d) => d.studentId)).toEqual(["s1", "s2"]);
    expect(list[0]).toMatchObject({ owed: 500, since: "2026-09-20" });
    expect(list[0].charges.map((c) => c.id)).toEqual(["b", "a"]);
    expect(list[1]).toMatchObject({ owed: 900, since: "2026-10-15" });
  });
});

describe("collected", () => {
  it("suma lo cobrado por mes y por alumno, sin los pagos anulados", () => {
    const result = collected(
      [
        payment({ amount: 1000, paid_on: "2026-10-05" }),
        payment({ amount: 2000, paid_on: "2026-10-20", student_id: "s2" }),
        payment({ amount: 4000, paid_on: "2026-09-10" }),
        payment({ amount: 9999, paid_on: "2026-10-01", voided_at: "2026-10-02T00:00:00Z" }),
      ],
      TODAY,
      3,
    );
    expect(result.total).toBe(7000);
    expect(result.thisMonth).toBe(3000);
    expect(result.byMonth).toEqual([
      { month: "2026-08", amount: 0 },
      { month: "2026-09", amount: 4000 },
      { month: "2026-10", amount: 3000 },
    ]);
    expect(result.byStudent).toEqual([
      { studentId: "s1", amount: 5000 },
      { studentId: "s2", amount: 2000 },
    ]);
  });

  it("sin pagos todo es cero", () => {
    const result = collected([], TODAY);
    expect(result.total).toBe(0);
    expect(result.byMonth).toHaveLength(6);
  });
});

describe("credit", () => {
  it("suma los pagos sin cargo y deja afuera los anulados", () => {
    expect(
      credit([
        payment({ unallocated: 300 }),
        payment({ unallocated: 200 }),
        payment({ unallocated: 999, voided_at: "2026-10-02T00:00:00Z" }),
      ]),
    ).toBe(500);
  });
});

describe("increasedAmount", () => {
  it("aplica el porcentaje y redondea a $ 50", () => {
    expect(increasedAmount(1800000, 10)).toBe(1980000); // $ 18.000 -> $ 19.800
    expect(increasedAmount(750000, 10)).toBe(825000); // $ 7.500 -> $ 8.250
    expect(increasedAmount(1000000, 15)).toBe(1150000);
    expect(increasedAmount(1234500, 10)).toBe(1360000); // 13.579,5 -> $ 13.600
  });

  it("un aumento nunca baja el precio", () => {
    expect(increasedAmount(1000, 1)).toBe(1000);
  });
});

describe("debtRecipient", () => {
  it("escribe al responsable de pago si tiene teléfono", () => {
    const result = debtRecipient({
      full_name: "Lucía Pérez",
      phone: "1155551234",
      student_contacts: [{ name: "Marta Pérez", phone: "1155550000", is_payer: true }],
    });
    expect(result).toEqual({ name: "Marta Pérez", phone: "1155550000", forStudent: "Lucía Pérez" });
  });

  it("si no, escribe al alumno", () => {
    const result = debtRecipient({
      full_name: "Lucía Pérez",
      phone: "1155551234",
      student_contacts: [{ name: "Marta Pérez", phone: null, is_payer: true }],
    });
    expect(result).toEqual({ name: "Lucía Pérez", phone: "1155551234", forStudent: null });
  });
});
