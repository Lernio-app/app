// Resaltador (§5.2). Máximo uno por pantalla, solo en la frase clave de un título, la fecha o el mes
// de la pantalla y una frase del comentario del profe. Nunca en montos, estados, botones ni links:
// por eso solo acepta texto (el lint lernio/resaltador controla el resto).
export function Resaltador({ children }: { children: string }) {
  return <span className="resaltador">{children}</span>;
}
