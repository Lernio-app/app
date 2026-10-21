# Changelog

Cambios técnicos de `app`. Lo más nuevo arriba.

## 2026-10-21 · F0 Base

- Next.js (App Router, TypeScript, Tailwind) con shadcn/ui y los tokens de la dirección visual Pizarrón (Figtree).
- Supabase local: migración `f0_base` con `organizations`, `memberships`, `teacher_profiles` y `events`, RLS por organización y la función `create_workspace`. Tests de RLS con pgTAP.
- Ingreso con link mágico por email (Google preparado, apagado por configuración) y proxy que refresca la sesión.
- Alta del espacio de trabajo, Ajustes del profe y estructura de pantallas para celular y escritorio.
- Helpers de formato en pesos argentinos y hora de Buenos Aires.
- CI con lint, tipos, tests, build y tests de la base.
