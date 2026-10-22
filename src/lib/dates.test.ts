import { describe, expect, it } from "vitest";
import {
  addDays,
  daysBetween,
  monthOf,
  monthsBack,
  dayLabel,
  isHm,
  isYmd,
  isoWeekday,
  localDate,
  localTime,
  spokenDay,
  startOfWeek,
  weekDays,
  weekLabel,
  weekRange,
  weekdayName,
  zonedToUtc,
} from "./dates";

describe("isYmd / isHm", () => {
  it("valida días y horas", () => {
    expect(isYmd("2026-11-02")).toBe(true);
    expect(isYmd("2026-02-30")).toBe(false);
    expect(isYmd("02/11/2026")).toBe(false);
    expect(isHm("17:00")).toBe(true);
    expect(isHm("24:00")).toBe(false);
    expect(isHm("9:00")).toBe(false);
  });
});

describe("semana", () => {
  it("el lunes es el primer día", () => {
    expect(isoWeekday("2026-11-02")).toBe(1);
    expect(isoWeekday("2026-11-08")).toBe(7);
    expect(startOfWeek("2026-11-08")).toBe("2026-11-02");
    expect(startOfWeek("2026-11-02")).toBe("2026-11-02");
    expect(startOfWeek("2026-11-04")).toBe("2026-11-02");
  });

  it("suma días cruzando de mes y de año", () => {
    expect(addDays("2026-10-30", 3)).toBe("2026-11-02");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("arma los siete días de lunes a domingo", () => {
    const days = weekDays("2026-11-05");
    expect(days).toHaveLength(7);
    expect(days[0]).toBe("2026-11-02");
    expect(days[6]).toBe("2026-11-08");
  });
});

describe("zona horaria de Buenos Aires (UTC-3, sin horario de verano)", () => {
  const tz = "America/Argentina/Buenos_Aires";

  it("pasa día y hora locales a un instante", () => {
    expect(zonedToUtc("2026-11-02", "17:00", tz).toISOString()).toBe("2026-11-02T20:00:00.000Z");
    expect(zonedToUtc("2026-11-02", "00:00", tz).toISOString()).toBe("2026-11-02T03:00:00.000Z");
  });

  it("lee el día y la hora locales de un instante", () => {
    // 01:30 UTC del 3 de noviembre todavía es 22:30 del 2 en Buenos Aires.
    expect(localDate("2026-11-03T01:30:00Z", tz)).toBe("2026-11-02");
    expect(localTime("2026-11-03T01:30:00Z", tz)).toBe("22:30");
  });

  it("el rango de la semana va de lunes 00:00 a lunes 00:00 locales", () => {
    const range = weekRange("2026-11-04", tz);
    expect(range.monday).toBe("2026-11-02");
    expect(range.from.toISOString()).toBe("2026-11-02T03:00:00.000Z");
    expect(range.to.toISOString()).toBe("2026-11-09T03:00:00.000Z");
  });
});

describe("otras zonas", () => {
  it("respeta el horario de verano de una zona que lo tiene", () => {
    // Madrid: UTC+1 en invierno, UTC+2 en verano.
    expect(zonedToUtc("2026-01-15", "12:00", "Europe/Madrid").toISOString()).toBe(
      "2026-01-15T11:00:00.000Z",
    );
    expect(zonedToUtc("2026-07-15", "12:00", "Europe/Madrid").toISOString()).toBe(
      "2026-07-15T10:00:00.000Z",
    );
  });
});

describe("weekLabel", () => {
  it("resume la semana, con uno o dos meses", () => {
    expect(weekLabel("2026-11-02")).toBe("2 al 8 de noviembre");
    expect(weekLabel("2026-10-26")).toBe("26 de octubre al 1 de noviembre");
  });
});

describe("spokenDay", () => {
  it("dice hoy, mañana o la fecha", () => {
    expect(spokenDay("2026-11-02", "2026-11-02")).toBe("hoy");
    expect(spokenDay("2026-11-03", "2026-11-02")).toBe("mañana");
    expect(spokenDay("2026-11-05", "2026-11-02")).toBe("el jueves 5 de noviembre");
  });
});

describe("weekdayName", () => {
  it("nombra el día ISO", () => {
    expect(weekdayName(1)).toBe("lunes");
    expect(weekdayName(2)).toBe("martes");
    expect(weekdayName(7)).toBe("domingo");
  });
});

describe("dayLabel", () => {
  it("escribe el día en español", () => {
    expect(dayLabel("2026-11-02")).toBe("lunes, 2 de noviembre");
    expect(dayLabel("2026-11-02", { weekday: "short", day: "numeric", month: undefined })).toBe(
      "lun 2",
    );
  });
});

describe("daysBetween, monthOf y monthsBack", () => {
  it("cuenta días y meses", () => {
    expect(daysBetween("2026-10-17", "2026-10-22")).toBe(5);
    expect(daysBetween("2026-10-22", "2026-10-17")).toBe(-5);
    expect(daysBetween("2026-12-31", "2027-01-01")).toBe(1);
    expect(monthOf("2026-10-22")).toBe("2026-10");
    expect(monthsBack("2026-02-10", 4)).toEqual(["2025-11", "2025-12", "2026-01", "2026-02"]);
  });
});
