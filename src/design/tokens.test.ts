import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { THEME_COLOR } from "./meta";

// Guarda del sistema de diseño (docs/sistema-de-diseno.md). Si este test falla porque cambiaste un
// color, el cambio tiene que venir de una decisión en `producto` y actualizar la especificación.

const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

function block(selector: string): string {
  const start = css.indexOf(`${selector} {`);
  if (start === -1) throw new Error(`No está el bloque ${selector}`);
  return css.slice(start, css.indexOf("\n}", start));
}

const root = Object.fromEntries(
  [...block(":root").matchAll(/--([a-z0-9-]+):\s*([^;]+);/g)].map(([, name, value]) => [
    name,
    value.trim(),
  ]),
);

function resolve(name: string): string {
  const value = root[name];
  const ref = value?.match(/^var\(--([a-z0-9-]+)\)$/);
  return ref ? resolve(ref[1]) : value;
}

// Especificación §2 (en minúsculas).
const SPEC: Record<string, string> = {
  background: "#ffffff",
  paper: "#f6f7fb",
  grid: "#e4e8f5",
  line: "#e3e5ee",
  "line-soft": "#eef0f5",
  "border-control": "#d5d8e3",
  "border-input": "#8f93a3",
  ink: "#15131f",
  "ink-2": "#4b4d5c",
  "ink-3": "#5f6170",
  indigo: "#4338f5",
  "indigo-strong": "#3328d9",
  "indigo-soft": "#eeedff",
  "indigo-muted": "#d6d3ff",
  "indigo-muted-2": "#e4e2ff",
  "indigo-next": "#f6f5ff",
  "indigo-grid": "#5247f7",
  "indigo-outline": "#8f88ff",
  highlighter: "#ffe14d",
  "ai-bg": "#f3f2ff",
  "ai-border": "#7a72f7",
  "ok-bg": "#ddf5e8",
  ok: "#0f7b4a",
  "ok-solid": "#1f9d63",
  "pending-bg": "#eeeff4",
  pending: "#4b4d5c",
  "pending-solid": "#8f93a3",
  "debt-bg": "#ffebd3",
  debt: "#8f4700",
  "debt-solid": "#d97f14",
  "error-bg": "#fee4e2",
  error: "#b42318",
  "subj-lang": "#2f6bff",
  "subj-lang-bg": "#e3ecff",
  "subj-lang-ink": "#1e40af",
  "subj-uni": "#7c4dff",
  "subj-uni-bg": "#eee6ff",
  "subj-uni-ink": "#5b21b6",
  "subj-school": "#d6336c",
  "subj-school-bg": "#ffe4f1",
  "subj-school-ink": "#9d174d",
  "subj-music": "#0b7f96",
  "subj-music-bg": "#ddf6fb",
  "subj-music-ink": "#0e6577",
};

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(resolve(a) ?? a), luminance(resolve(b) ?? b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

describe("tokens", () => {
  it("son los de la especificación", () => {
    for (const [name, hex] of Object.entries(SPEC)) {
      expect(resolve(name), `--${name}`).toBe(hex);
    }
  });

  it("no hay colores fuera de la especificación", () => {
    const hexes = Object.entries(root).filter(([, value]) => value.startsWith("#"));
    const extra = hexes.filter(
      ([name]) => !(name in SPEC) && !["card", "popover", "primary-foreground"].includes(name),
    );
    expect(extra).toEqual([]);
  });

  it("cada color del theme apunta a un token definido", () => {
    const theme = block("@theme inline");
    for (const [, name, ref] of theme.matchAll(/--color-([a-z0-9-]+):\s*var\(--([a-z0-9-]+)\)/g)) {
      expect(root[ref], `--color-${name} → --${ref}`).toBeDefined();
    }
  });

  it("la meta theme-color es el índigo", () => {
    expect(THEME_COLOR).toBe(resolve("indigo"));
  });
});

describe("contraste (§10, WCAG 2.1)", () => {
  const text: [string, string][] = [
    ["ink", "background"],
    ["ink", "paper"],
    ["ink-2", "background"],
    ["ink-3", "background"],
    ["ink-3", "paper"],
    ["indigo-strong", "background"],
    ["indigo-strong", "indigo-soft"],
    ["indigo-strong", "ai-bg"],
    ["indigo-muted", "indigo"],
    ["ink", "highlighter"],
    ["ok", "ok-bg"],
    ["pending", "pending-bg"],
    ["debt", "debt-bg"],
    ["error", "error-bg"],
    ["subj-lang-ink", "subj-lang-bg"],
    ["subj-uni-ink", "subj-uni-bg"],
    ["subj-school-ink", "subj-school-bg"],
    ["subj-music-ink", "subj-music-bg"],
    ["#ffffff", "indigo"],
    ["#ffffff", "subj-lang"],
    ["#ffffff", "subj-uni"],
    ["#ffffff", "subj-school"],
    ["#ffffff", "subj-music"],
  ];
  // §10 redondea a dos decimales: blanco sobre --subj-lang da 4,499 y figura como 4,50.
  it.each(text)("texto %s sobre %s llega a 4,5:1", (fg, bg) => {
    expect(contrast(fg, bg)).toBeGreaterThanOrEqual(4.495);
  });

  const graphics: [string, string][] = [
    ["border-input", "background"],
    ["ok-solid", "background"],
    ["pending-solid", "background"],
    ["debt-solid", "background"],
    ["ai-border", "ai-bg"],
  ];
  it.each(graphics)("borde o gráfico %s sobre %s llega a 3:1", (fg, bg) => {
    expect(contrast(fg, bg)).toBeGreaterThanOrEqual(2.995);
  });
});

describe("globals.css", () => {
  // Fuera de :root no se escriben colores: todo apunta a un token.
  it("no tiene colores fuera de :root", () => {
    const outside = css.replace(block(":root"), "");
    expect(outside.match(/#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(|oklch\(/gi)).toBeNull();
  });

  it("no tiene sombras", () => {
    expect(css.match(/(box|text)-shadow\s*:\s*(?!none)/g)).toBeNull();
  });

  it("solo usa gradientes para la cuadrícula y el resaltador", () => {
    const gradients = css.match(/linear-gradient|radial-gradient|conic-gradient/g) ?? [];
    expect(gradients).toHaveLength(3);
  });
});
