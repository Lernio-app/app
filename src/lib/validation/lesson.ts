import { z } from "zod";
import { isHm, isYmd } from "@/lib/dates";
import { fieldErrorsFrom } from "@/lib/validation/workspace";

export const DURATION_OPTIONS = [30, 45, 60, 90] as const;
export const DEFAULT_DURATION = 60;

export const ATTENDANCE_VALUES = ["present", "late", "absent", "excused"] as const;
export type Attendance = (typeof ATTENDANCE_VALUES)[number];

export const ATTENDANCE_LABELS: Record<Attendance, string> = {
  present: "Vino",
  late: "Tarde",
  absent: "Faltó",
  excused: "Avisó",
};

const text = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Usá hasta ${max} caracteres.`)
    .transform((value) => (value === "" ? null : value));

const optionalUrl = text(500).refine(
  (value) => value === null || /^https?:\/\/\S+$/.test(value),
  "El link tiene que empezar con https://",
);

const day = (message: string) => z.string().trim().refine(isYmd, message);
const time = (message: string) => z.string().trim().refine(isHm, message);

const duration = z
  .string()
  .trim()
  .transform((value) => Number(value))
  .refine((value) => Number.isInteger(value) && value >= 5 && value <= 480, {
    message: "Poné la duración en minutos, entre 5 y 480.",
  });

export const lessonSchema = z
  .object({
    date: day("Elegí el día."),
    start: time("Poné la hora de inicio."),
    durationMin: duration,
    studentIds: z
      .array(z.uuid())
      .min(1, "Elegí al menos un alumno.")
      .max(30, "Hasta 30 alumnos por clase."),
    meetingUrl: optionalUrl,
    topic: text(200),
    repeat: z.boolean(),
    endsOn: text(10).refine((value) => value === null || isYmd(value), "Elegí un día válido."),
  })
  .superRefine((value, ctx) => {
    if (value.repeat && value.endsOn && value.endsOn < value.date) {
      ctx.addIssue({
        code: "custom",
        path: ["endsOn"],
        message: "Tiene que ser después del primer día.",
      });
    }
  });

export type LessonInput = z.output<typeof lessonSchema>;

// Lo que escribió el profe, tal cual, para volver a mostrarlo si hay un error.
export type LessonValues = {
  date: string;
  start: string;
  durationMin: string;
  studentIds: string[];
  meetingUrl: string;
  topic: string;
  repeat: boolean;
  endsOn: string;
};

export function submittedLessonValues(formData: FormData): LessonValues {
  const read = (key: string) => String(formData.get(key) ?? "");
  return {
    date: read("date"),
    start: read("start"),
    durationMin: read("durationMin"),
    studentIds: formData.getAll("studentIds").map(String),
    meetingUrl: read("meetingUrl"),
    topic: read("topic"),
    repeat: formData.get("repeat") === "weekly",
    endsOn: read("endsOn"),
  };
}

export function parseLessonForm(formData: FormData) {
  return lessonSchema.safeParse(submittedLessonValues(formData));
}

export const moveSchema = z.object({
  date: day("Elegí el día."),
  start: time("Poné la hora de inicio."),
  durationMin: duration,
});

export function parseMoveForm(formData: FormData) {
  const read = (key: string) => String(formData.get(key) ?? "");
  return moveSchema.safeParse({
    date: read("date"),
    start: read("start"),
    durationMin: read("durationMin"),
  });
}

export const cancelSchema = z.object({
  by: z.enum(["teacher", "student"], { error: "Elegí quién cancela." }),
  reason: text(300),
});

export function parseCancelForm(formData: FormData) {
  return cancelSchema.safeParse({
    by: String(formData.get("by") ?? ""),
    reason: String(formData.get("reason") ?? ""),
  });
}

export const notesSchema = z.object({
  topic: text(200),
  meetingUrl: optionalUrl,
  sharedNotes: text(2000),
  privateNotes: text(2000),
});

export function parseNotesForm(formData: FormData) {
  const read = (key: string) => String(formData.get(key) ?? "");
  return notesSchema.safeParse({
    topic: read("topic"),
    meetingUrl: read("meetingUrl"),
    sharedNotes: read("sharedNotes"),
    privateNotes: read("privateNotes"),
  });
}

export { fieldErrorsFrom };
