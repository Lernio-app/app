// Plugin local de ESLint con las reglas del sistema de diseño (docs/sistema-de-diseno.md).
// Cada regla cita la sección de la especificación que hace cumplir. Las excepciones no van en el
// código (src/ tiene noInlineConfig): van en eslint.config.mjs, con su motivo, y se ven en el diff.

import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const GLOBALS_CSS = fileURLToPath(new URL("../src/app/globals.css", import.meta.url));

// Colores que existen: los --color-* del @theme de globals.css, más los neutros de CSS.
const KNOWN_COLORS = new Set(["white", "transparent", "current", "inherit"]);
for (const [, name] of readFileSync(GLOBALS_CSS, "utf8").matchAll(/--color-([a-z0-9-]+)\s*:/g)) {
  KNOWN_COLORS.add(name);
}

const posix = (filename) => filename.replaceAll("\\", "/");
// components/ui arma las primitivas: es el único lugar donde se combinan clases de bajo nivel.
const isPrimitive = (filename) => /\/src\/components\/(ui|expresivos)\//.test(posix(filename));

// ---------------------------------------------------------------------------------------------
// Clases: cualquier string que parezca una lista de clases de Tailwind se revisa, esté en un
// className, en cn()/cva() o en una constante.

const CLASS_TOKEN = /^[!-]?[a-z0-9@[(*&][^\s]*$/;

function looksLikeClassList(value) {
  const tokens = value.trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return false;
  if (!tokens.every((token) => CLASS_TOKEN.test(token))) return false;
  return tokens.some((token) => token.includes("-") || token.includes(":"));
}

// "md:hover:bg-paper" → "bg-paper". Respeta los ":" dentro de corchetes y paréntesis.
function utilityOf(token) {
  let depth = 0;
  let last = -1;
  for (let i = 0; i < token.length; i++) {
    const char = token[i];
    if (char === "[" || char === "(") depth++;
    else if (char === "]" || char === ")") depth--;
    else if (char === ":" && depth === 0) last = i;
  }
  return token
    .slice(last + 1)
    .replace(/^!|!$/g, "")
    .replace(/^-/, "");
}

const PALETTE =
  "slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose";
const COLOR_PREFIX =
  "bg|text|border(?:-[xytrblse])?|ring|ring-offset|outline|fill|stroke|divide|decoration|placeholder|caret|accent|shadow|inset-ring|from|via|to";

// Utilidades con estos prefijos que no son colores.
const NOT_A_COLOR = {
  text: /^(xs|sm|base|lg|\d?xl|left|center|right|justify|start|end|wrap|nowrap|balance|pretty|ellipsis|clip)$/,
  bg: /^(fixed|local|scroll|clip-.+|origin-.+|repeat.*|no-repeat|cover|contain|auto|center|top|bottom|left|right|[a-z]+-(top|bottom)|none|blend-.+|cuadricula)$/,
  border: /^(\d+|solid|dashed|dotted|double|hidden|none|collapse|separate|spacing.*)$/,
  ring: /^(\d+|inset)$/,
  outline: /^(\d+|none|hidden|solid|dashed|dotted|double|offset-.+)$/,
  fill: /^none$/,
  stroke: /^(\d+|none)$/,
  divide: /^(x|y)(-\d+|-reverse)?$|^(solid|dashed|dotted|double|none)$/,
  decoration: /^(\d+|solid|double|dotted|dashed|wavy|auto|from-font|clone|slice)$/,
  placeholder: /^$/,
  caret: /^$/,
  accent: /^auto$/,
};

const CHECKS = [
  // §2: colores solo por token
  {
    rule: "color",
    test: (u) =>
      new RegExp(`^(${COLOR_PREFIX})-(${PALETTE})-\\d{2,3}(/.*)?$`).test(u) ||
      /^(bg|text|border)-black$/.test(u),
    message: (u) =>
      `"${u}" es un color de la paleta de Tailwind. Usá un token del sistema (bg-paper, text-ink-3, text-debt…).`,
  },
  {
    rule: "color",
    test: (u) =>
      /\[(#|rgba?\(|hsla?\(|oklch\(|oklab\(|lab\(|lch\(|color)/.test(u) || /color-mix\(/.test(u),
    message: (u) => `"${u}" escribe un color a mano. Los colores viven solo en globals.css.`,
  },
  {
    rule: "color",
    test: (u) =>
      /^(bg|text|border(-[xytrblse])?|ring|outline|fill|stroke|divide|decoration|placeholder)-[a-z0-9-]+\/(\d+|\[.+\]|\(.+\))$/.test(
        u,
      ),
    message: (u) => `"${u}" usa transparencia. Sin lavados de color (§13): elegí un token.`,
  },
  {
    rule: "color",
    test: (u) => {
      const match = u.match(
        /^(bg|text|border(?:-[xytrblse])?|ring|outline|fill|stroke|divide|decoration|placeholder|caret|accent)-(.+)$/,
      );
      if (!match) return false;
      const [, rawPrefix, value] = match;
      const prefix = rawPrefix.startsWith("border") ? "border" : rawPrefix;
      if (value.startsWith("[") || value.startsWith("(")) return false;
      if (NOT_A_COLOR[prefix]?.test(value)) return false;
      if (/^(x|y|t|r|b|l|s|e)$/.test(value) && prefix === "border") return false;
      return !KNOWN_COLORS.has(value);
    },
    message: (u) =>
      `"${u}" no es un token de color del sistema: Tailwind no genera nada. Revisá los tokens en docs/sistema-de-diseno.md.`,
  },

  // §4 y §13: sin sombras ni gradientes; bordes de 1 px; radios con nombre
  {
    rule: "forma",
    test: (u) =>
      /^(shadow(?!-none$)|inset-shadow|drop-shadow|text-shadow|bg-(linear|radial|conic|gradient)|backdrop-|blur|from-|via-|to-)/.test(
        u,
      ),
    message: (u) =>
      `"${u}": sin sombras, gradientes ni desenfoques (§4 y §13). La profundidad sale de bordes y fondos.`,
  },
  {
    rule: "forma",
    test: (u) => /^border(-[xytrblse])?-([2-9]\d*|1\d+|\[.+\])$/.test(u),
    message: (u) => `"${u}": los bordes son de 1 px (§4).`,
  },
  {
    rule: "forma",
    test: (u) => {
      const match = u.match(/^rounded(?:-(?:t|r|b|l|s|e|tl|tr|br|bl|ss|se|es|ee))?(?:-(.+))?$/);
      return (
        Boolean(match) && !["control", "card", "tag", "key", "full", "none"].includes(match[1])
      );
    },
    message: (u) =>
      `"${u}": usá un radio con nombre (rounded-control, rounded-card, rounded-tag, rounded-key o rounded-full). El valor sale de la superficie (§4).`,
  },
  {
    rule: "forma",
    test: (u) => /^animate-(?!spin$|pulse$)/.test(u),
    message: (u) =>
      `"${u}": la interfaz es estática (§5.3). Solo animate-spin y animate-pulse para carga.`,
  },

  // §3: tipografía
  {
    rule: "tipografia",
    test: (u) => /^text-(\d?xl)$/.test(u) || /^text-\[(\d|calc|clamp)/.test(u),
    message: (u) =>
      `"${u}": los tamaños grandes salen de la escala (title-page, title-section, title-card, stat, num-kpi), no de text-* (§3.2).`,
  },
  {
    rule: "tipografia",
    test: (u) => /^font-(thin|extralight|light|bold|extrabold|black)$/.test(u),
    message: (u) =>
      `"${u}": Geist va en 400, 500 y 600 (font-normal, font-medium, font-semibold). El 800 de Bricolage entra por los títulos (§3.1).`,
  },
  {
    rule: "tipografia",
    test: (u) => u === "font-display" || u === "font-heading",
    message: (u) =>
      `"${u}": Bricolage solo entra por title-page, title-section, title-card o stat (§3.1).`,
  },

  // §2.5 y §5.2: color con significado
  {
    rule: "semantica",
    test: (u) => /^(text|bg|border|ring|outline|decoration)-(error|destructive)(-bg)?$/.test(u),
    message: () =>
      `El rojo es solo para errores del sistema (§2.5): usá <FormError>. Las deudas van en ámbar (text-debt).`,
  },
  {
    rule: "semantica",
    test: (u) => /^bg-(ok|pending|debt)-bg$/.test(u),
    message: () =>
      `Los fondos de estado van solo en <StatusChip> (§6), que suma el ícono obligatorio.`,
  },
  {
    rule: "semantica",
    test: (u) => /^(bg|text|border|decoration)-highlighter$/.test(u) || u === "resaltador",
    message: () => `El resaltador entra solo por <Resaltador> (§5.2), que controla dónde va.`,
  },
];

function checkClassString(context, node, value, rule) {
  const inClassName = node.parent?.type === "JSXAttribute" && node.parent.name.name === "className";
  if (!inClassName && !looksLikeClassList(value)) return;
  for (const token of value.trim().split(/\s+/)) {
    const utility = utilityOf(token);
    for (const check of CHECKS) {
      if (check.rule === rule && check.test(utility)) {
        context.report({ node, message: check.message(utility) });
        break;
      }
    }
  }
}

function isSkippedString(node) {
  const parent = node.parent;
  if (!parent) return false;
  if (
    parent.type === "ImportDeclaration" ||
    parent.type === "ExportNamedDeclaration" ||
    parent.type === "ExportAllDeclaration"
  )
    return true;
  if (parent.type === "ImportExpression") return true;
  if (parent.type === "TSLiteralType") return true;
  if (parent.type === "ExpressionStatement" && parent.directive) return true;
  return false;
}

function classRule(rule, description) {
  return {
    meta: { type: "problem", docs: { description }, schema: [] },
    create(context) {
      if (isPrimitive(context.filename)) return {};
      return {
        Literal(node) {
          if (typeof node.value === "string" && !isSkippedString(node)) {
            checkClassString(context, node, node.value, rule);
          }
        },
        TemplateElement(node) {
          checkClassString(context, node, node.value.cooked ?? "", rule);
        },
      };
    },
  };
}

// ---------------------------------------------------------------------------------------------
// Utilidades de JSX

function elementName(opening) {
  const name = opening.name;
  if (name.type === "JSXIdentifier") return name.name;
  if (name.type === "JSXMemberExpression") return `${name.object.name}.${name.property.name}`;
  return "";
}

function attribute(opening, attrName) {
  return opening.attributes.find(
    (attr) => attr.type === "JSXAttribute" && attr.name.name === attrName,
  );
}

// Todos los strings literales de una expresión (className, cn(...), condicionales, etc.).
function stringsIn(node, out = []) {
  if (!node) return out;
  switch (node.type) {
    case "Literal":
      if (typeof node.value === "string") out.push(node.value);
      break;
    case "TemplateLiteral":
      node.quasis.forEach((quasi) => out.push(quasi.value.cooked ?? ""));
      node.expressions.forEach((expr) => stringsIn(expr, out));
      break;
    case "JSXExpressionContainer":
      stringsIn(node.expression, out);
      break;
    case "ConditionalExpression":
      stringsIn(node.consequent, out);
      stringsIn(node.alternate, out);
      break;
    case "LogicalExpression":
      stringsIn(node.left, out);
      stringsIn(node.right, out);
      break;
    case "ArrayExpression":
      node.elements.forEach((el) => stringsIn(el, out));
      break;
    case "CallExpression":
      node.arguments.forEach((arg) => stringsIn(arg, out));
      break;
    case "ObjectExpression":
      node.properties.forEach((prop) => prop.type === "Property" && stringsIn(prop.value, out));
      break;
  }
  return out;
}

function classesOf(opening) {
  const attr = attribute(opening, "className");
  if (!attr) return [];
  return stringsIn(attr.value)
    .flatMap((value) => value.split(/\s+/))
    .filter(Boolean)
    .map(utilityOf);
}

function jsxAncestors(node) {
  const out = [];
  for (let current = node.parent; current; current = current.parent) {
    if (current.type === "JSXElement") out.push(current.openingElement);
    if (current.type.startsWith("Function") || current.type === "ArrowFunctionExpression") break;
  }
  return out;
}

// ---------------------------------------------------------------------------------------------
// Reglas

const DATA_ELEMENTS = new Set([
  "input",
  "textarea",
  "select",
  "option",
  "button",
  "label",
  "table",
  "td",
  "th",
  "tr",
  "Button",
  "Input",
  "Textarea",
  "NativeSelect",
  "Label",
]);
const DISPLAY_CLASSES = new Set(["title-page", "title-card", "title-section", "stat"]);

const tipografiaEnDatos = {
  meta: {
    type: "problem",
    docs: { description: "Bricolage nunca va en tablas, inputs, botones ni labels (§3.1)" },
    schema: [],
  },
  create(context) {
    return {
      JSXOpeningElement(node) {
        const name = elementName(node);
        if (!DATA_ELEMENTS.has(name)) return;
        const found = classesOf(node).find(
          (cls) => DISPLAY_CLASSES.has(cls) || cls === "font-display",
        );
        if (found) {
          context.report({
            node,
            message: `"${found}" en <${name}>: Bricolage nunca va en tablas, inputs, botones ni labels (§3.1).`,
          });
        }
      },
    };
  },
};

// El alto de botones y campos sale de la superficie (--control-h): 44 en el celular, 40 en el
// escritorio de la app, 48 en marketing.
const CONTROLS = new Set(["Button", "Input", "NativeSelect"]);
const FIXED_HEIGHT = /^(h|size)-(\d|\[|px$)/;

const altoDeControl = {
  meta: {
    type: "problem",
    docs: { description: "El alto de los controles sale de la superficie (§1.1)" },
    schema: [],
  },
  create(context) {
    const report = (node, cls) =>
      context.report({
        node,
        message: `"${cls}": el alto de botones y campos sale de la superficie (--control-h), no se fija a mano (§1.1).`,
      });
    return {
      JSXOpeningElement(node) {
        if (!CONTROLS.has(elementName(node))) return;
        const fixed = classesOf(node).find((cls) => FIXED_HEIGHT.test(cls));
        if (fixed) report(node, fixed);
      },
      CallExpression(node) {
        const usesButton = node.arguments.some(
          (arg) =>
            arg.type === "CallExpression" &&
            arg.callee.type === "Identifier" &&
            arg.callee.name === "buttonVariants",
        );
        if (!usesButton) return;
        const fixed = stringsIn(node)
          .flatMap((value) => value.split(/\s+/))
          .map(utilityOf)
          .find((cls) => FIXED_HEIGHT.test(cls));
        if (fixed) report(node, fixed);
      },
    };
  },
};

const NUMBER_FORMATTERS = new Set(["formatARS", "formatTime", "localTime"]);
const MONO_CLASSES = new Set(["num", "num-kpi", "font-mono", "label-mono", "stat"]);
const MONO_COMPONENTS = new Set(["StatusChip"]);

function callsFormatter(node) {
  let found = false;
  (function walk(current) {
    if (!current || found || typeof current !== "object") return;
    if (
      current.type === "CallExpression" &&
      current.callee.type === "Identifier" &&
      NUMBER_FORMATTERS.has(current.callee.name)
    ) {
      found = true;
      return;
    }
    if (
      current.type === "JSXElement" ||
      current.type.startsWith("Function") ||
      current.type === "ArrowFunctionExpression"
    )
      return;
    for (const key of Object.keys(current)) {
      if (key === "parent") continue;
      const value = current[key];
      if (Array.isArray(value)) value.forEach(walk);
      else if (value && typeof value.type === "string") walk(value);
    }
  })(node);
  return found;
}

const numerosEnMono = {
  meta: {
    type: "problem",
    docs: { description: "Montos y horas van en Geist Mono (§3.1)" },
    schema: [],
  },
  create(context) {
    return {
      JSXExpressionContainer(node) {
        if (node.parent.type !== "JSXElement" && node.parent.type !== "JSXFragment") return;
        if (!callsFormatter(node.expression)) return;
        const ok = jsxAncestors(node).some(
          (opening) =>
            MONO_COMPONENTS.has(elementName(opening)) ||
            classesOf(opening).some((cls) => MONO_CLASSES.has(cls)),
        );
        if (!ok) {
          context.report({
            node,
            message:
              "Los montos y las horas van en Geist Mono: poné la clase `num` (o `num-kpi`) en el elemento que los contiene (§3.1).",
          });
        }
      },
    };
  },
};

const NO_HIGHLIGHT_INSIDE = new Set([
  "button",
  "a",
  "Link",
  "Button",
  "td",
  "th",
  "label",
  "StatusChip",
  "input",
]);

const resaltador = {
  meta: {
    type: "problem",
    docs: { description: "Un resaltador por pantalla, solo sobre texto (§5.2)" },
    schema: [],
  },
  create(context) {
    const seen = [];
    return {
      JSXElement(node) {
        if (elementName(node.openingElement) !== "Resaltador") return;
        seen.push(node);
        // Texto o la fecha de la pantalla: nada de montos, horas, números ni otros elementos.
        const onData = node.children.some(
          (child) =>
            child.type === "JSXElement" ||
            (child.type === "JSXExpressionContainer" &&
              (callsFormatter(child.expression) ||
                (child.expression.type === "Literal" &&
                  typeof child.expression.value === "number"))),
        );
        if (onData) {
          context.report({
            node,
            message:
              "El resaltador va sobre una frase o la fecha de la pantalla, no sobre datos: nada de montos, horas ni estados (§5.2).",
          });
        }
        const inside = jsxAncestors(node).find((opening) =>
          NO_HIGHLIGHT_INSIDE.has(elementName(opening)),
        );
        if (inside) {
          context.report({
            node,
            message: `Resaltador dentro de <${elementName(inside)}>: no va en botones, links, celdas ni estados (§5.2).`,
          });
        }
      },
      "Program:exit"() {
        seen
          .slice(1)
          .forEach((node) =>
            context.report({ node, message: "Máximo un resaltador por pantalla (§5.2)." }),
          );
      },
    };
  },
};

// Un primario (variante default) por vista. Se cuenta por archivo; dos primarios en ramas que no
// pueden mostrarse juntas (if/else, ternario, returns distintos) no chocan.
function isPrimaryButton(node) {
  if (node.type === "JSXOpeningElement" && elementName(node) === "Button") {
    const variant = attribute(node, "variant");
    if (!variant) return true;
    return variant.value?.type === "Literal" && variant.value.value === "default";
  }
  if (
    node.type === "CallExpression" &&
    node.callee.type === "Identifier" &&
    node.callee.name === "buttonVariants"
  ) {
    const [options] = node.arguments;
    if (!options) return true;
    if (options.type !== "ObjectExpression") return false;
    const variant = options.properties.find(
      (prop) => prop.type === "Property" && prop.key.name === "variant",
    );
    if (!variant) return true;
    return variant.value.type === "Literal" && variant.value.value === "default";
  }
  return false;
}

function branchesOf(node) {
  const out = [];
  let child = node;
  for (let current = node.parent; current; child = current, current = current.parent) {
    if (current.type === "ConditionalExpression" && child !== current.test) {
      out.push({ at: current, side: child === current.consequent ? "a" : "b" });
    } else if (current.type === "IfStatement" && child !== current.test) {
      out.push({ at: current, side: child === current.consequent ? "a" : "b" });
    } else if (current.type === "ReturnStatement") {
      out.push({ at: current, side: "return", fn: enclosingFunction(current) });
    }
  }
  return out;
}

function enclosingFunction(node) {
  for (let current = node.parent; current; current = current.parent) {
    if (current.type.startsWith("Function") || current.type === "ArrowFunctionExpression")
      return current;
  }
  return null;
}

function exclusive(a, b) {
  const branchesA = branchesOf(a);
  const branchesB = branchesOf(b);
  for (const x of branchesA) {
    for (const y of branchesB) {
      if (x.at === y.at && x.side !== y.side) return true;
    }
  }
  // Dos returns distintos de la misma función nunca se muestran juntos.
  const returnA = branchesA.find((x) => x.side === "return");
  const returnB = branchesB.find((x) => x.side === "return");
  return Boolean(returnA && returnB && returnA.at !== returnB.at && returnA.fn === returnB.fn);
}

function insideMap(node) {
  for (let current = node.parent; current; current = current.parent) {
    if (
      current.type === "CallExpression" &&
      current.callee.type === "MemberExpression" &&
      ["map", "flatMap"].includes(current.callee.property.name)
    ) {
      return true;
    }
  }
  return false;
}

const unPrimario = {
  meta: {
    type: "problem",
    docs: { description: "Un solo botón índigo por vista (§2.5)" },
    schema: [],
  },
  create(context) {
    const primaries = [];
    const collect = (node) => isPrimaryButton(node) && primaries.push(node);
    return {
      JSXOpeningElement: collect,
      CallExpression: collect,
      "Program:exit"() {
        for (const node of primaries) {
          if (insideMap(node)) {
            context.report({
              node,
              message:
                'Botón primario dentro de una lista: se repite por fila. Usá variant="secondary" (§2.5).',
            });
          }
        }
        primaries.forEach((node, index) => {
          const clash = primaries.slice(0, index).find((other) => !exclusive(node, other));
          if (clash) {
            context.report({
              node,
              message:
                "Ya hay un botón primario en esta vista: uno solo índigo, el resto secondary o ghost (§2.5).",
            });
          }
        });
      },
    };
  },
};

// Texto de interfaz (§9 y §12.11)
const BANNED = [
  [
    /(?<!\p{L})(moros[oa]s?|deudor(a|es|as)?|atrasad[oa]s?)(?!\p{L})/iu,
    'Estados sin juicio: nunca "moroso", "deudor" ni "atrasado" (§9). Escribí "Debe 2 clases · $ 36.000".',
  ],
  [/^\s*error\s*:/iu, 'Los errores dicen qué pasó y qué hacer, sin el prefijo "Error:" (§9).'],
  [
    /(?<!\p{L})(garantizad[oa]s?|los mejores|las mejores|top profe|más elegid[oa]s?|quedan pocos|últimos lugares)(?!\p{L})/iu,
    "Sin superlativos, rankings, urgencia ni promesas académicas (§12.11).",
  ],
  [
    /(?<!\p{L})(tú|ti|contigo|puedes|tienes|quieres|eres|debes|sabes|necesitas|vienes|haces|dices|prefieres|recuerdas|vosotros|vuestr[oa]s?)(?!\p{L})/iu,
    'Voseo en todos los textos (§9): "podés", "tenés", "querés", "vos".',
  ],
];
const EMOJI = /\p{Extended_Pictographic}/u;
const EXCLAMATION = /[!¡]/;
const NOT_UI_ATTRIBUTES = new Set([
  "className",
  "href",
  "src",
  "id",
  "name",
  "type",
  "htmlFor",
  "key",
  "role",
  "rel",
  "target",
  "inputMode",
  "autoComplete",
  "pattern",
  "method",
  "encType",
  "lang",
  "dir",
  "accept",
  "form",
]);

function isUiString(node) {
  if (isSkippedString(node)) return false;
  const parent = node.parent;
  if (parent.type === "JSXAttribute") {
    const name = parent.name.name;
    return typeof name === "string" && !NOT_UI_ATTRIBUTES.has(name) && !name.startsWith("data-");
  }
  if (parent.type === "Property" && parent.key === node) return false;
  if (parent.type === "BinaryExpression" || parent.type === "SwitchCase") return false;
  if (parent.type === "MemberExpression") return false;
  return true;
}

const texto = {
  meta: {
    type: "problem",
    docs: { description: "Voseo, sin juicio, sin exclamaciones ni emojis en la interfaz (§9)" },
    schema: [],
  },
  create(context) {
    const file = posix(context.filename);
    const isMessages = /\/src\/lib\//.test(file);
    const isUi = /\/src\/(app|components)\//.test(file);
    function check(node, value) {
      if (!value || looksLikeClassList(value)) return;
      for (const [pattern, message] of BANNED) {
        if (pattern.test(value)) context.report({ node, message });
      }
      if (isUi && EMOJI.test(value)) {
        context.report({
          node,
          message:
            "Sin emojis en la interfaz (§9). Solo en los mensajes que manda el profe, uno como máximo.",
        });
      }
      if (isMessages && (value.match(new RegExp(EMOJI.source, "gu")) ?? []).length > 1) {
        context.report({ node, message: "Un emoji como máximo por mensaje del profe (§8 y §9)." });
      }
      if (isUi && EXCLAMATION.test(value)) {
        context.report({ node, message: "Sin exclamaciones en la interfaz (§9)." });
      }
    }
    return {
      JSXText(node) {
        check(node, node.value);
      },
      Literal(node) {
        if (typeof node.value === "string" && isUiString(node)) check(node, node.value);
      },
      TemplateLiteral(node) {
        if (isUiString(node))
          check(node, node.quasis.map((quasi) => quasi.value.cooked ?? "").join(" "));
      },
    };
  },
};

// Superficies (§1.1): toda pantalla vive en un grupo de rutas y el layout del grupo la marca.
const SURFACE_BY_GROUP = {
  "(app)": "app",
  "(onboarding)": "app",
  "(auth)": "marketplace",
  "(marketplace)": "marketplace",
  "(marketing)": "marketing",
  "(portal)": "portal",
  "(interno)": "interno",
};

const superficie = {
  meta: {
    type: "problem",
    docs: { description: "Cada pantalla pertenece a una superficie (§1.1)" },
    schema: [],
  },
  create(context) {
    const file = posix(context.filename);
    const page = file.match(/\/src\/app\/(.+)\/page\.tsx$/);
    const groupLayout = file.match(/\/src\/app\/(\([^/]+\))\/layout\.tsx$/);
    const surfaces = [];
    return {
      JSXOpeningElement(node) {
        if (elementName(node) === "Surface") surfaces.push(node);
        const raw = attribute(node, "data-surface");
        if (raw && !file.endsWith("/src/components/ui/surface.tsx")) {
          context.report({
            node: raw,
            message:
              "La superficie se marca con <Surface name=…>, no con data-surface a mano (§1.1).",
          });
        }
      },
      "Program:exit"(program) {
        if (page && !page[1].startsWith("(")) {
          context.report({
            node: program,
            message:
              "Toda pantalla va dentro de un grupo de rutas con superficie: (app), (marketplace), (marketing), (portal) o (interno) (§1.1).",
          });
        }
        if (page && page[1].startsWith("(")) {
          const group = page[1].split("/")[0];
          const layout = `${file.slice(0, file.indexOf("/src/app/"))}/src/app/${group}/layout.tsx`;
          if (!SURFACE_BY_GROUP[group]) {
            context.report({
              node: program,
              message: `El grupo ${group} no tiene superficie asignada. Sumalo a SURFACE_BY_GROUP en eslint-rules/lernio-design.mjs según §1.1.`,
            });
          } else if (!existsSync(layout)) {
            context.report({
              node: program,
              message: `El grupo ${group} no tiene layout.tsx: creálo con <Surface name="${SURFACE_BY_GROUP[group]}"> (§1.1).`,
            });
          }
        }
        if (groupLayout) {
          const expected = SURFACE_BY_GROUP[groupLayout[1]];
          const named = surfaces.map((node) => attribute(node, "name")?.value?.value);
          if (!expected) {
            context.report({
              node: program,
              message: `El grupo ${groupLayout[1]} no tiene superficie asignada. Sumalo a SURFACE_BY_GROUP en eslint-rules/lernio-design.mjs según §1.1.`,
            });
          } else if (!named.includes(expected)) {
            context.report({
              node: program,
              message: `El layout de ${groupLayout[1]} tiene que envolver todo en <Surface name="${expected}"> (§1.1).`,
            });
          }
        }
      },
    };
  },
};

const plugin = {
  meta: { name: "lernio-design" },
  rules: {
    color: classRule("color", "Colores solo por token (§2)"),
    forma: classRule("forma", "Radios con nombre, bordes de 1 px, sin sombras ni gradientes (§4)"),
    tipografia: classRule("tipografia", "Escala tipográfica y pesos del sistema (§3)"),
    semantica: classRule("semantica", "Rojo, estados y resaltador por sus componentes (§2.5)"),
    "tipografia-en-datos": tipografiaEnDatos,
    "alto-de-control": altoDeControl,
    "numeros-en-mono": numerosEnMono,
    resaltador,
    "un-primario": unPrimario,
    texto,
    superficie,
  },
};

export default plugin;
