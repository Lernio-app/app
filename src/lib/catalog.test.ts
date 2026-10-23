import { describe, expect, it } from "vitest";

import { defaultAreaFor, groupSubjects, type Catalog } from "./catalog";

const catalog: Catalog = {
  areas: [
    { id: "idiomas", code: "idiomas", name: "Inglés e idiomas", color: "idiomas", position: 1 },
    {
      id: "ingreso",
      code: "ingreso",
      name: "Ingreso y universidad",
      color: "ingreso",
      position: 2,
    },
    { id: "apoyo", code: "apoyo", name: "Apoyo escolar", color: "apoyo", position: 3 },
  ],
  subjects: [
    { id: "ingles", code: "ingles", name: "Inglés", position: 1, areaIds: ["idiomas"] },
    { id: "fisica", code: "fisica", name: "Física", position: 2, areaIds: ["apoyo", "ingreso"] },
    {
      id: "mate",
      code: "matematica",
      name: "Matemática",
      position: 3,
      areaIds: ["ingreso", "apoyo"],
    },
    { id: "algebra", code: "algebra", name: "Álgebra", position: 4, areaIds: ["ingreso"] },
  ],
  levels: [],
};

describe("groupSubjects", () => {
  it("junta las materias que se enseñan en las mismas áreas, sin importar el orden", () => {
    const groups = groupSubjects(catalog);
    expect(groups.map((g) => g.subjects.map((s) => s.name))).toEqual([
      ["Inglés"],
      ["Física", "Matemática"],
      ["Álgebra"],
    ]);
  });

  it("titula cada grupo con sus áreas y marca «Solo» las que también están en un grupo compartido", () => {
    expect(groupSubjects(catalog).map((g) => g.label)).toEqual([
      "Inglés e idiomas",
      "Ingreso y universidad y/o Apoyo escolar",
      "Solo Ingreso y universidad",
    ]);
  });
});

describe("defaultAreaFor", () => {
  const fisica = catalog.subjects[1];

  it("propone el área principal del profe si la materia se enseña ahí", () => {
    expect(defaultAreaFor(fisica, catalog, "apoyo")).toBe("apoyo");
  });

  it("si no, la primera área de la materia", () => {
    expect(defaultAreaFor(fisica, catalog, "idiomas")).toBe("ingreso");
    expect(defaultAreaFor(fisica, catalog, null)).toBe("ingreso");
  });

  it("con una sola área, esa", () => {
    expect(defaultAreaFor(catalog.subjects[0], catalog, "apoyo")).toBe("idiomas");
  });
});
