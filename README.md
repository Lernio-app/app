# app

Sistema para profes particulares: alumnos, agenda, cobros, tareas y exámenes en un solo lugar.

Código de la aplicación (Next.js, TypeScript, Supabase). Las convenciones de trabajo están en [`CLAUDE.md`](CLAUDE.md).

## Requisitos

- Node 24 y npm.
- Docker Desktop (para Supabase local).

## Desarrollo local

```bash
npm install
cp .env.example .env.local   # completá con los valores de `npx supabase status`
npx supabase start           # base, Auth y correo de prueba (Mailpit en http://127.0.0.1:54324)
npm run dev                  # http://localhost:3000
```

El ingreso es por link mágico: el email llega a Mailpit, no a una casilla real.

### Comandos

| Comando                                                                          | Qué hace                                    |
| -------------------------------------------------------------------------------- | ------------------------------------------- |
| `npm run dev`                                                                    | Servidor de desarrollo                      |
| `npm run build`                                                                  | Build de producción                         |
| `npm run lint`                                                                   | ESLint                                      |
| `npm run typecheck`                                                              | Tipos de Next y TypeScript                  |
| `npm test`                                                                       | Tests unitarios (Vitest)                    |
| `npx supabase db reset`                                                          | Recrea la base local desde las migraciones  |
| `npx supabase test db`                                                           | Tests de la base y de RLS (pgTAP)           |
| `npx supabase gen types typescript --local > src/lib/supabase/database.types.ts` | Regenera los tipos después de una migración |

## Estructura

- `src/app/(auth)` ingreso · `src/app/(onboarding)` alta del espacio · `src/app/(app)` panel del profe (alumnos incluidos) · `src/app/a/[token]` link del alumno, sin cuenta.
- `src/proxy.ts` refresca la sesión y manda a ingresar a quien no la tiene.
- `src/lib/supabase` clientes y tipos · `src/lib/workspace.ts` sesión y espacio del profe.
- `supabase/migrations` esquema y RLS · `supabase/tests` tests de la base.

## Ingreso con Google

Está apagado hasta tener las credenciales. Para activarlo:

1. Crear un cliente OAuth en Google Cloud con el redirect `<URL de Supabase>/auth/v1/callback`.
2. En local: `enabled = true` en `[auth.external.google]` de `supabase/config.toml` y definir `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` en el entorno antes de `supabase start`.
3. En el proyecto remoto: Authentication → Providers → Google.
4. Poner `NEXT_PUBLIC_GOOGLE_ENABLED=true` para mostrar el botón.

## Deploy

1. Crear el proyecto en Supabase y vincularlo: `npx supabase login` y `npx supabase link --project-ref <ref>`.
2. Aplicar las migraciones: `npx supabase db push`.
3. En Supabase → Authentication → URL Configuration: `Site URL` con la URL de producción y `https://<dominio>/auth/callback` en las Redirect URLs.
4. En Vercel, importar este repo y definir las variables de `.env.example`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SITE_URL` y, si corresponde, `NEXT_PUBLIC_GOOGLE_ENABLED`.
5. Para que los emails de ingreso salgan de un remitente propio hace falta un SMTP (por ejemplo Resend) en Authentication → SMTP Settings.

Nunca se commitean secretos. La clave de servicio de Supabase no se usa en la app y no va en variables `NEXT_PUBLIC_`.
