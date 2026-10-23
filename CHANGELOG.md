# Changelog

Registro de cambios del repo. Cada PR agrega una línea con la referencia a su issue. Las decisiones de producto se registran en el repo privado `producto`.

## Sin publicar

### Cambiado

- Áreas, materias y niveles: migración `areas_materias_niveles` con el catálogo cerrado (`areas`, `subjects`, `subject_areas` y `levels`, 4 áreas, 30 materias y 13 niveles, de lectura pública y sin escritura desde el cliente). `students` pasa de `subject` y `level` en texto libre a `area_id`, `subject_id` y `level_id`, con «Otra» (sin área ni nivel) y `subject` como detalle o nombre; `teacher_profiles` cambia `subjects`, `levels` e `is_public` por `subject_ids`, `main_area_id` (derivada por trigger) y `photo_path`, y `public_slug` pasa a `slug`. `create_workspace` y `create_student` cambian de firma.
- El alta del espacio y Ajustes ofrecen las 30 materias agrupadas por área y ya no piden niveles. El alta y la edición del alumno piden la materia de la lista (con área, nivel opcional y detalle) o «Otra»; la lista y la ficha muestran la materia con el color de su área. Catálogo en `src/lib/catalog.ts` y `src/lib/catalog-data.ts`, con tests pgTAP y unitarios.
- Sistema de diseño de la dirección D · Resaltador: tokens, superficies, fuentes Bricolage, Geist y Geist Mono, primitivas en `components/ui` y pantallas migradas. Reglas `lernio/*` de ESLint, tests de tokens y contraste, lint con cero warnings y hook de Claude Code. Documentado en `docs/sistema-de-diseno.md`.
- `CLAUDE.md`: los cambios de UI se verifican en el navegador con Claude in Chrome, en ancho de celular.
- `CLAUDE.md`: el alumno tiene una cuenta única en la plataforma, por invitación o registro propio (ADR-0003 en `producto`).

### Agregado

- F3 Cobros: migraciones `f3_cobros` y `f3_anular_pago` con `charges`, `payments`, `payment_allocations` y `package_ledger` (RLS por organización, solo lectura directa), las vistas `charge_balances` y `payment_balances`, y las funciones `create_charge`, `void_charge`, `record_payment`, `mark_charge_paid`, `void_payment`, `renew_package`, `generate_monthly_charges` y `apply_price_changes`. `set_attendance`, `cancel_lesson`, `restore_lesson` y `set_lesson_students` generan y ajustan el cargo de cada clase.
- Pantallas `/cobros` (resumen, quién debe, cuentas a cobrar y estadísticas), `/cobros/pago`, `/cobros/nuevo` y `/cobros/aumento`; sección Cobros en la ficha del alumno, deuda en la lista de alumnos, "Para cobrar" en el Inicio y cargo generado en la clase.
- Lógica de cobros en `src/lib/billing.ts` (deuda, vencido, estadísticas, aumento y aviso de deuda), con tests pgTAP y unitarios.
- F2 Agenda y asistencia: migración `f2_agenda` con `lesson_series`, `series_students`, `lessons` y `lesson_attendees` (RLS por organización) y las funciones `create_lesson`, `create_lesson_series`, `extend_lesson_series`, `end_lesson_series`, `move_lesson`, `cancel_lesson`, `restore_lesson`, `set_attendance` y `set_lesson_students`. La regla de cancelación del espacio decide si cada clase se cobra (`billable`).
- Pantallas `/agenda` (semana y horarios fijos), `/agenda/nueva` y `/agenda/[id]` (asistencia en un toque, mover, cancelar, notas y alumnos), clases de hoy, asistencia por marcar y recordatorios por WhatsApp en el Inicio, y sección de clases en la ficha del alumno.
- Helpers de fechas por zona horaria (`src/lib/dates.ts`) y mensaje de recordatorio; tests pgTAP y unitarios.
- Convenciones de git, bitácora y gestión de issues en `CLAUDE.md` y este `CHANGELOG.md` (#19).
- Estructura inicial del repo: `README.md`, `.gitignore`, `CLAUDE.md`, plantillas de issues y de PR.

## 2026-10-21 · Ajustes de F0 y F1 tras el plan v2

- Migración `f1_precio_opcional`: el precio de un alumno es opcional. `create_student` no crea precio sin modalidad y `set_price_plan` sin modalidad cierra el vigente (el alumno queda sin precio).
- "Plan" pasa a llamarse "Precio" en las pantallas del profe; "plan" queda para lo contratado con Lernio.
- La navegación y el Inicio muestran solo lo que existe: se sacan Agenda y Cobros hasta F2 y F3, y "Para corregir" pasa primero.
- Tests pgTAP y unitarios del precio opcional.

## 2026-10-21 · F1 Alumnos

- Migración `f1_alumnos`: `students`, `student_contacts`, `student_access` (solo hash del token, sin acceso directo desde el cliente) y `price_plans` (un plan vigente por alumno, con historial), con RLS. Funciones `create_student`, `issue_student_link`, `set_price_plan` y `student_by_token`.
- Lista con búsqueda y archivados, alta rápida, ficha, edición y archivado/restauración.
- Link del alumno: se muestra una sola vez; "Nuevo link" revoca el anterior. Mensaje de bienvenida con link `wa.me`.
- Página pública `/a/[token]` mínima (hasta el portal de F4), sin indexar.
- Tests pgTAP de aislamiento, token y restricciones del plan; tests unitarios de mensajes y validación.

## 2026-10-21 · F0 Base

- Next.js (App Router, TypeScript, Tailwind) con shadcn/ui y los tokens de la dirección visual Pizarrón (Figtree).
- Supabase local: migración `f0_base` con `organizations`, `memberships`, `teacher_profiles` y `events`, RLS por organización y la función `create_workspace`. Tests de RLS con pgTAP.
- Ingreso con link mágico por email (Google preparado, apagado por configuración) y proxy que refresca la sesión.
- Alta del espacio de trabajo, Ajustes del profe y estructura de pantallas para celular y escritorio.
- Helpers de formato en pesos argentinos y hora de Buenos Aires.
- CI con lint, tipos, tests, build y tests de la base.
