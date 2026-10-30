import { describe, expect, it } from "vitest";
import { findDuplicates, nameKey, type ExistingStudent } from "./duplicates";

const ANA: ExistingStudent = {
  id: "a",
  full_name: "Ana Pérez",
  phone: "5491155551234",
  subject_id: "fisica",
  subject: null,
  archived_at: null,
};

const candidate = {
  fullName: "Ana Pérez",
  phone: "5491100000000",
  subjectId: "fisica",
  subject: null,
};

describe("nameKey", () => {
  it("ignora tildes, mayúsculas, puntuación y orden", () => {
    expect(nameKey("  Pérez,  ANA ")).toBe(nameKey("ana perez"));
  });

  it("no confunde nombres distintos", () => {
    expect(nameKey("Ana Pérez")).not.toBe(nameKey("Ana Pereyra"));
  });
});

describe("findDuplicates", () => {
  it("avisa por nombre, aunque cambie el teléfono", () => {
    expect(findDuplicates(candidate, [ANA])).toEqual([
      { id: "a", fullName: "Ana Pérez", matchedBy: "name", sameSubject: true, archived: false },
    ]);
  });

  it("avisa por teléfono propio con otro nombre", () => {
    const result = findDuplicates({ ...candidate, fullName: "Anita", phone: "5491155551234" }, [
      ANA,
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].matchedBy).toBe("phone");
  });

  it("distingue el aviso por las dos cosas", () => {
    const result = findDuplicates({ ...candidate, phone: "5491155551234" }, [ANA]);
    expect(result[0].matchedBy).toBe("both");
  });

  it("en otra materia solo informa", () => {
    const result = findDuplicates({ ...candidate, subjectId: "ingles" }, [ANA]);
    expect(result[0].sameSubject).toBe(false);
  });

  it("compara el texto de «Otra» cuando no hay materia de la lista", () => {
    const other = { ...ANA, subject_id: null, subject: "Ajedrez" };
    const same = findDuplicates({ ...candidate, subjectId: null, subject: " ajedrez " }, [other]);
    const different = findDuplicates({ ...candidate, subjectId: null, subject: "Dibujo" }, [other]);
    expect(same[0].sameSubject).toBe(true);
    expect(different[0].sameSubject).toBe(false);
  });

  it("sin coincidencia de nombre ni de teléfono no avisa", () => {
    expect(findDuplicates({ ...candidate, fullName: "Luis", phone: null }, [ANA])).toEqual([]);
  });

  it("sin teléfono propio no avisa por teléfono (un menor con el del responsable)", () => {
    const sibling = { ...ANA, full_name: "Bruno Pérez", phone: null };
    expect(findDuplicates({ ...candidate, fullName: "Juan", phone: null }, [sibling])).toEqual([]);
  });

  it("interpreta un teléfono anterior a la normalización", () => {
    const legacy = { ...ANA, full_name: "Otro", phone: "011 15 5555-1234" };
    const result = findDuplicates({ ...candidate, fullName: "Nuevo", phone: "5491155551234" }, [
      legacy,
    ]);
    expect(result[0].matchedBy).toBe("phone");
  });

  it("marca los archivados y pone primero la misma materia", () => {
    const archived = {
      ...ANA,
      id: "b",
      full_name: "Ana Perez",
      subject_id: "ingles",
      archived_at: "2026-10-01",
    };
    const result = findDuplicates(candidate, [archived, ANA]);
    expect(result.map((match) => match.id)).toEqual(["a", "b"]);
    expect(result[1].archived).toBe(true);
  });
});
