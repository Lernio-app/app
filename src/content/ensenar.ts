// Textos del sitio para profes (/ensenar y /ensenar/[area]). Viven acá hasta que el panel interno
// los edite como páginas fijas (F15). Reglas de voz en docs/sistema-de-diseno.md y PRODUCT.md:
// voseo, ejemplos del oficio, sin exclamaciones, superlativos ni promesas académicas, y nada que no
// esté disponible. En apoyo escolar no aparecen nombres ni notas de alumnos.

import type { Area } from "@/components/ui/area";

export type AreaSlug = "idiomas" | "ingreso-universidad" | "apoyo-escolar" | "musica";

export type CasoDeUso = {
  titulo: string;
  texto: string;
  // Qué mini interfaz lo acompaña (components/expresivos/capturas.tsx).
  captura: CapturaArea;
};

export type CapturaArea =
  | "simulacro-first"
  | "speaking-audio"
  | "niveles-idiomas"
  | "simulacro-formulas"
  | "ejercicio-foto"
  | "grupo-ingreso"
  | "tarea-lengua"
  | "reporte-familia"
  | "consentimiento"
  | "escalas-audio"
  | "lenguaje-musical"
  | "horario-fijo";

export type PaginaArea = {
  slug: AreaSlug;
  area: Exclude<Area, "otra">;
  nombre: string;
  // Glifo del tile: texto en Bricolage, salvo música, que usa un ícono.
  glifo: string | null;
  tile: string;
  titulo: { antes: string; resaltado: string; despues: string };
  bajada: string;
  metaDescripcion: string;
  oficio: string[];
  casos: CasoDeUso[];
  materias: string[];
  niveles: string[];
  preguntas: { pregunta: string; respuesta: string }[];
};

export const PAGINAS_AREA: PaginaArea[] = [
  {
    slug: "idiomas",
    area: "idiomas",
    nombre: "Inglés e idiomas",
    glifo: "Aa",
    tile: "Del First a la conversación, con simulacros por parte.",
    titulo: {
      antes: "El Writing del First, entregado y corregido ",
      resaltado: "sin pasar por el chat",
      despues: ".",
    },
    bajada:
      "Para profes de inglés, portugués, francés, italiano, alemán y español para extranjeros. Armás simulacros por parte, recibís el Speaking en audio y llevás los cobros de cada alumno en pesos.",
    metaDescripcion:
      "Lernio para profes de idiomas: simulacros por parte con tiempo límite, Speaking en audio, IA que te propone preguntas y correcciones, y cobros en pesos.",
    oficio: [
      "el First",
      "el Speaking",
      "los phrasal verbs",
      "el CAE",
      "la conversación de los jueves",
    ],
    casos: [
      {
        titulo: "Simulacros por parte",
        texto:
          "Reading con tiempo límite, Use of English de opción múltiple que se corrige solo y un Writing que corregís vos. Con el plan pago, la IA te propone preguntas y una corrección; la nota la ponés vos.",
        captura: "simulacro-first",
      },
      {
        titulo: "El Speaking, en audio",
        texto:
          "Tu alumno graba la respuesta desde el celular y la entrega como tarea. La escuchás cuando podés y le dejás la devolución con nota y comentario.",
        captura: "speaking-audio",
      },
      {
        titulo: "Cada alumno en su nivel",
        texto:
          "Los niveles van de A1 a C2. Cada alumno lleva el suyo, y tus clases publicadas también: quien busca B2 te encuentra en B2.",
        captura: "niveles-idiomas",
      },
    ],
    materias: ["Inglés", "Portugués", "Francés", "Italiano", "Alemán", "Español para extranjeros"],
    niveles: ["A1", "A2", "B1", "B2", "C1", "C2"],
    preguntas: [
      {
        pregunta: "¿Trae los exámenes oficiales?",
        respuesta:
          "No. Los simulacros los armás vos, con las partes y el tiempo que quieras. Lernio no está asociado a Cambridge ni a ninguna institución que tome exámenes internacionales.",
      },
      {
        pregunta: "¿Sirve para grupos de conversación?",
        respuesta:
          "Sí. Una clase grupal lleva la asistencia de cada alumno y el cobro de cada uno, según el precio que le pusiste.",
      },
      {
        pregunta: "¿Puedo enseñar dos idiomas?",
        respuesta:
          "Sí. Marcás todas las materias que das, y si la misma persona toma dos idiomas con vos, figura una vez por materia, con su precio y su saldo.",
      },
    ],
  },
  {
    slug: "ingreso-universidad",
    area: "ingreso",
    nombre: "Ingreso y universidad",
    glifo: "f(x)",
    tile: "Del parcial de Análisis al final, con fórmulas en los exámenes.",
    titulo: {
      antes: "El parcial de Análisis, ",
      resaltado: "con fórmulas de verdad",
      despues: ".",
    },
    bajada:
      "Para profes de ingreso, CBC y materias de la facultad. Simulacros con fórmulas y tiempo límite, ejercicios hechos a mano que llegan en foto y grupos con la asistencia y el cobro de cada uno.",
    metaDescripcion:
      "Lernio para profes de ingreso y universidad: simulacros con fórmulas y tiempo límite, IA que te propone preguntas, entregas en foto y grupos de ingreso.",
    oficio: [
      "el parcial de Análisis",
      "el final de Física",
      "el ingreso a Medicina",
      "Álgebra del CBC",
      "el recuperatorio",
    ],
    casos: [
      {
        titulo: "Simulacros con fórmulas",
        texto:
          "Integrales, matrices y unidades escritas como corresponde. Opción múltiple y respuesta numérica que se corrigen solas, desarrollo que corregís vos, todo con tiempo límite.",
        captura: "simulacro-formulas",
      },
      {
        titulo: "El ejercicio en papel, en foto",
        texto:
          "El alumno resuelve en la hoja de siempre y entrega la foto. Vos la corregís desde el celular y le devolvés la nota con un comentario.",
        captura: "ejercicio-foto",
      },
      {
        titulo: "Grupos de ingreso",
        texto:
          "Una clase con cuatro alumnos es una sola clase en la agenda. Marcás quién vino y a cada uno se le genera su cargo.",
        captura: "grupo-ingreso",
      },
    ],
    materias: [
      "Análisis matemático",
      "Álgebra",
      "Física",
      "Química",
      "Estadística y probabilidad",
      "Anatomía y fisiología",
      "Biología",
      "Contabilidad",
      "Economía",
      "Programación",
      "Psicología",
      "Filosofía",
    ],
    niveles: ["Ingreso", "Universidad"],
    preguntas: [
      {
        pregunta: "¿Se pueden escribir fórmulas en las preguntas?",
        respuesta:
          "Sí, en el enunciado y en las opciones. El alumno ve la fórmula bien escrita, también desde el celular.",
      },
      {
        pregunta: "¿La IA me arma el simulacro?",
        respuesta:
          "Con el plan pago te propone preguntas desde un tema o un material que subís. Vos elegís cuáles van y las corregís antes de mandarlas.",
      },
      {
        pregunta: "¿Puedo cobrar distinto a cada alumno del grupo?",
        respuesta:
          "Sí. El precio es de cada alumno: por clase, por paquete o por mes. La clase grupal genera el cargo de cada uno según el suyo.",
      },
    ],
  },
  {
    slug: "apoyo-escolar",
    area: "apoyo",
    nombre: "Apoyo escolar",
    glifo: "abc",
    tile: "La tarea de Lengua al día y la familia al tanto con el reporte del mes.",
    titulo: {
      antes: "La tarea de Lengua al día y ",
      resaltado: "la familia al tanto",
      despues: ".",
    },
    bajada:
      "Para profes de primaria y secundaria. Tareas con foto, el reporte del mes para quien paga las clases y los avisos con el texto listo para el WhatsApp de la familia.",
    metaDescripcion:
      "Lernio para profes de apoyo escolar: tareas con foto, reporte mensual para la familia con un comentario que te propone la IA, y avisos listos para WhatsApp.",
    oficio: [
      "la tarea de Lengua",
      "las fracciones",
      "la prueba de Historia",
      "el análisis sintáctico",
      "la previa de Matemática",
    ],
    casos: [
      {
        titulo: "Tareas con foto",
        texto:
          "La consigna sale con el material adjunto y la entrega vuelve en foto o en PDF. Queda todo en la ficha del alumno, en vez de perdido en el chat de la familia.",
        captura: "tarea-lengua",
      },
      {
        titulo: "El reporte del mes",
        texto:
          "Asistencia, tareas entregadas y cómo viene, en un link para quien paga las clases. Lo abren sin cuenta. Con el plan pago, la IA te propone el comentario y vos lo editás.",
        captura: "reporte-familia",
      },
      {
        titulo: "Menores, con permiso de un adulto",
        texto:
          "Desde los 13 años, tu alumno tiene su cuenta cuando un adulto da el consentimiento desde un link. Si es más chico, trabajás igual y la familia recibe los avisos y el reporte.",
        captura: "consentimiento",
      },
    ],
    materias: [
      "Matemática",
      "Lengua y literatura",
      "Comprensión de textos y redacción",
      "Historia",
      "Geografía",
      "Física",
      "Química",
      "Biología",
      "Economía",
      "Programación",
      "Dibujo técnico",
      "Filosofía",
    ],
    niveles: ["Primaria", "Secundaria"],
    preguntas: [
      {
        pregunta: "¿La familia tiene que crearse una cuenta?",
        respuesta:
          "No. El responsable de pago recibe los avisos y el reporte del mes por link, sin cuenta.",
      },
      {
        pregunta: "¿Qué datos de los chicos se cargan?",
        respuesta:
          "Los que necesitás para dar la clase: nombre, materia y nivel. No se pide fecha de nacimiento ni se graban las clases. El detalle está en la política de privacidad.",
      },
      {
        pregunta: "¿Mis notas sobre un alumno las ve alguien más?",
        respuesta:
          "No. Tus notas son privadas: no las ve el alumno, ni la familia, ni el equipo de Lernio.",
      },
    ],
  },
  {
    slug: "musica",
    area: "musica",
    nombre: "Música",
    glifo: null,
    tile: "La práctica de escalas entre clase y clase, con entregas en audio.",
    titulo: {
      antes: "La práctica de escalas, ",
      resaltado: "en audio y entre clases",
      despues: ".",
    },
    bajada:
      "Para profes de piano, guitarra, canto, batería, violín y lenguaje musical. Tus alumnos te mandan cómo les sale, vos escuchás y devolvés, y la agenda y los cobros quedan en orden.",
    metaDescripcion:
      "Lernio para profes de música: entregas en audio, ejercicios de lenguaje musical, clases fijas semanales y cobros en pesos, desde el celular.",
    oficio: [
      "las escalas",
      "el arpegio de Do",
      "la lectura a primera vista",
      "el tema para el recital",
      "el compás de 6/8",
    ],
    casos: [
      {
        titulo: "La práctica, en audio",
        texto:
          "Tu alumno se graba tocando o cantando y lo entrega como tarea. Lo escuchás cuando podés y le dejás la devolución antes de la próxima clase.",
        captura: "escalas-audio",
      },
      {
        titulo: "Lenguaje musical con ejercicios",
        texto:
          "Intervalos, compases y lectura en preguntas de opción múltiple que se corrigen solas. Con el plan pago, la IA te propone las preguntas sobre el tema que estén viendo.",
        captura: "lenguaje-musical",
      },
      {
        titulo: "La clase de todos los martes",
        texto:
          "Cargás el horario fijo una vez y la agenda arma las próximas semanas. Si cancelan con tiempo, la clase no se cobra; si no, se cobra según tu regla.",
        captura: "horario-fijo",
      },
    ],
    materias: ["Piano", "Guitarra", "Canto", "Batería", "Violín", "Lenguaje musical"],
    niveles: ["Inicial", "Intermedio", "Avanzado"],
    preguntas: [
      {
        pregunta: "¿Mis alumnos pueden mandar video?",
        respuesta:
          "Por ahora no: las entregas son en audio, fotos, PDF o texto. El audio se graba en el momento, desde el celular.",
      },
      {
        pregunta: "¿Puedo dar clases presenciales?",
        respuesta:
          "Sí. En tus clases publicadas marcás si son online, presenciales o las dos, y la zona, sin tu dirección.",
      },
      {
        pregunta: "¿Qué pasa si un alumno cancela?",
        respuesta:
          "Definís cuántas horas antes se puede cancelar sin cargo. Lernio aplica esa regla cuando marcás la asistencia.",
      },
    ],
  },
];

export function paginaArea(slug: string): PaginaArea | undefined {
  return PAGINAS_AREA.find((pagina) => pagina.slug === slug);
}

// Prueba social. Todo lo que está entre corchetes es un placeholder: se reemplaza con frases reales
// de los primeros profes (hito A), con su permiso por escrito, y nunca se inventa. Mientras
// `pendiente` sea true, el sitio lo muestra marcado como pendiente.
export type Testimonio = {
  area: Exclude<Area, "otra">;
  frase: string;
  nombre: string;
  detalle: string;
  pendiente: boolean;
};

export const TESTIMONIOS: Testimonio[] = [
  {
    area: "idiomas",
    frase:
      "[Frase de un profe de inglés: qué dejó de hacer a mano desde que usa Lernio. Por ejemplo, cómo le llegan ahora los Writing.]",
    nombre: "[Nombre y apellido]",
    detalle: "[Profe de inglés · ciudad]",
    pendiente: true,
  },
  {
    area: "ingreso",
    frase:
      "[Frase de un profe de ingreso o universidad: cómo arma y corrige los simulacros, y qué le aportó la IA.]",
    nombre: "[Nombre y apellido]",
    detalle: "[Profe de Análisis · ciudad]",
    pendiente: true,
  },
  {
    area: "apoyo",
    frase:
      "[Frase de un profe de apoyo escolar: qué le dicen las familias del reporte del mes. Sin nombres de alumnos.]",
    nombre: "[Nombre y apellido]",
    detalle: "[Profe de apoyo escolar · ciudad]",
    pendiente: true,
  },
  {
    area: "musica",
    frase:
      "[Frase de un profe de música: qué cambió con las entregas en audio entre clase y clase.]",
    nombre: "[Nombre y apellido]",
    detalle: "[Profe de piano · ciudad]",
    pendiente: true,
  },
];

// Datos de uso reales, sacados de las métricas del panel interno. Placeholders hasta tenerlos.
export const DATOS_DE_USO = [
  { valor: "[N]", texto: "profes usan Lernio con sus alumnos" },
  { valor: "[N]", texto: "entregas corregidas el último mes" },
  { valor: "[N]", texto: "simulacros rendidos" },
];
