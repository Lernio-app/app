# CLAUDE.md

Convenciones técnicas para trabajar en este repo (personas y agentes).

## Stack

Next.js (App Router), TypeScript, Tailwind, shadcn/ui, Supabase (Postgres con RLS, Auth, Storage), Vercel, Resend, Sentry.

## Forma de trabajo

- Una pieza por vez (una tabla o una pantalla), con el diff a la vista antes de aplicar.
- Cada cambio sale de un issue. Branch `tipo/numero-slug` y PR con squash.

## Datos

- Toda tabla de negocio lleva `org_id` y RLS.
- Fechas en `timestamptz`, con zona por defecto `America/Argentina/Buenos_Aires`.
- Montos en centavos, como enteros.
- Alumnos y clases se archivan, no se borran. Los pagos nunca se borran.

## UI

- El profe trabaja desde el celular.
- El alumno nunca crea cuenta.
- Pesos con formato argentino.
- Voseo en todos los textos.

## Seguridad

- La clave de servicio de Supabase nunca llega al navegador.
- Los tokens de link del alumno se guardan hasheados.
- Nunca se commitean secretos.

## Git

- Antes de empezar a trabajar y antes de pushear: `git pull --rebase origin main`. Si el push es rechazado, hacer pull y rebase de nuevo; nunca `push --force` sobre `main`.
- `main` está protegida por un ruleset: no se pushea directo, no hay force-push ni borrado, la historia es lineal y todo entra por PR con 1 aprobación de otra persona, mergeado con squash.
- Branch `tipo/numero-slug` con tipo `feat`, `fix`, `chore`, `docs` o `refactor` (ej.: `feat/21-ficha-alumno`).
- Commits en español, con formato `tipo: descripción`.
- Al empezar una fase, hacer también `git pull --rebase` en `../producto`.

## Issues y Project

- Los issues y el Project "Lernio · MVP" se gestionan desde la terminal con `gh` (autenticado con `gh auth login`):
  - Ver y buscar: `gh issue list -R Lernio-app/app`, `gh issue view N`.
  - Tomar un issue: `gh issue edit N --add-assignee @me` y pasarlo a `In Progress` en el Project (`gh project item-edit`).
  - Comentar o cerrar: `gh issue comment N`, `gh issue close N`.
- Para crear un issue con su issue type (`Feature`, `Task` o `Bug`): `gh api repos/Lernio-app/app/issues -f title=... -f type=Task`. Lleva una etiqueta `area:*`, una `prioridad:*`, el milestone de su fase y se agrega al Project con Fase y Prioridad.
- El PR cierra su issue con `Closes #N`.
- Los issues de `app` son públicos: lo sensible o de negocio va como issue en `Lernio-app/producto`.

## Bitácora

- Cada PR agrega una línea a `CHANGELOG.md`, bajo "Sin publicar" y en la sección `Agregado`, `Cambiado` o `Corregido`, con la referencia al issue (`#N`).
- Las decisiones y novedades de producto o negocio no van acá: se registran en `../producto/docs/bitacora.md`.

## Este repo es público

Nada de precios, métricas de negocio, estrategia ni datos de personas en código, issues o PRs.

## Contexto de producto

Está en el repo privado `Lernio-app/producto`, clonado en `../producto`. Leer `../producto/docs/README.md` y `../producto/docs/02-plan-mvp.md` antes de trabajar en una fase. Las decisiones nuevas se registran como ADR en `../producto/docs/adr/`.
