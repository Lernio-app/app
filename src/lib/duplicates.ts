import { normalizeArPhone } from "@/lib/phone";

// Aviso de posible duplicado al cargar un alumno (F1-6). Coincide el nombre o el teléfono propio del
// alumno; el del responsable de pago no cuenta, para no avisar con los hermanos. Nunca bloquea.

export type DuplicateCandidate = {
  fullName: string;
  // Ya normalizado (formato guardado) o null.
  phone: string | null;
  subjectId: string | null;
  // Texto libre: el detalle de la materia o, con «Otra», el nombre que escribió el profe.
  subject: string | null;
};

export type ExistingStudent = {
  id: string;
  full_name: string;
  phone: string | null;
  subject_id: string | null;
  subject: string | null;
  archived_at: string | null;
};

export type DuplicateMatch = {
  id: string;
  fullName: string;
  matchedBy: "name" | "phone" | "both";
  // Misma materia: probablemente es el mismo alumno. Otra materia: puede ser la misma persona con otra clase.
  sameSubject: boolean;
  archived: boolean;
};

// Sin tildes ni mayúsculas, sin puntuación y sin importar el orden: «Pérez, Ana» = «ana perez».
export function nameKey(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .split(/[^a-z0-9ñ]+/)
    .filter(Boolean)
    .sort()
    .join(" ");
}

function textKey(value: string | null): string {
  return (value ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

function sameSubject(candidate: DuplicateCandidate, student: ExistingStudent): boolean {
  if (candidate.subjectId || student.subject_id) return candidate.subjectId === student.subject_id;
  const wanted = textKey(candidate.subject);
  return wanted !== "" && wanted === textKey(student.subject);
}

export function findDuplicates(
  candidate: DuplicateCandidate,
  existing: ExistingStudent[],
): DuplicateMatch[] {
  const wantedName = nameKey(candidate.fullName);
  const matches: DuplicateMatch[] = [];
  for (const student of existing) {
    const byName = wantedName !== "" && nameKey(student.full_name) === wantedName;
    // Un dato anterior a la normalización se intenta interpretar antes de compararlo.
    const stored = student.phone ? (normalizeArPhone(student.phone) ?? student.phone) : null;
    const byPhone = candidate.phone !== null && stored === candidate.phone;
    if (!byName && !byPhone) continue;
    matches.push({
      id: student.id,
      fullName: student.full_name,
      matchedBy: byName && byPhone ? "both" : byName ? "name" : "phone",
      sameSubject: sameSubject(candidate, student),
      archived: student.archived_at !== null,
    });
  }
  // Lo más probable primero: misma materia, y dentro de eso, los que coinciden en las dos cosas.
  const rank = (match: DuplicateMatch) =>
    (match.sameSubject ? 2 : 0) + (match.matchedBy === "both" ? 1 : 0);
  return matches.sort((a, b) => rank(b) - rank(a) || a.fullName.localeCompare(b.fullName, "es"));
}
