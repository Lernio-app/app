import { describe, expect, it } from "vitest";
import { PERFILES, PUBLICACIONES } from "@/content/marketplace-ejemplo";
import { buscar, leerFiltros, resumenDisponibilidad, slugify } from "./marketplace";

describe("resumenDisponibilidad", () => {
  it("agrupa los días con las mismas franjas", () => {
    expect(resumenDisponibilidad({ M: ["tarde"], J: ["tarde"] })).toBe("Martes y jueves a la tarde");
  });
  it("separa los grupos con franjas distintas", () => {
    expect(resumenDisponibilidad({ L: ["noche"], X: ["noche"], V: ["manana"] })).toBe(
      "Lunes y miércoles a la noche · viernes a la mañana",
    );
  });
  it("dice todo el día con las tres franjas", () => {
    expect(resumenDisponibilidad({ S: ["manana", "tarde", "noche"] })).toBe("Sábado todo el día");
  });
  it("avisa cuando no hay horarios", () => {
    expect(resumenDisponibilidad({})).toBe("Sin horarios cargados");
  });
});

describe("leerFiltros", () => {
  it("lee los valores separados por coma y descarta lo que no existe", () => {
    const filtros = leerFiltros({
      q: " first ",
      nivel: "b2,c1",
      modalidad: "online,en-la-luna",
      dias: "mar,jue,xxx",
      franja: "tarde",
      precio_max: "20000",
    });
    expect(filtros.q).toBe("first");
    expect(filtros.niveles).toEqual(["b2", "c1"]);
    expect(filtros.modalidades).toEqual(["online"]);
    expect(filtros.dias).toEqual(["M", "J"]);
    expect(filtros.franjas).toEqual(["tarde"]);
    expect(filtros.precioMax).toBe(2000000);
  });
});

describe("buscar", () => {
  const todos = (params: Record<string, string>, base = {}) =>
    buscar(PUBLICACIONES, PERFILES, leerFiltros(params, base)).map((p) => p.slug);

  it("sin filtros devuelve todo, con las más recientes primero a igual completitud", () => {
    expect(todos({})).toHaveLength(PUBLICACIONES.length);
  });
  it("encuentra por texto sin importar tildes", () => {
    expect(todos({ q: "algebra" })).toContain("algebra-para-el-parcial");
    expect(todos({ q: "first" })).toEqual(["preparacion-first"]);
  });
  it("filtra por precio máximo", () => {
    for (const slug of todos({ precio_max: "10000" })) {
      expect(PUBLICACIONES.find((p) => p.slug === slug)!.precio).toBeLessThanOrEqual(1000000);
    }
  });
  it("filtra por área y materia fijas de la ruta", () => {
    expect(todos({}, { area: "musica", materias: [slugify("Guitarra")] })).toHaveLength(2);
  });
  it("no devuelve nada si los filtros no coinciden", () => {
    expect(todos({ q: "xyz inexistente" })).toEqual([]);
  });
  it("ordena por precio", () => {
    const precios = buscar(PUBLICACIONES, PERFILES, leerFiltros({ orden: "precio-asc" })).map(
      (p) => p.precio,
    );
    expect(precios).toEqual([...precios].sort((a, b) => a - b));
  });
});
