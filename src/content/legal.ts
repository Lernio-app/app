// Términos y privacidad, versión 0: borrador genérico para el hito A, hasta tener los textos
// definitivos (F10) revisados por un asesor legal. Si el texto cambia, sube `LEGAL_VERSION`.
// Lo que está entre corchetes falta completar.

export type LegalItem = { lead?: string; text: string };
export type LegalSection = { heading: string; paragraphs?: string[]; items?: LegalItem[] };
export type LegalDocument = { title: string; notice: string; sections: LegalSection[] };

export const TERMS: LegalDocument = {
  title: "Términos y condiciones",
  notice:
    "Borrador genérico, hasta tener los textos definitivos revisados por un asesor legal. Lernio es un nombre provisional.",
  sections: [
    {
      heading: "1. Qué es Lernio",
      paragraphs: [
        "Lernio es una herramienta para profes particulares: alumnos, agenda, cobros, tareas, exámenes y reportes en un solo lugar. También tiene un sitio público donde los profes publican sus clases y los interesados les hacen consultas.",
        "Lernio no da clases, no cobra las clases ni cobra comisión. Lo que acuerden un profe y su alumno (horarios, precio y pago) es entre ellos.",
      ],
    },
    {
      heading: "2. Tu cuenta",
      items: [
        {
          text: "Entrás con tu email o con Google, sin contraseña. Cuidá el acceso a tu email: quien entra a tu email puede entrar a tu cuenta.",
        },
        { text: "Tenés una sola cuenta, aunque tengas clases con varios profes." },
        {
          text: "Los menores de 13 años no tienen cuenta. Entre los 13 y los 18, la cuenta se activa solo con el consentimiento de un adulto responsable.",
        },
      ],
    },
    {
      heading: "3. Si sos profe",
      items: [
        {
          text: "Sos responsable de los datos que cargás de tus alumnos y de sus familias, y de tenerlos con su conocimiento.",
        },
        {
          text: "Lo que publicás en el sitio tiene que ser cierto y tuyo. No se pueden publicar teléfonos, emails ni redes en el texto de una publicación.",
        },
        {
          text: "Lernio puede despublicar una publicación o suspender una cuenta si se usa para engañar, acosar o algo ilegal.",
        },
        {
          text: "El plan gratis admite 1 alumno. Para más alumnos o para usar la IA hace falta el plan pago, con las condiciones que se informen al contratarlo.",
        },
        { text: "Lo que propone la IA es un borrador: lo revisás y decidís vos." },
      ],
    },
    {
      heading: "4. Si sos alumno o consultás a un profe",
      items: [
        {
          text: "Consultar no tiene costo. Mientras es una consulta, el profe ve tu nombre, no tu email ni tu teléfono. Si te suma como alumno, ve tu email y tu teléfono.",
        },
        { text: "Lo que escribís en una conversación lo ven vos y el profe." },
      ],
    },
    {
      heading: "5. Soporte",
      paragraphs: [
        "Para resolver problemas, el equipo de Lernio puede ver un espacio como lo ve el profe y, en casos puntuales, actuar en él. Queda registrado y el profe puede ver esos accesos en Ajustes. El equipo nunca ve las notas privadas del profe.",
      ],
    },
    {
      heading: "6. Disponibilidad",
      paragraphs: [
        "Lernio está en desarrollo. Puede tener errores o interrupciones, y algunas funciones pueden cambiar. Avisamos los cambios importantes de estos términos antes de que rijan.",
      ],
    },
    { heading: "7. Contacto", paragraphs: ["[email de contacto]"] },
  ],
};

export const PRIVACY: LegalDocument = {
  title: "Política de privacidad",
  notice:
    "Borrador genérico, hasta tener los textos definitivos revisados por un asesor legal (Ley 25.326 de Protección de Datos Personales). Lernio es un nombre provisional.",
  sections: [
    {
      heading: "1. Quién trata tus datos",
      paragraphs: [
        "[Razón social o nombre del responsable], con domicilio en [domicilio], es responsable de la base de datos de Lernio. Contacto: [email de contacto].",
      ],
    },
    {
      heading: "2. Qué datos guardamos",
      items: [
        { lead: "De tu cuenta:", text: "nombre, email y, si lo cargás, teléfono." },
        {
          lead: "Si sos profe:",
          text: "los datos de tu espacio (alias, link de pago y reglas) y los que cargás de tus alumnos y sus familias: nombre, contacto, clases, asistencia, cobros, tareas, exámenes y notas.",
        },
        {
          lead: "Si sos alumno:",
          text: "lo que entregás, tus respuestas y tus resultados, y tus conversaciones con tus profes.",
        },
        { lead: "Si consultás a un profe:", text: "tu consulta y la conversación." },
        { lead: "Si escribís por Contacto:", text: "tu nombre, tu contacto y tu mensaje." },
        {
          lead: "De uso:",
          text: "qué funciones se usan y cuándo, para mejorar el producto.",
        },
      ],
    },
    {
      heading: "3. Para qué los usamos",
      paragraphs: [
        "Para que la herramienta funcione, para avisarte lo que pasa en tu cuenta, para dar soporte y para medir el uso. No vendemos datos ni los usamos para publicidad de terceros.",
      ],
    },
    {
      heading: "4. Menores",
      paragraphs: [
        "Un menor de 13 años no tiene cuenta. Entre los 13 y los 18, la cuenta se activa solo con el consentimiento de un adulto responsable, que queda registrado y se puede retirar. Nunca mostramos datos de menores en el sitio.",
      ],
    },
    {
      heading: "5. Con quién se comparten",
      items: [
        {
          lead: "Entre profe y alumno:",
          text: "cada profe ve los datos de sus alumnos. Mientras es una consulta, el profe ve el nombre de quien consulta, no su email ni su teléfono.",
        },
        {
          lead: "Proveedores",
          text: "que nos dan la infraestructura: alojamiento y base de datos, envío de emails, registro de errores, cobro de la suscripción y, en el plan pago, el modelo de IA. Solo reciben lo necesario para su servicio.",
        },
        {
          lead: "El equipo de Lernio,",
          text: "para dar soporte, con acceso registrado. Nunca ve las notas privadas del profe.",
        },
      ],
    },
    {
      heading: "6. Tus derechos",
      paragraphs: [
        "Podés pedir ver, corregir o dar de baja tus datos escribiendo a [email de contacto]. Respondemos dentro de los plazos de la Ley 25.326. La Agencia de Acceso a la Información Pública, órgano de control de la ley, atiende las denuncias por incumplimiento.",
      ],
    },
    {
      heading: "7. Cambios",
      paragraphs: [
        "Si cambiamos algo importante, te avisamos y te pedimos que aceptes la nueva versión antes de seguir.",
      ],
    },
  ],
};
