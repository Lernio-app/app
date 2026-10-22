import { describe, expect, it } from "vitest";
import { parseCancelForm, parseLessonForm, parseMoveForm, parseNotesForm } from "./lesson";

const STUDENT = "5b1c8c3e-6a63-4c0e-9c0b-0f6f0e0b1a11";

function form(entries: Record<string, string | string[]>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    for (const item of Array.isArray(value) ? value : [value]) data.append(key, item);
  }
  return data;
}

const base = { date: "2026-11-02", start: "17:00", durationMin: "60", studentIds: [STUDENT] };

describe("parseLessonForm", () => {
  it("acepta una clase mínima", () => {
    const result = parseLessonForm(form(base));
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.durationMin).toBe(60);
      expect(result.data.meetingUrl).toBeNull();
      expect(result.data.repeat).toBe(false);
      expect(result.data.endsOn).toBeNull();
    }
  });

  it("pide al menos un alumno, el día y la hora", () => {
    expect(parseLessonForm(form({ ...base, studentIds: [] })).success).toBe(false);
    expect(parseLessonForm(form({ ...base, date: "" })).success).toBe(false);
    expect(parseLessonForm(form({ ...base, start: "25:00" })).success).toBe(false);
  });

  it("acepta varios alumnos para una clase grupal", () => {
    const other = "9a2d7e41-1b8f-4f6b-8d55-2c1f3a7e9b22";
    const result = parseLessonForm(form({ ...base, studentIds: [STUDENT, other] }));
    expect(result.success && result.data.studentIds).toHaveLength(2);
  });

  it("revisa la duración", () => {
    expect(parseLessonForm(form({ ...base, durationMin: "0" })).success).toBe(false);
    expect(parseLessonForm(form({ ...base, durationMin: "600" })).success).toBe(false);
    expect(parseLessonForm(form({ ...base, durationMin: "abc" })).success).toBe(false);
    expect(parseLessonForm(form({ ...base, durationMin: "45" })).success).toBe(true);
  });

  it("el link de la clase tiene que ser http o https", () => {
    expect(parseLessonForm(form({ ...base, meetingUrl: "javascript:alert(1)" })).success).toBe(
      false,
    );
    const ok = parseLessonForm(form({ ...base, meetingUrl: "https://meet.google.com/abc-defg" }));
    expect(ok.success && ok.data.meetingUrl).toBe("https://meet.google.com/abc-defg");
  });

  it("el horario fijo puede tener fin, pero no antes del primer día", () => {
    const weekly = { ...base, repeat: "weekly" };
    expect(parseLessonForm(form({ ...weekly, endsOn: "2026-12-20" })).success).toBe(true);
    expect(parseLessonForm(form({ ...weekly, endsOn: "2026-10-01" })).success).toBe(false);
    const ok = parseLessonForm(form(weekly));
    expect(ok.success && ok.data.repeat).toBe(true);
  });
});

describe("parseMoveForm", () => {
  it("pide día, hora y duración", () => {
    expect(
      parseMoveForm(form({ date: "2026-11-05", start: "09:30", durationMin: "60" })).success,
    ).toBe(true);
    expect(parseMoveForm(form({ date: "2026-11-05", start: "", durationMin: "60" })).success).toBe(
      false,
    );
  });
});

describe("parseCancelForm", () => {
  it("quién cancela es el profe o el alumno", () => {
    expect(parseCancelForm(form({ by: "teacher" })).success).toBe(true);
    const student = parseCancelForm(form({ by: "student", reason: " Se enfermó " }));
    expect(student.success && student.data.reason).toBe("Se enfermó");
    expect(parseCancelForm(form({ by: "otro" })).success).toBe(false);
    expect(parseCancelForm(form({})).success).toBe(false);
  });
});

describe("parseNotesForm", () => {
  it("todo es opcional y se limpia", () => {
    const result = parseNotesForm(form({ topic: "  ", meetingUrl: "", sharedNotes: "Repasar" }));
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.topic).toBeNull();
      expect(result.data.sharedNotes).toBe("Repasar");
    }
  });

  it("revisa el link", () => {
    expect(parseNotesForm(form({ meetingUrl: "meet.google.com/abc" })).success).toBe(false);
  });
});
