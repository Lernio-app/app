# Changelog

Registro de cambios del repo. Cada PR agrega una línea con la referencia a su issue. Las decisiones de producto se registran en el repo privado `producto`.

## Sin publicar

### Cambiado

- `CLAUDE.md`: el alumno tiene una cuenta única en la plataforma, por invitación o registro propio (ADR-0003 en `producto`).

### Agregado

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
