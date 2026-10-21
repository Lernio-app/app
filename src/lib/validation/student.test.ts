import { describe, expect, it } from "vitest";
import { formatARS } from "@/lib/format";
import { parseStudentForm, priceSummary } from "./student";

function form(entries: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) data.append(key, value);
  return data;
}

const base = { fullName: "Lucía Pérez", mode: "per_lesson", amount: "18.000" };

describe("parseStudentForm", () => {
  it("acepta un alumno mínimo con precio por clase", () => {
    const result = parseStudentForm(form(base));
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.mode).toBe("per_lesson");
      expect(result.data.amount).toBe(1800000);
      expect(result.data.phone).toBeNull();
      expect(result.data.lessonsPerPackage).toBeNull();
    }
  });

  it("el precio es opcional: sin precio no hace falta monto", () => {
    const sinModo = parseStudentForm(form({ fullName: "Lucía Pérez" }));
    expect(sinModo.success && sinModo.data.mode).toBeNull();

    const explicito = parseStudentForm(form({ fullName: "Lucía Pérez", mode: "none" }));
    expect(explicito.success).toBe(true);
    if (explicito.success) {
      expect(explicito.data.mode).toBeNull();
      expect(explicito.data.amount).toBeNull();
    }
  });

  it("sin precio se ignora un monto que haya quedado escrito", () => {
    const result = parseStudentForm(
      form({ fullName: "Lucía", mode: "none", amount: "mucho", lessonsPerPackage: "4" }),
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.amount).toBeNull();
      expect(result.data.lessonsPerPackage).toBeNull();
    }
  });

  it("pide el nombre y, si hay precio, un monto válido", () => {
    expect(parseStudentForm(form({ ...base, fullName: " " })).success).toBe(false);
    expect(parseStudentForm(form({ ...base, amount: "mucho" })).success).toBe(false);
    expect(parseStudentForm(form({ ...base, amount: "" })).success).toBe(false);
  });

  it("el paquete necesita cantidad de clases", () => {
    expect(parseStudentForm(form({ ...base, mode: "package" })).success).toBe(false);
    const ok = parseStudentForm(form({ ...base, mode: "package", lessonsPerPackage: "4" }));
    expect(ok.success && ok.data.lessonsPerPackage).toBe(4);
  });

  it("el precio mensual necesita un día entre 1 y 28", () => {
    expect(parseStudentForm(form({ ...base, mode: "monthly", billingDay: "31" })).success).toBe(
      false,
    );
    const ok = parseStudentForm(form({ ...base, mode: "monthly", billingDay: "5" }));
    expect(ok.success && ok.data.billingDay).toBe(5);
  });

  it("ignora la cantidad de clases si el precio no es por paquete", () => {
    const ok = parseStudentForm(form({ ...base, lessonsPerPackage: "4", billingDay: "5" }));
    expect(ok.success && ok.data.lessonsPerPackage).toBeNull();
    expect(ok.success && ok.data.billingDay).toBeNull();
  });

  it("revisa el email del alumno y del responsable", () => {
    expect(parseStudentForm(form({ ...base, email: "no-es-un-mail" })).success).toBe(false);
    expect(parseStudentForm(form({ ...base, payerEmail: "no-es-un-mail" })).success).toBe(false);
  });
});

describe("priceSummary", () => {
  it("resume cada modalidad de cobro", () => {
    const f = formatARS;
    expect(
      priceSummary(
        { mode: "per_lesson", amount: 1800000, lessons_per_package: null, billing_day: null },
        f,
      ),
    ).toBe("$ 18.000 por clase");
    expect(
      priceSummary(
        { mode: "package", amount: 6400000, lessons_per_package: 4, billing_day: null },
        f,
      ),
    ).toBe("$ 64.000 por paquete de 4 clases");
    expect(
      priceSummary(
        { mode: "monthly", amount: 5000000, lessons_per_package: null, billing_day: 5 },
        f,
      ),
    ).toBe("$ 50.000 por mes, el día 5");
  });

  it("sin precio vigente dice 'Sin precio'", () => {
    expect(priceSummary(null, formatARS)).toBe("Sin precio");
  });
});
