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

## Este repo es público

Nada de precios, métricas de negocio, estrategia ni datos de personas en código, issues o PRs.

## Documentar funcionalidades

Cada vez que se crea o modifica una funcionalidad en este repo, se documenta en `../producto/docs/Funcionalidades/` (un archivo por funcionalidad, más su fila en el índice del README de esa carpeta y una línea en `../producto/docs/bitacora.md`). Seguir la convención de ese README. Los commits de documentación van en `producto`, aparte de los de `app`.

## Contexto de producto

Está en el repo privado `Lernio-app/producto`, clonado en `../producto`. Leer `../producto/docs/README.md` y `../producto/docs/02-plan-mvp.md` antes de trabajar en una fase. Las decisiones nuevas se registran como ADR en `../producto/docs/adr/`.
