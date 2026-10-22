// Comprueba que cada regla del sistema de diseño detecta lo que tiene que detectar. Si alguien
// afloja una regla, este test lo muestra en el diff.
import path from "node:path";
import { RuleTester } from "eslint";
import { describe, it } from "vitest";
import plugin from "./lernio-design.mjs";

RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;

const tester = new RuleTester({
  languageOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

const file = (relative) => path.join(process.cwd(), relative);
const screen = file("src/app/(app)/cobros/page.tsx");
const primitive = file("src/components/ui/button.tsx");

tester.run("color", plugin.rules.color, {
  valid: [
    `<p className="text-ink-3 bg-paper border-line" />`,
    `<p className="text-debt hover:bg-indigo-soft text-primary-foreground" />`,
    `<p className="text-sm text-balance border-t border-dashed bg-cover ring-1" />`,
    `const label = "Debe 2 clases";`,
    { code: `<p className="bg-[#fff]" />`, filename: primitive },
  ],
  invalid: [
    { code: `<p className="text-red-500" />`, errors: 1 },
    { code: `<p className="bg-indigo-600" />`, errors: 1 },
    { code: `<p className="bg-[#4338f5]" />`, errors: 1 },
    { code: `<p className="hover:bg-muted/50" />`, errors: 1 },
    { code: `<p className="text-status-owed" />`, errors: 1 },
    { code: `const ITEM = "flex text-success";`, errors: 1 },
    { code: `cn("p-4", ok && "bg-black")`, errors: 1 },
  ],
});

tester.run("forma", plugin.rules.forma, {
  valid: [
    `<div className="rounded-card rounded-t-control rounded-full shadow-none border" />`,
    { code: `<div className="rounded-lg shadow-sm" />`, filename: primitive },
  ],
  invalid: [
    { code: `<div className="rounded-xl" />`, errors: 1 },
    { code: `<div className="rounded" />`, errors: 1 },
    { code: `<div className="shadow-md" />`, errors: 1 },
    { code: `<div className="bg-linear-to-r" />`, errors: 1 },
    { code: `<div className="backdrop-blur" />`, errors: 1 },
    { code: `<div className="border-2" />`, errors: 1 },
    { code: `<div className="animate-bounce" />`, errors: 1 },
  ],
});

tester.run("tipografia", plugin.rules.tipografia, {
  valid: [`<h1 className="title-page" />`, `<p className="num-kpi font-semibold text-sm" />`],
  invalid: [
    { code: `<h1 className="text-3xl" />`, errors: 1 },
    { code: `<p className="font-bold" />`, errors: 1 },
    { code: `<p className="font-display" />`, errors: 1 },
    { code: `<p className="text-[13px]" />`, errors: 1 },
  ],
});

tester.run("semantica", plugin.rules.semantica, {
  valid: [`<p className="text-debt" />`, `<p className="text-ok" />`],
  invalid: [
    { code: `<p className="text-error" />`, errors: 1 },
    { code: `<p className="text-destructive" />`, errors: 1 },
    { code: `<span className="bg-debt-bg" />`, errors: 1 },
    { code: `<span className="bg-highlighter" />`, errors: 1 },
  ],
});

tester.run("tipografia-en-datos", plugin.rules["tipografia-en-datos"], {
  valid: [`<h2 className="title-section" />`, `<p className="stat" />`],
  invalid: [
    { code: `<td className="title-card" />`, errors: 1 },
    { code: `<Button className="title-section" />`, errors: 1 },
  ],
});

tester.run("alto-de-control", plugin.rules["alto-de-control"], {
  valid: [
    `<Button className="w-full" />`,
    `<div className="h-11" />`,
    `cn(buttonVariants(), "shrink-0")`,
  ],
  invalid: [
    { code: `<Button className="h-11" />`, errors: 1 },
    { code: `<Input className="h-12 w-28" />`, errors: 1 },
    { code: `cn(buttonVariants(), "h-11 w-full")`, errors: 1 },
  ],
});

tester.run("numeros-en-mono", plugin.rules["numeros-en-mono"], {
  valid: [
    `<p className="num">{formatARS(x)}</p>`,
    `<p className="num-kpi text-debt">{formatARS(x)}</p>`,
    `<p className="num"><span>Pagó {formatARS(x)}</span></p>`,
    `<StatusChip status="debt">Debe {formatARS(x)}</StatusChip>`,
    `<p title={formatARS(x)}>Hola</p>`,
  ],
  invalid: [
    { code: `<p className="text-sm">{formatARS(x)}</p>`, errors: 1 },
    { code: `<p>{formatTime(a, tz)} a {formatTime(b, tz)}</p>`, errors: 2 },
  ],
});

tester.run("resaltador", plugin.rules.resaltador, {
  valid: [
    `<h1><Resaltador>Martes 21 de octubre</Resaltador></h1>`,
    `<PageHeader title={<Resaltador>{title}</Resaltador>} />`,
  ],
  invalid: [
    { code: `<h1><Resaltador>{formatARS(x)}</Resaltador></h1>`, errors: 1 },
    { code: `<Button><Resaltador>Pagar</Resaltador></Button>`, errors: 1 },
    { code: `<><Resaltador>uno</Resaltador><Resaltador>dos</Resaltador></>`, errors: 1 },
  ],
});

tester.run("un-primario", plugin.rules["un-primario"], {
  valid: [
    `<><Button>Guardar</Button><Button variant="secondary">Cancelar</Button></>`,
    `function A() { return ok ? <Button>Uno</Button> : <Button>Otro</Button>; }`,
    `function A() { if (ok) return <Button>Uno</Button>; return <Button>Otro</Button>; }`,
    `<a className={buttonVariants({ variant: "ghost" })} />`,
  ],
  invalid: [
    { code: `<><Button>Guardar</Button><Button>Enviar</Button></>`, errors: 1 },
    { code: `<><Button>Guardar</Button><a className={buttonVariants()} /></>`, errors: 1 },
    {
      code: `function A() { return <Button>Uno</Button>; } function B() { return <Button>Dos</Button>; }`,
      errors: 1,
    },
    { code: `<ul>{rows.map((r) => <Button key={r}>Avisar</Button>)}</ul>`, errors: 1 },
  ],
});

tester.run("texto", plugin.rules.texto, {
  valid: [
    { code: `<p>Todavía no cargaste alumnos.</p>`, filename: screen },
    { code: `<p>Debe 2 clases</p>`, filename: screen },
    { code: `const m = "Hola 👋";`, filename: file("src/lib/messages.ts") },
    { code: `<p className="!p-0">Podés editarlo</p>`, filename: screen },
  ],
  invalid: [
    { code: `<p>Alumnos morosos</p>`, filename: screen, errors: 1 },
    { code: `<p>¡Listo!</p>`, filename: screen, errors: 1 },
    { code: `<p>Listo 🎉</p>`, filename: screen, errors: 1 },
    { code: `<Input placeholder="Puedes escribir acá" />`, filename: screen, errors: 1 },
    { code: `const e = "Error: no se pudo guardar";`, filename: screen, errors: 1 },
    { code: `const m = "Hola 👋🎉";`, filename: file("src/lib/messages.ts"), errors: 1 },
    { code: `<p>Los mejores profes</p>`, filename: screen, errors: 1 },
  ],
});

tester.run("superficie", plugin.rules.superficie, {
  valid: [
    { code: `export default function P() { return null; }`, filename: screen },
    {
      code: `export default function L({ children }) { return <Surface name="app">{children}</Surface>; }`,
      filename: file("src/app/(app)/layout.tsx"),
    },
  ],
  invalid: [
    {
      code: `export default function P() { return null; }`,
      filename: file("src/app/clases/page.tsx"),
      errors: 1,
    },
    {
      code: `export default function P() { return null; }`,
      filename: file("src/app/(nuevo)/x/page.tsx"),
      errors: 1,
    },
    {
      code: `export default function P() { return null; }`,
      filename: file("src/app/(marketing)/page.tsx"),
      errors: 1,
    },
    {
      code: `export default function L({ children }) { return <div>{children}</div>; }`,
      filename: file("src/app/(app)/layout.tsx"),
      errors: 1,
    },
    {
      code: `export default function L({ children }) { return <Surface name="marketing">{children}</Surface>; }`,
      filename: file("src/app/(portal)/layout.tsx"),
      errors: 1,
    },
    { code: `<div data-surface="app" />`, filename: screen, errors: 1 },
  ],
});
