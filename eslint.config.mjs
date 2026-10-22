import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import lernio from "./eslint-rules/lernio-design.mjs";

// Qué carpeta de componentes puede usar cada superficie (docs/sistema-de-diseno.md, "Superficies").
const COMPONENT_LIMITS = {
  app: {
    group: ["@/components/app/*", "**/components/app/*"],
    message: "components/app es de las superficies app, portal e interno.",
  },
  marketplace: {
    group: ["@/components/marketplace/*", "**/components/marketplace/*"],
    message:
      "components/marketplace es del marketplace (y de la vista previa de una clase en la app).",
  },
  expresivos: {
    group: ["@/components/expresivos/*", "**/components/expresivos/*"],
    message:
      "Los componentes expresivos (stickers, banda, tiles) van solo en marketing y en la home del marketplace.",
  },
};

// Íconos: solo Lucide (§5.4).
const ICON_LIBRARIES = [
  "react-icons",
  "@heroicons/react",
  "@radix-ui/react-icons",
  "@tabler/icons-react",
  "@phosphor-icons/react",
  "phosphor-react",
].map((name) => ({ name, message: "Los íconos son de lucide-react (§5.4)." }));

function importsFor(...allowed) {
  return {
    "no-restricted-imports": [
      "error",
      {
        paths: ICON_LIBRARIES,
        patterns: Object.entries(COMPONENT_LIMITS)
          .filter(([surface]) => !allowed.includes(surface))
          .map(([, limit]) => limit),
      },
    ],
  };
}

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  // Sistema de diseño
  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: { lernio },
    // Sin excepciones en línea: si algo necesita una, va acá abajo con su motivo.
    linterOptions: { noInlineConfig: true },
    rules: {
      "lernio/color": "error",
      "lernio/forma": "error",
      "lernio/tipografia": "error",
      "lernio/semantica": "error",
      "lernio/tipografia-en-datos": "error",
      "lernio/alto-de-control": "error",
      "lernio/numeros-en-mono": "error",
      "lernio/resaltador": "error",
      "lernio/un-primario": "error",
      "lernio/texto": "error",
      "lernio/superficie": "error",
      ...importsFor(),
    },
  },
  { files: ["src/app/\\(app\\)/**"], rules: importsFor("app", "marketplace") },
  {
    files: ["src/app/\\(onboarding\\)/**", "src/app/\\(portal\\)/**", "src/app/\\(interno\\)/**"],
    rules: importsFor("app"),
  },
  { files: ["src/app/\\(marketplace\\)/**"], rules: importsFor("marketplace") },
  { files: ["src/app/\\(marketplace\\)/page.tsx"], rules: importsFor("marketplace", "expresivos") },
  { files: ["src/app/\\(marketing\\)/**"], rules: importsFor("expresivos") },
  { files: ["src/components/app/**"], rules: importsFor("app") },
  { files: ["src/components/marketplace/**"], rules: importsFor("marketplace") },
  { files: ["src/components/expresivos/**"], rules: importsFor("expresivos") },

  // Excepciones, con su motivo.
  {
    // Los tests pueden nombrar lo prohibido para comprobar que no aparece.
    files: ["src/**/*.test.ts"],
    rules: { "lernio/texto": "off" },
  },
  {
    // La meta theme-color no puede leer variables CSS; tokens.test.ts verifica que coincida con --indigo.
    files: ["src/design/**"],
    rules: { "lernio/color": "off" },
  },

  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
