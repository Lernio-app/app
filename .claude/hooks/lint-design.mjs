// Hook de Claude Code: después de cada edición en src/ corre el lint (con las reglas del sistema de
// diseño) sobre el archivo tocado. Si falla, sale con código 2 y el agente recibe los errores para
// corregirlos antes de seguir. Si se toca globals.css, corre el test de tokens.
import { execSync } from "node:child_process";
import path from "node:path";

let input = "";
for await (const chunk of process.stdin) input += chunk;

const filePath = JSON.parse(input || "{}").tool_input?.file_path;
if (!filePath) process.exit(0);

const root = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
const relative = path.relative(root, path.resolve(root, filePath)).replaceAll("\\", "/");

const run = (command) => {
  try {
    execSync(command, { cwd: root, encoding: "utf8", stdio: "pipe" });
  } catch (error) {
    process.stderr.write(
      `Sistema de diseño (docs/sistema-de-diseno.md): corregí esto antes de seguir.\n${error.stdout ?? ""}${error.stderr ?? ""}`,
    );
    process.exit(2);
  }
};

if (/^src\/.+\.(ts|tsx)$/.test(relative) || /^eslint-rules\/.+\.mjs$/.test(relative)) {
  run(`npx eslint --max-warnings 0 "${relative}"`);
}
if (relative === "src/app/globals.css") {
  run("npx vitest run src/design");
}
