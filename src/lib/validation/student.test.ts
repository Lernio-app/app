import { describe, expect, it } from "vitest";
import { formatARS } from "@/lib/format";
import { parseStudentForm, priceSummary } from "./student";

function form(entries: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) data.append(key, value);
  return data;
}

const INGLES = "11111111-1111-4111-8111-111111111111";
const IDIOMAS = "33333333-3333-4333-8333-333333333333";
const B2 = "44444444-4444-4444-8444-444444444444";

// «Otra» con su nombre: la forma más corta de pasar la validación de la materia.
const otra = { subjectChoice: "other", subject: "Ajedrez" };
const base = { fullName: "Lucía Pérez", ...otra, mode: "per_lesson", amount: "18.000" };

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
    const sinModo = parseStudentForm(form({ fullName: "Lucía Pérez", ...otra }));
    expect(sinModo.success && sinModo.data.mode).toBeNull();

    const explicito = parseStudentForm(form({ fullName: "Lucía Pérez", ...otra, mode: "none" }));
    expect(explicito.success).toBe(true);
    if (explicito.success) {
      expect(explicito.data.mode).toBeNull();
      expect(explicito.data.amount).toBeNull();
    }
  });

  it("sin precio se ignora un monto que haya quedado escrito", () => {
    const result = parseStudentForm(
      form({ fullName: "Lucía", ...otra, mode: "none", amount: "mucho", lessonsPerPackage: "4" }),
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

describe("parseStudentForm: materia", () => {
  const lista = { fullName: "Lucía", mode: "none", subjectChoice: INGLES, areaId: IDIOMAS };

  it("acepta una materia de la lista con su área, un detalle y un nivel", () => {
    const result = parseStudentForm(form({ ...lista, subject: " First ", levelId: B2 }));
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.subjectId).toBe(INGLES);
      expect(result.data.areaId).toBe(IDIOMAS);
      expect(result.data.subject).toBe("First");
      expect(result.data.levelId).toBe(B2);
    }
  });

  it("el nivel y el detalle son opcionales", () => {
    const result = parseStudentForm(form(lista));
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.subject).toBeNull();
      expect(result.data.levelId).toBeNull();
    }
  });

  it("pide la materia", () => {
    const result = parseStudentForm(form({ fullName: "Lucía", mode: "none" }));
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0].path[0]).toBe("subjectChoice");
  });

  it("una materia de la lista pide el área", () => {
    const result = parseStudentForm(form({ ...lista, areaId: "" }));
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0].path[0]).toBe("areaId");
  });

  it("«Otra» pide el nombre de la materia y no lleva área ni nivel", () => {
    expect(
      parseStudentForm(form({ fullName: "Lucía", mode: "none", subjectChoice: "other" })).success,
    ).toBe(false);

    const result = parseStudentForm(
      form({ ...lista, subjectChoice: "other", subject: "Ajedrez", levelId: B2 }),
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.subjectId).toBeNull();
      expect(result.data.areaId).toBeNull();
      expect(result.data.levelId).toBeNull();
      expect(result.data.subject).toBe("Ajedrez");
    }
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
