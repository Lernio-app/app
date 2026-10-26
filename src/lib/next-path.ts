// Ruta a la que se vuelve después de ingresar. Solo rutas internas: evita que `next` mande a otro sitio.
export function safeNext(value: string | null | undefined, fallback = "/") {
  return value && value.startsWith("/") && !value.startsWith("//") && !value.includes("\\")
    ? value
    : fallback;
}
