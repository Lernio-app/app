// DATOS DE EJEMPLO del marketplace. Sirven para ver las pantallas con contenido y con sus estados;
// no son clases ni profes reales. Cuando se conecte F11, las pantallas leen la vista pública de
// publicaciones y de perfiles, y este archivo se borra. Las áreas, materias y niveles son los de
// la lista cerrada (§12.13 y §12.5 de la especificación).

import type {
  AreaSlug,
  NivelesPorArea,
  PerfilProfe,
  Publicacion,
} from "@/lib/marketplace";

export type AreaDelSitio = {
  slug: AreaSlug;
  nombre: string;
  // Frase corta del tile de la home.
  tile: string;
  glifo: string | null;
  materias: string[];
  presentacion: string;
  preguntas: { pregunta: string; respuesta: string }[];
};

export const AREAS_DEL_SITIO: AreaDelSitio[] = [
  {
    slug: "idiomas",
    nombre: "Inglés e idiomas",
    tile: "Del First a la conversación.",
    glifo: "Aa",
    materias: ["Inglés", "Portugués", "Francés", "Italiano", "Alemán", "Español para extranjeros"],
    presentacion:
      "Clases particulares de idiomas, online o cerca tuyo: preparación de exámenes internacionales, conversación y apoyo para el colegio o el trabajo.",
    preguntas: [
      {
        pregunta: "¿Cómo sé qué nivel tengo?",
        respuesta:
          "Cada clase indica el nivel al que apunta, de A1 a C2. Si no sabés cuál es el tuyo, contáselo al profe en la consulta y te orienta.",
      },
      {
        pregunta: "¿Puedo preparar un examen internacional?",
        respuesta:
          "Sí. Buscá el nombre del examen en el buscador: los profes lo ponen en el título de su clase.",
      },
    ],
  },
  {
    slug: "ingreso-universidad",
    nombre: "Ingreso y universidad",
    tile: "El parcial, el final y el ingreso.",
    glifo: "∑",
    materias: [
      "Matemática",
      "Física",
      "Química",
      "Biología",
      "Álgebra",
      "Análisis matemático",
      "Estadística y probabilidad",
      "Anatomía y fisiología",
      "Contabilidad",
      "Psicología",
      "Programación",
      "Economía",
    ],
    presentacion:
      "Clases para llegar al ingreso, rendir un parcial o recursar una materia, con profes que conocen la cursada.",
    preguntas: [
      {
        pregunta: "¿Hay clases grupales?",
        respuesta:
          "Algunos profes dan clases en grupo, con cupo. En cada clase figura el formato y el tamaño máximo.",
      },
      {
        pregunta: "¿Puedo consultar por una materia puntual?",
        respuesta:
          "Sí. Buscá por el nombre de la materia o de la cátedra: los profes lo mencionan en la descripción.",
      },
    ],
  },
  {
    slug: "apoyo-escolar",
    nombre: "Apoyo escolar",
    tile: "La tarea y el colegio.",
    glifo: "Ab",
    materias: [
      "Matemática",
      "Lengua y literatura",
      "Comprensión de textos y redacción",
      "Física",
      "Química",
      "Biología",
      "Historia",
      "Geografía",
      "Dibujo técnico",
      "Filosofía",
    ],
    presentacion:
      "Apoyo para primaria y secundaria. Si la clase es para tu hijo o hija, la consulta la hacés vos con tu cuenta: no pedimos datos del menor.",
    preguntas: [
      {
        pregunta: "Si la clase es para mi hijo, ¿tengo que cargar sus datos?",
        respuesta:
          "No. Consultás vos, con tu cuenta, y marcás que es para tu hijo o hija. Si arrancan, el profe le arma su lugar con tu consentimiento.",
      },
      {
        pregunta: "¿Dónde se dan las clases?",
        respuesta:
          "Depende del profe: online, en su casa o en la tuya. Cada clase lo aclara en la línea de datos.",
      },
    ],
  },
  {
    slug: "musica",
    nombre: "Música",
    tile: "Piano, guitarra, canto y más.",
    glifo: null,
    materias: ["Piano", "Guitarra", "Canto", "Batería", "Violín", "Lenguaje musical"],
    presentacion:
      "Clases de instrumento y de canto para empezar o retomar, con la práctica de la semana siguiendo al profe.",
    preguntas: [
      {
        pregunta: "¿Necesito tener el instrumento?",
        respuesta:
          "Depende de la clase. El profe lo aclara en la descripción; si no, preguntáselo en la consulta.",
      },
      {
        pregunta: "¿Se puede aprender online?",
        respuesta:
          "Sí, hay clases online. Filtrá por modalidad para ver solo esas.",
      },
    ],
  },
];

export const NIVELES: NivelesPorArea = {
  idiomas: ["A1", "A2", "B1", "B2", "C1", "C2"],
  "ingreso-universidad": ["Ingreso", "Universidad"],
  "apoyo-escolar": ["Primaria", "Secundaria"],
  musica: ["Inicial", "Intermedio", "Avanzado"],
};

export const ZONAS = [
  "Almagro",
  "Belgrano",
  "Caballito",
  "Palermo",
  "Recoleta",
  "Villa Crespo",
  "Vicente López",
];

export const BUSQUEDAS_FRECUENTES = [
  "First",
  "Ingreso a medicina",
  "Análisis I",
  "Lengua secundaria",
  "Guitarra",
  "Portugués",
];

export const PERFILES: PerfilProfe[] = [
  {
    slug: "valentina-rios",
    nombre: "Valentina Ríos",
    area: "idiomas",
    materias: ["Inglés"],
    modalidades: ["online", "presencial"],
    zona: "Palermo",
    bio: "Profesora de inglés. Preparo exámenes internacionales y doy conversación para el trabajo. Las clases son en inglés desde el primer día, con material que armo para cada alumno.",
  },
  {
    slug: "martin-acosta",
    nombre: "Martín Acosta",
    area: "ingreso-universidad",
    materias: ["Álgebra", "Análisis matemático"],
    modalidades: ["online"],
    bio: "Licenciado en Matemática. Acompaño a quienes cursan materias de matemática en la universidad: resolvemos guías y repasamos antes de cada parcial.",
  },
  {
    slug: "lucia-ferraro",
    nombre: "Lucía Ferraro",
    area: "apoyo-escolar",
    materias: ["Lengua y literatura", "Comprensión de textos y redacción"],
    modalidades: ["online", "presencial"],
    zona: "Caballito",
    bio: "Profesora de Lengua y Literatura. Trabajo con chicos de secundaria la comprensión de textos, la escritura y la preparación de evaluaciones.",
  },
  {
    slug: "nicolas-bravo",
    nombre: "Nicolás Bravo",
    area: "musica",
    materias: ["Guitarra"],
    modalidades: ["presencial"],
    zona: "Villa Crespo",
    bio: "Guitarrista y docente. Doy clases de guitarra a quienes empiezan y a quienes retoman, con repertorio que elegimos juntos.",
  },
  {
    slug: "camila-sosa",
    nombre: "Camila Sosa",
    area: "idiomas",
    materias: ["Portugués"],
    modalidades: ["online"],
    bio: "Profesora de portugués. Clases de conversación y de preparación para viajar o trabajar con Brasil.",
  },
  {
    slug: "federico-lemos",
    nombre: "Federico Lemos",
    area: "apoyo-escolar",
    materias: ["Matemática", "Física"],
    modalidades: ["online", "presencial"],
    zona: "Belgrano",
    bio: "Profesor de Matemática y Física. Ayudo a chicos de secundaria a entender los temas, no solo a resolver la guía.",
  },
];

const COMO = {
  online: "Online, por el Meet o Zoom del profe",
  presencial: "En el domicilio del profe o en el tuyo, a coordinar",
};

export const PUBLICACIONES: Publicacion[] = [
  {
    slug: "preparacion-first",
    titulo: "Preparación First",
    area: "idiomas",
    materia: "Inglés",
    nivel: "B2",
    modalidades: ["online", "presencial"],
    zona: "Palermo",
    formato: { tipo: "individual" },
    duracionMin: 60,
    precio: 1800000,
    paquete: { clases: 4, precio: 6400000 },
    disponibilidad: { M: ["tarde"], J: ["tarde"], S: ["manana"] },
    profe: "valentina-rios",
    publicada: "2026-10-26",
    descripcion:
      "Preparación para el First Certificate: las cuatro partes del examen, con práctica de Writing y Speaking en cada clase.",
    trabajo: [
      "Use of English y vocabulario del examen",
      "Writing: ensayos, informes y cartas con corrección",
      "Speaking: práctica de las cuatro partes",
      "Listening y Reading con simulacros cronometrados",
    ],
    comoSon: {
      frecuencia: "Una o dos veces por semana",
      plataforma: COMO.online,
      materiales: "Los arma la profe a partir del nivel de cada alumno",
      tareasEnPortal: true,
    },
  },
  {
    slug: "conversacion-en-ingles",
    titulo: "Conversación en inglés para el trabajo",
    area: "idiomas",
    materia: "Inglés",
    nivel: "C1",
    modalidades: ["online"],
    formato: { tipo: "individual" },
    duracionMin: 45,
    precio: 1500000,
    disponibilidad: { L: ["noche"], X: ["noche"], V: ["manana"] },
    profe: "valentina-rios",
    publicada: "2026-10-12",
    descripcion:
      "Clases para hablar con fluidez en reuniones, presentaciones y entrevistas. Partimos de situaciones reales de tu trabajo.",
    trabajo: [
      "Reuniones y presentaciones",
      "Entrevistas de trabajo en inglés",
      "Vocabulario de tu industria",
    ],
    comoSon: {
      frecuencia: "Una vez por semana",
      plataforma: COMO.online,
      materiales: "Los define el profe con vos en la primera clase",
      tareasEnPortal: false,
    },
  },
  {
    slug: "portugues-para-viajar",
    titulo: "Portugués desde cero",
    area: "idiomas",
    materia: "Portugués",
    nivel: "A1",
    modalidades: ["online"],
    formato: { tipo: "grupal", cupo: 5 },
    duracionMin: 60,
    precio: 900000,
    precioDesde: true,
    paquete: { clases: 8, precio: 6800000 },
    disponibilidad: { L: ["noche"], X: ["noche"] },
    profe: "camila-sosa",
    publicada: "2026-10-20",
    descripcion:
      "Un grupo chico para empezar portugués: pronunciación, vocabulario cotidiano y las primeras conversaciones.",
    trabajo: ["Pronunciación y escucha", "Vocabulario para viajar", "Primeras conversaciones"],
    comoSon: {
      frecuencia: "Dos veces por semana",
      plataforma: COMO.online,
      materiales: "Material propio de la profe, que llega por la plataforma",
      tareasEnPortal: false,
    },
  },
  {
    slug: "algebra-para-el-parcial",
    titulo: "Álgebra: guías y parcial",
    area: "ingreso-universidad",
    materia: "Álgebra",
    nivel: "Universidad",
    modalidades: ["online"],
    formato: { tipo: "individual" },
    duracionMin: 90,
    precio: 2200000,
    paquete: { clases: 4, precio: 8000000 },
    disponibilidad: { M: ["noche"], J: ["noche"], D: ["tarde"] },
    profe: "martin-acosta",
    publicada: "2026-10-24",
    descripcion:
      "Resolvemos las guías de la cursada y repasamos antes del parcial. Traé tus dudas y las trabajamos desde ahí.",
    trabajo: [
      "Matrices y sistemas de ecuaciones",
      "Espacios vectoriales y transformaciones lineales",
      "Autovalores y diagonalización",
      "Resolución de parciales anteriores",
    ],
    comoSon: {
      frecuencia: "Según la fecha de tus parciales",
      plataforma: COMO.online,
      materiales: "Las guías de tu cátedra y ejercicios que suma el profe",
      tareasEnPortal: true,
    },
  },
  {
    slug: "analisis-matematico-1",
    titulo: "Análisis matemático I",
    area: "ingreso-universidad",
    materia: "Análisis matemático",
    nivel: "Universidad",
    modalidades: ["online"],
    formato: { tipo: "grupal", cupo: 4 },
    duracionMin: 90,
    precio: 1200000,
    disponibilidad: { L: ["tarde"], V: ["tarde"] },
    profe: "martin-acosta",
    publicada: "2026-10-05",
    descripcion:
      "Un grupo reducido para cursar Análisis I: límites, derivadas e integrales con ejercicios de cada clase.",
    trabajo: ["Límites y continuidad", "Derivadas y aplicaciones", "Integrales"],
    comoSon: {
      frecuencia: "Dos veces por semana",
      plataforma: COMO.online,
      materiales: "Las guías de la cátedra",
      tareasEnPortal: true,
    },
  },
  {
    slug: "lengua-secundaria",
    titulo: "Lengua: comprensión y escritura",
    area: "apoyo-escolar",
    materia: "Lengua y literatura",
    nivel: "Secundaria",
    modalidades: ["online", "presencial"],
    zona: "Caballito",
    formato: { tipo: "individual" },
    duracionMin: 60,
    precio: 1400000,
    paquete: { clases: 4, precio: 5000000 },
    disponibilidad: { L: ["tarde"], X: ["tarde"], V: ["tarde"] },
    profe: "lucia-ferraro",
    publicada: "2026-10-22",
    descripcion:
      "Acompañamiento en Lengua y Literatura: lectura de las obras del año, escritura y preparación de evaluaciones.",
    trabajo: [
      "Comprensión de textos",
      "Escritura de textos argumentativos",
      "Lectura de las obras del año",
      "Preparación de evaluaciones",
    ],
    comoSon: {
      frecuencia: "Una o dos veces por semana",
      plataforma: COMO.online,
      materiales: "Los textos de la escuela y material extra",
      tareasEnPortal: true,
    },
  },
  {
    slug: "redaccion-y-estudio",
    titulo: "Técnicas de estudio y redacción",
    area: "apoyo-escolar",
    materia: "Comprensión de textos y redacción",
    nivel: "Secundaria",
    modalidades: ["online"],
    formato: { tipo: "individual" },
    duracionMin: 45,
    precio: 1200000,
    disponibilidad: { M: ["tarde"], J: ["tarde"] },
    profe: "lucia-ferraro",
    publicada: "2026-09-30",
    descripcion:
      "Aprender a resumir, subrayar y organizar el estudio para cualquier materia del colegio.",
    trabajo: ["Resumen y esquema", "Organización del estudio", "Redacción de respuestas"],
    comoSon: {
      frecuencia: "Una vez por semana",
      plataforma: COMO.online,
      materiales: "Con tus propias carpetas y apuntes",
      tareasEnPortal: false,
    },
  },
  {
    slug: "matematica-secundaria",
    titulo: "Matemática de secundaria",
    area: "apoyo-escolar",
    materia: "Matemática",
    nivel: "Secundaria",
    modalidades: ["online", "presencial"],
    zona: "Belgrano",
    formato: { tipo: "individual" },
    duracionMin: 60,
    precio: 1300000,
    disponibilidad: { M: ["tarde", "noche"], J: ["tarde", "noche"] },
    profe: "federico-lemos",
    publicada: "2026-10-18",
    descripcion:
      "Entender los temas del año para dejar de depender de la guía: funciones, ecuaciones y geometría.",
    trabajo: ["Funciones y ecuaciones", "Geometría", "Preparación de pruebas"],
    comoSon: {
      frecuencia: "Una o dos veces por semana",
      plataforma: COMO.online,
      materiales: "La carpeta del colegio y ejercicios extra",
      tareasEnPortal: false,
    },
  },
  {
    slug: "fisica-secundaria",
    titulo: "Física: del problema a la idea",
    area: "apoyo-escolar",
    materia: "Física",
    nivel: "Secundaria",
    modalidades: ["online"],
    formato: { tipo: "grupal", cupo: 4 },
    duracionMin: 60,
    precio: 800000,
    disponibilidad: { S: ["manana"] },
    profe: "federico-lemos",
    publicada: "2026-09-14",
    descripcion:
      "Un grupo chico para aprender Física: cinemática, dinámica y energía, con ejercicios resueltos en conjunto.",
    trabajo: ["Cinemática", "Dinámica", "Energía y trabajo"],
    comoSon: {
      frecuencia: "Una vez por semana",
      plataforma: COMO.online,
      materiales: "Ejercicios del profe",
      tareasEnPortal: false,
    },
  },
  {
    slug: "guitarra-para-empezar",
    titulo: "Guitarra para empezar",
    area: "musica",
    materia: "Guitarra",
    nivel: "Inicial",
    modalidades: ["presencial"],
    zona: "Villa Crespo",
    formato: { tipo: "individual" },
    duracionMin: 60,
    precio: 1600000,
    paquete: { clases: 4, precio: 5800000 },
    disponibilidad: { L: ["tarde"], X: ["tarde"], S: ["manana", "tarde"] },
    profe: "nicolas-bravo",
    publicada: "2026-10-25",
    descripcion:
      "Primeros acordes, ritmo y las canciones que más te gusten. Alcanza con una guitarra criolla o acústica.",
    trabajo: [
      "Postura y afinación",
      "Acordes abiertos y cambios",
      "Rasguidos y ritmo",
      "Canciones que elegís vos",
    ],
    comoSon: {
      frecuencia: "Una vez por semana",
      plataforma: COMO.presencial,
      materiales: "Alcanza con tu guitarra; las partituras las pone el profe",
      tareasEnPortal: false,
    },
  },
  {
    slug: "guitarra-intermedia",
    titulo: "Guitarra: improvisación y armonía",
    area: "musica",
    materia: "Guitarra",
    nivel: "Intermedio",
    modalidades: ["presencial"],
    zona: "Villa Crespo",
    formato: { tipo: "individual" },
    duracionMin: 60,
    precio: 1800000,
    disponibilidad: { M: ["noche"], J: ["noche"] },
    profe: "nicolas-bravo",
    publicada: "2026-10-01",
    descripcion:
      "Para quien ya toca y quiere entender la armonía: escalas, arpegios e improvisación sobre canciones.",
    trabajo: ["Escalas y arpegios", "Armonía funcional", "Improvisación"],
    comoSon: {
      frecuencia: "Una vez por semana",
      plataforma: COMO.presencial,
      materiales: "Partituras y backing tracks del profe",
      tareasEnPortal: false,
    },
  },
];

export type EntradaDelBlog = {
  slug: string;
  titulo: string;
  bajada: string;
  area: AreaSlug;
  materia: string;
  fecha: string;
  parrafos: string[];
};

export const ENTRADAS: EntradaDelBlog[] = [
  {
    slug: "como-elegir-profe-de-ingles",
    titulo: "Cómo elegir profe de inglés para un examen internacional",
    bajada: "Qué mirar en una clase antes de consultar, y qué preguntarle al profe.",
    area: "idiomas",
    materia: "Inglés",
    fecha: "2026-10-20",
    parrafos: [
      "Antes de consultar, fijate el nivel al que apunta la clase y si el título menciona el examen que querés rendir. Un profe que prepara el First no trabaja igual que uno de conversación.",
      "Mirá también la disponibilidad: los horarios son aproximados, pero te dicen si el profe da clases cuando vos podés.",
      "En la consulta contá la fecha de tu examen y qué parte te cuesta más. Con eso el profe te puede decir cómo organizaría las clases.",
    ],
  },
  {
    slug: "que-preguntar-antes-de-la-primera-clase",
    titulo: "Qué preguntar antes de la primera clase",
    bajada: "Cinco preguntas para la consulta, para que la primera clase arranque con lo claro.",
    area: "apoyo-escolar",
    materia: "Matemática",
    fecha: "2026-10-08",
    parrafos: [
      "La consulta es el lugar para sacar las dudas antes de arrancar: cómo son las clases, qué material se usa y cómo se paga.",
      "Contale al profe en qué año está el chico o la chica y qué temas le cuestan. Cuanto más concreto, mejor puede responderte.",
      "El pago lo arreglás con el profe: alias, transferencia o efectivo. En Lernio no se paga.",
    ],
  },
];

export function publicacionPorSlug(slug: string) {
  return PUBLICACIONES.find((publicacion) => publicacion.slug === slug);
}

export function perfilPorSlug(slug: string) {
  return PERFILES.find((perfil) => perfil.slug === slug);
}

export function areaPorSlug(slug: string) {
  return AREAS_DEL_SITIO.find((area) => area.slug === slug);
}
