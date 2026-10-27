// Inicio del profe. La home pública (`/`) es el marketplace; el sistema vive bajo `/app`.
export const APP_HOME = "/app";

// Ruta a la que se vuelve después de ingresar. Solo rutas internas: evita que `next` mande a otro sitio.
export function safeNext(value: string | null | undefined, fallback = APP_HOME) {
  return value && value.startsWith("/") && !value.startsWith("//") && !value.includes("\\")
    ? value
    : fallback;
}
