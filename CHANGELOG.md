# Changelog

Cambios técnicos de `app`. Lo más nuevo arriba.

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
