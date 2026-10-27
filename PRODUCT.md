# Product

<!-- impeccable:product-schema 1 -->

Este repo es público: acá no van precios, métricas de negocio ni estrategia. El detalle está en el repo privado `producto` (`../producto/CONTEXT.md` y `../producto/docs/02-plan-mvp.md`).

## Platform

web

## Users

- **Profe particular que trabaja solo** (primer cliente). Vive, o vive en parte, de dar clases de inglés e idiomas, ingreso y universidad, apoyo escolar o música. Trabaja desde el celular, entre clase y clase; la compu es para armar exámenes y reportes. Hoy resuelve todo con WhatsApp, Meet, Classroom, Forms, planillas y transferencias por alias.
- **Alumno**: toma clases con uno o más profes. Tiene una cuenta única (link mágico o Google, sin contraseña). Puede ser menor: desde los 13 años, con el consentimiento de un adulto.
- **Responsable de pago**: madre, padre o el propio alumno adulto. No tiene cuenta: recibe avisos y el reporte mensual por link.
- **Interesado**: busca profe en el marketplace del sitio, sin cuenta; para consultar crea una cuenta del alumno.

## Product Purpose

Lernio es el sistema para que un profe particular gestione alumnos, tareas, exámenes, clases y cobros en un solo lugar, en pesos y con WhatsApp. Lo académico (tareas y simulacros) es lo que lo diferencia y lo que se vende; agenda, asistencia y cobros están, pero no encabezan. El sitio público suma un marketplace donde los profes publican sus clases y reciben consultas.

Éxito del MVP: el profe usa tareas y simulacros todas las semanas con sus alumnos reales, sus alumnos entregan y rinden sin pedir ayuda, y una parte pasa al plan pago.

## Positioning

Las herramientas que agendan y cobran no tienen tareas ni exámenes; las que tienen tareas y exámenes no agendan ni cobran; las que hacen las dos cosas están en dólares y pensadas para otros mercados. Lernio junta las dos mitades para el profe argentino: pesos con formato local, hora de Buenos Aires, voseo, mensajes listos para su WhatsApp y cobros registrados aunque se paguen por alias o en efectivo. Además, sus clases aparecen en el buscador de Lernio, sin comisión.

## Operating Context

- El profe arma tareas y simulacros, corrige entregas (texto, fotos, PDF, audio), marca asistencia en un toque y manda recordatorios y avisos de deuda con texto listo desde su propio WhatsApp.
- El cobro al alumno ocurre por fuera (alias, transferencia, efectivo, link de pago del profe): Lernio solo lleva el registro.
- La clase se da por el Meet o Zoom del profe: el link queda guardado en cada clase.
- La inflación es parte del oficio: el aumento de precios a todos los alumnos es un paso.

## Capabilities and Constraints

- Alcance del MVP al lanzamiento (hito B): alumnos, agenda y asistencia, cobros, tareas, exámenes y simulacros (con fórmulas y tiempo límite), IA que propone preguntas, correcciones y el comentario del reporte (siempre borrador; decide el profe), reporte mensual, portal del alumno, publicaciones y marketplace con consultas dentro de la app.
- No existe y no se promete: MercadoPago integrado en los cobros del profe, WhatsApp automático, video y pizarra propios, cuentas para institutos, reseñas o puntajes, reserva o pago dentro del sitio.
- Plan gratis con 1 alumno y sin IA. Plan pago por tramos de alumnos, con IA. Precio y tramos sin definir: en el sitio van como pendientes, nunca inventados.
- Lernio es un nombre provisional y el logo es provisional.
- Lenguaje de producto: profe, alumno, responsable de pago, publicación (el sitio la muestra como "clase"), consulta, área, materia, nivel, plan, precio. Glosario completo en `../producto/CONTEXT.md`.

## Brand Commitments

- Dirección visual D · Resaltador: precisión de herramienta de trabajo con la energía de un cuaderno nuevo. Divertido, nunca infantil. Pilares: orden y respeto por el oficio. Sistema en `docs/sistema-de-diseno.md`.
- Voz: voseo siempre; cercana y con humor en el sitio para profes; serena y concreta para familias. Sin exclamaciones, emojis, superlativos, urgencia ni promesas académicas ("aprobá", "garantizado"). Estados sin juicio ("Debe 2 clases", nunca "moroso").
- Marketing: promesa (el trabajo que te sacás de encima), prueba (cómo se ve, con pantallas reales del producto) y acción. Siempre con ejemplos del oficio: el First, el parcial de Análisis, la tarea de Lengua, las escalas.
- Referencia de calidad: Linear y Stripe Dashboard.

## Evidence on Hand

- No hay testimonios, clientes, logos, métricas de uso ni prensa. No se inventan.
- Las capturas del sitio son recreaciones de pantallas reales de la app con datos de ejemplo; en apoyo escolar no aparecen nombres, fotos ni notas de alumnos reales.

## Product Principles

1. El profe trabaja desde el celular: todo lo diario se resuelve con el pulgar y en un toque.
2. El profe decide: la IA propone borradores, los mensajes los manda él desde su WhatsApp.
3. Lo que no está disponible no aparece como disponible.
4. Todo es local: pesos, hora de Buenos Aires, voseo, alias y WhatsApp.
5. El sistema funciona aunque el alumno no haga nada.

## Accessibility & Inclusion

WCAG 2.1 AA con contrastes verificados en `src/design/tokens.test.ts`. Targets de 44 px, inputs de 16 px, foco visible, estados con ícono y texto. Hay menores entre los alumnos: sin datos de menores en el marketing.
