import { describe, expect, it } from "vitest";
import { formatARS, formatDate, formatTime, parseARSToCentavos } from "./format";

describe("formatARS", () => {
  it("formatea con separador de miles argentino", () => {
    expect(formatARS(128450000)).toBe("$ 1.284.500");
    expect(formatARS(1800000)).toBe("$ 18.000");
  });
  it("muestra centavos solo si hay", () => {
    expect(formatARS(150050)).toBe("$ 1.500,50");
    expect(formatARS(0)).toBe("$ 0");
  });
  it("marca los negativos", () => {
    expect(formatARS(-500000)).toBe("-$ 5.000");
  });
});

describe("parseARSToCentavos", () => {
  it("entiende pesos escritos a la argentina", () => {
    expect(parseARSToCentavos("$ 18.000")).toBe(1800000);
    expect(parseARSToCentavos("1.500,5")).toBe(150050);
    expect(parseARSToCentavos("2500")).toBe(250000);
  });
  it("rechaza lo que no es un monto", () => {
    expect(parseARSToCentavos("abc")).toBeNull();
    expect(parseARSToCentavos("")).toBeNull();
  });
});

describe("fechas en Buenos Aires", () => {
  it("usa la hora de Buenos Aires (UTC-3), en 24 h", () => {
    expect(formatTime("2026-10-21T21:30:00Z")).toBe("18:30");
  });
  it("usa el día de Buenos Aires", () => {
    expect(formatDate("2026-10-22T01:00:00Z", { day: "numeric" })).toBe("21");
  });
});
