# CLAUDE.md

Convenciones técnicas para trabajar en este repo (personas y agentes).

## Stack

Next.js (App Router), TypeScript, Tailwind, shadcn/ui, Supabase (Postgres con RLS, Auth, Storage), Vercel, Resend, Sentry.

## Forma de trabajo

- Una pieza por vez (una tabla o una pantalla), con el diff a la vista antes de aplicar.
- Se trabaja directo sobre `main`, sin branches por feature ni PR.
- Todo cambio de UI se verifica en el navegador con Claude in Chrome (`npm run dev`), con la ventana en ancho de celular, antes de darlo por terminado. El lint y los tests no alcanzan.

## Datos

- Toda tabla de negocio lleva `org_id` y RLS.
- Fechas en `timestamptz`, con zona por defecto `America/Argentina/Buenos_Aires`.
- Montos en centavos, como enteros.
- Alumnos y clases se archivan, no se borran. Los pagos nunca se borran.

## UI

- El profe trabaja desde el celular.
- El alumno tiene una cuenta única en la plataforma: la activa desde la invitación del profe o se registra solo, con el mismo ingreso que el profe (ADR-0003 en `../producto/docs/adr/`).
- Pesos con formato argentino.
- Voseo en todos los textos.

## Sistema de diseño

Leer `docs/sistema-de-diseno.md` antes de tocar cualquier pantalla. Lo hacen cumplir las reglas `lernio/*` de ESLint, los tests de `src/design/` y `eslint-rules/`, y un hook que lintea cada archivo editado.

- Cada pantalla vive en un grupo de rutas con su superficie (`<Surface>` en el layout del grupo).
- Se construye con las primitivas de `components/ui`. Colores, radios y tamaños, solo por token.
- No se desactivan reglas `lernio/*` ni se agregan excepciones para pasar el lint: se corrige el código. Si una regla parece estar mal, se avisa en vez de esquivarla.
- Los tokens y las reglas cambian solo con una decisión en `producto`, en el mismo PR que su test.

## Seguridad

- La clave de servicio de Supabase nunca llega al navegador.
- Los tokens de invitación del alumno se guardan hasheados.
- Nunca se commitean secretos.

## Credenciales y Notion

Las credenciales del proyecto se documentan en la página de Notion "App Profes - Credenciales y configuración" (el enlace lo tiene el equipo; no se escribe acá porque el repo es público).

- Cuando una implementación nueva requiera credenciales, claves, tokens, variables de entorno o cuentas, se agrega a esa página de Notion: qué es, para qué sirve y de dónde se obtiene.
- La variable también se agrega a `.env.example`, con un comentario y sin valor real.
- Los valores secretos o de producción (service_role, client secrets, tokens) no se escriben en Notion sin confirmación explícita del usuario. Se deja el nombre, la descripción y dónde obtenerlo.
- Si no hay conexión con Notion (MCP no disponible), no omitir el paso en silencio: avisar y sugerir conectar el MCP (`https://mcp.notion.com/mcp`, en la configuración de MCP del editor) o listar exactamente qué hay que cargar a mano.
- Ya registradas: las variables de Supabase (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`), `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_GOOGLE_ENABLED` y la cuenta de mail provisoria del equipo.

## Git

- Antes de empezar a trabajar y antes de pushear: `git pull --rebase origin main`. Si el push es rechazado, hacer pull y rebase de nuevo; nunca `push --force` sobre `main`.
- `main` está protegida por un ruleset: no hay force-push ni borrado y la historia es lineal (hacer `git pull --rebase`, nunca merge commits). Se pushea directo a `main`.
- Commits en español, con formato `tipo: descripción`, con tipo `feat`, `fix`, `chore`, `docs` o `refactor`.
- Al empezar una fase, hacer también `git pull --rebase` en `../producto`.

## Issues y Project

- Los issues y el Project "Lernio · MVP" se gestionan desde la terminal con `gh` (autenticado con `gh auth login`):
  - Ver y buscar: `gh issue list -R Lernio-app/app`, `gh issue view N`.
  - Tomar un issue: `gh issue edit N --add-assignee @me` y pasarlo a `In Progress` en el Project (`gh project item-edit`).
  - Comentar o cerrar: `gh issue comment N`, `gh issue close N`.
- Para crear un issue con su issue type (`Feature`, `Task` o `Bug`): `gh api repos/Lernio-app/app/issues -f title=... -f type=Task`. Lleva una etiqueta `area:*`, una `prioridad:*`, el milestone de su fase y se agrega al Project con Fase y Prioridad.
- El commit que termina un issue lo cierra con `Closes #N` en el mensaje.
- Al terminar una tarea, o si el código ya cubre los criterios de aceptación de un issue, proponer pasarlo a `In Review` en el Project (`gh project item-edit`) y esperar la confirmación antes de moverlo.
- Los issues de `app` son públicos: lo sensible o de negocio va como issue en `Lernio-app/producto`.

## Bitácora

- Cada cambio agrega una línea a `CHANGELOG.md`, bajo "Sin publicar" y en la sección `Agregado`, `Cambiado` o `Corregido`, con la referencia al issue (`#N`) si lo hay.
- Las decisiones y novedades de producto o negocio no van acá: se registran en `../producto/docs/bitacora.md`.

## Este repo es público

Nada de precios, métricas de negocio, estrategia ni datos de personas en código, commits ni issues.

## Documentar funcionalidades

Cada vez que se crea o modifica una funcionalidad en este repo, se documenta en `../producto/docs/Funcionalidades/` (un archivo por funcionalidad, más su fila en el índice del README de esa carpeta y una línea en `../producto/docs/bitacora.md`). Seguir la convención de ese README. Los commits de documentación van en `producto`, aparte de los de `app`.

También se actualiza la guía de testing (`../producto/docs/testing/guia-de-testing.html`, ver su README): la ficha de la funcionalidad con sus pasos y chequeos, y después se republica el artifact.

## Contexto de producto

Está en el repo privado `Lernio-app/producto`, clonado en `../producto`. Leer `../producto/docs/README.md` y `../producto/docs/02-plan-mvp.md` antes de trabajar en una fase. Las decisiones nuevas se registran como ADR en `../producto/docs/adr/`.
