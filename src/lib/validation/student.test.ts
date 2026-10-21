import { describe, expect, it } from "vitest";
import { formatARS } from "@/lib/format";
import { parseStudentForm, planSummary } from "./student";

function form(entries: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) data.append(key, value);
  return data;
}

const base = { fullName: "Lucía Pérez", mode: "per_lesson", amount: "18.000" };

describe("parseStudentForm", () => {
  it("acepta un alumno mínimo con plan por clase", () => {
    const result = parseStudentForm(form(base));
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.amount).toBe(1800000);
      expect(result.data.phone).toBeNull();
      expect(result.data.lessonsPerPackage).toBeNull();
    }
  });

  it("pide el nombre y un monto válido", () => {
    expect(parseStudentForm(form({ ...base, fullName: " " })).success).toBe(false);
    expect(parseStudentForm(form({ ...base, amount: "mucho" })).success).toBe(false);
  });

  it("el paquete necesita cantidad de clases", () => {
    expect(parseStudentForm(form({ ...base, mode: "package" })).success).toBe(false);
    const ok = parseStudentForm(form({ ...base, mode: "package", lessonsPerPackage: "4" }));
    expect(ok.success && ok.data.lessonsPerPackage).toBe(4);
  });

  it("el plan mensual necesita un día entre 1 y 28", () => {
    expect(parseStudentForm(form({ ...base, mode: "monthly", billingDay: "31" })).success).toBe(
      false,
    );
    const ok = parseStudentForm(form({ ...base, mode: "monthly", billingDay: "5" }));
    expect(ok.success && ok.data.billingDay).toBe(5);
  });

  it("ignora la cantidad de clases si el plan no es de paquete", () => {
    const ok = parseStudentForm(form({ ...base, lessonsPerPackage: "4", billingDay: "5" }));
    expect(ok.success && ok.data.lessonsPerPackage).toBeNull();
    expect(ok.success && ok.data.billingDay).toBeNull();
  });

  it("revisa el email del alumno y del responsable", () => {
    expect(parseStudentForm(form({ ...base, email: "no-es-un-mail" })).success).toBe(false);
    expect(parseStudentForm(form({ ...base, payerEmail: "no-es-un-mail" })).success).toBe(false);
  });
});

describe("planSummary", () => {
  it("resume cada modo de cobro", () => {
    const f = formatARS;
    expect(
      planSummary(
        { mode: "per_lesson", amount: 1800000, lessons_per_package: null, billing_day: null },
        f,
      ),
    ).toBe("$ 18.000 por clase");
    expect(
      planSummary(
        { mode: "package", amount: 6400000, lessons_per_package: 4, billing_day: null },
        f,
      ),
    ).toBe("$ 64.000 por paquete de 4 clases");
    expect(
      planSummary(
        { mode: "monthly", amount: 5000000, lessons_per_package: null, billing_day: 5 },
        f,
      ),
    ).toBe("$ 50.000 por mes, el día 5");
  });
});
