# Sistema de diseño

Dirección visual **D · Resaltador**: la precisión de una herramienta de trabajo (líneas finas, grillas, cifras alineadas) con la energía de un cuaderno nuevo (cuadrícula, resaltador amarillo y un color por área). Tiene que verse divertido, nunca infantil.

La especificación completa, con el porqué de cada decisión, está en `../producto/docs/lernio-especificaciones-diseno.md`. Las secciones citadas acá (§N) son de ese documento. Este archivo dice cómo está implementada en el código y qué reglas la hacen cumplir.

## Dónde vive cada cosa

| Qué | Dónde |
|---|---|
| Tokens (colores, radios, alto de control, cuadrícula) | `src/app/globals.css`. El único archivo con colores escritos |
| Valores que no pueden ser variables CSS (meta `theme-color`) | `src/design/meta.ts` |
| Primitivas | `src/components/ui/` |
| Componentes del profe (agenda, cobros, navegación) | `src/components/app/` |
| Componentes del marketplace (`Buscador`, `PublicacionCard`, `Casilleros` y `GrillaHorarios`, `PanelFiltros`, `HojaFiltros`, `FormConsulta`, `PanelConsulta`, `Catalogo`) | `src/components/marketplace/` |
| Stickers, banda, tiles de área, capturas del producto y maquetación del sitio | `src/components/expresivos/` (`sticker`, `sitio`, `marco`, `capturas`) |
| Reglas de lint | `eslint-rules/lernio-design.mjs` y `eslint.config.mjs` |
| Test de tokens y contraste | `src/design/tokens.test.ts` |
| Test de las reglas de lint | `eslint-rules/lernio-design.test.mjs` |

## Superficies (§1.1)

Cada pantalla pertenece a una sola superficie. La marca el `layout.tsx` de su grupo de rutas con `<Surface name="…">`; los componentes leen los tokens de la superficie y no deciden por su cuenta.

| Grupo de rutas | Superficie | Radio control / card | Alto de control | Cuadrícula |
|---|---|---|---|---|
| `(app)`, `(onboarding)` | `app` | 10 / 14 | 44 celular · 40 escritorio | 20 · 24 |
| `(portal)` | `portal` | 10 / 14 | 44 | 20 |
| `(auth)`, `(marketplace)` | `marketplace` | 12 / 18 | 48 | 32 |
| `(marketing)` | `marketing` | 12 / 20 | 48 | 32 |
| `(interno)` | `interno` | 10 / 14 | 44 · 40 | — |

Para una pantalla nueva: si el profe la usa para trabajar, `app`; si alguien busca o elige una clase, `marketplace`; si convence a un profe, `marketing`; si la abre un alumno o el responsable de pago, `portal`; si es para los socios, `interno`. Ante la duda, `app`.

Un grupo de rutas nuevo se suma a `SURFACE_BY_GROUP` en `eslint-rules/lernio-design.mjs`; sin eso, el lint no lo deja pasar.

## Tokens

Se usan siempre por nombre. Los valores están en `globals.css` y en §2.

- **Base:** `bg-background` (blanco), `bg-paper`, `border-line`, `border-line-soft`, `border-border-control`, `border-border-input`, `text-ink`, `text-ink-2`, `text-ink-3`.
- **Marca:** `bg-indigo` / `bg-primary`, `text-indigo-strong`, `bg-indigo-soft`, `text-indigo-muted`, `bg-indigo-next` (fila de la clase próxima), `bg-ai-bg`, `border-ai-border`.
- **Estados:** `ok`, `pending`, `debt`, `error`, cada uno con `-bg` y, salvo error, `-solid` para gráficos. El texto (`text-ok`, `text-debt`, `text-pending`) se puede usar suelto; los fondos van solo dentro de `<StatusChip>`.
- **Áreas:** `subj-lang`, `subj-uni`, `subj-school`, `subj-music`, cada uno con `-bg` y `-ink`. Se usan a través de `<AreaSwatch>`, `<AreaTag>` y `<TeacherAvatar>`, que reciben la clave del área (`idiomas`, `ingreso`, `apoyo`, `musica`, `otra`).
- **Radios:** `rounded-control`, `rounded-card`, `rounded-tag` (8), `rounded-key` (4) y `rounded-full`. Los dos primeros cambian con la superficie.
- **Alto de control:** `h-(--control-h)`. Lo aplican `Button`, `Input` y `NativeSelect`; no se fija a mano.

## Tipografía (§3)

| Utilidad | Familia | Uso |
|---|---|---|
| `title-page` | Bricolage 800 | Título de pantalla (lo pone `<PageTitle>` o `<PageHeader>`) |
| `title-section` | Bricolage 800 | Título de sección (`<SectionTitle>`) |
| `title-card` | Bricolage 800 | Nombre en la tarjeta "Próxima clase" |
| `stat` | Bricolage 800 | Números grandes del reporte |
| `num` | Geist Mono 500, tabular | Montos, horas y conteos en listas |
| `num-kpi` | Geist Mono 500, 26 px | Cobrado, pendiente y deben |
| `label-mono` | Geist Mono 400, 12 px | Labels como "Próxima clase" o "Sugerencia · borrador" |

El resto del texto es Geist en 400, 500 o 600, con los tamaños `text-xs`, `text-sm`, `text-base` y `text-lg`.

Escala de marketing (§3.3), solo en el sitio para profes y la home del marketplace:

| Utilidad | Familia | Uso |
|---|---|---|
| `title-display` | Bricolage 800, `clamp(2.75rem, 6.4vw, 5.75rem)` | Titular del hero |
| `title-h2` | Bricolage 800, `clamp(2.25rem, 4.4vw, 3.5rem)` | Títulos de sección y titular de las páginas internas |
| `title-h3` | Bricolage 800, 23 px | Títulos de bloque y nombre de los tiles |
| `title-strip` | Bricolage 800, `clamp(1.75rem, 3.4vw, 2.75rem)` | Banda índigo con ejemplos del oficio |
| `lead` | Geist 400, `clamp(1.0625rem, 1.6vw, 1.25rem)` | Bajadas |

Escala del marketplace (§12.3), en el catálogo, la página de la clase y el perfil:

| Utilidad | Familia | Uso |
|---|---|---|
| `title-listing` | Bricolage 800, `clamp(2rem, 4vw, 3rem)` | Título del catálogo y de la clase |
| `card-title` | Bricolage 800, 20 px, 2 líneas como máximo | Título de la tarjeta de clase |
| `price` y `price-lg` | Tamaño 18 y 28 px; se escriben junto a `num` (Geist Mono) | Precio en la tarjeta y en la clase |

El tracking más cerrado es −0.04em (la especificación pedía −0.05em en el display; se ajustó para que las tildes no se toquen).

## Primitivas

| Componente | Archivo | Notas |
|---|---|---|
| `Button`, `buttonVariants` | `ui/button.tsx` | `default` (índigo, uno por vista), `secondary`, `ghost`, `link`, `onIndigo`, `outlineOnIndigo`. Tamaños `default`, `compact` (30, tablas) e `icon`. No hay variante roja |
| `Card` | `ui/card.tsx` | `variant="draft"` para las sugerencias de la IA (borde punteado) |
| `Input`, `Textarea`, `NativeSelect` | `ui/` | 16 px y borde `border-input` |
| `Field`, `FormError` | `ui/field.tsx` | `FormError` es el único lugar del rojo fuera de los controles |
| `StatusChip` | `ui/status-chip.tsx` | `ok`, `pending`, `debt`, `next`. Ícono obligatorio; `cross` lo cambia por una x |
| `AreaSwatch`, `AreaTag`, `TeacherAvatar` | `ui/area.tsx` | El color del área nunca aparece solo |
| `PageContainer`, `PageHeader`, `PageTitle`, `SectionTitle`, `EmptyState` | `ui/page-header.tsx` | `PageHeader` va sobre cuadrícula, con `back`, `label`, `description` y `actions` |
| `Resaltador` | `ui/resaltador.tsx` | Uno por pantalla, sobre una frase o la fecha. `variant="bloque"` sobre índigo (§5.2) |
| `Surface` | `ui/surface.tsx` | Solo en los layouts de grupo, o anidada para mostrar una superficie dentro de otra |
| `Logo` | `ui/logo.tsx` | Provisional (§5.6) |

## Reglas automáticas

`npm run lint` corre con cero warnings y en CI. En `src/` no se aceptan excepciones en línea (`eslint-disable`): si algo necesita una, va en `eslint.config.mjs` con su motivo, y se ve en el diff.

| Regla | Qué controla | Sección |
|---|---|---|
| `lernio/color` | Solo tokens del sistema: nada de paleta de Tailwind, hex, transparencias ni clases de color que no existen | §2 |
| `lernio/forma` | Radios con nombre, bordes de 1 px, sin sombras, gradientes, desenfoques ni animaciones (salvo carga) | §4, §13 |
| `lernio/tipografia` | Sin tamaños grandes sueltos ni pesos fuera de 400–600; Bricolage solo por las utilidades de título | §3 |
| `lernio/semantica` | El rojo solo por `<FormError>`, los fondos de estado solo por `<StatusChip>` y el resaltador solo por `<Resaltador>` | §2.5 |
| `lernio/tipografia-en-datos` | Bricolage nunca en botones, inputs, labels ni tablas | §3.1 |
| `lernio/alto-de-control` | El alto de botones y campos sale de la superficie | §1.1 |
| `lernio/numeros-en-mono` | Lo que pasa por `formatARS`, `formatTime` o `localTime` se muestra en `num` | §3.1 |
| `lernio/resaltador` | Uno por pantalla, nunca sobre montos, horas, botones, links ni estados | §5.2 |
| `lernio/un-primario` | Un botón índigo por archivo de vista, y ninguno dentro de un `.map` | §2.5 |
| `lernio/texto` | Voseo; sin "moroso", "deudor" ni "atrasado"; sin "Error:"; sin exclamaciones ni emojis en la interfaz; sin superlativos ni urgencia | §9, §12.11 |
| `lernio/superficie` | Toda pantalla en un grupo con superficie y layout con `<Surface>` | §1.1 |
| `no-restricted-imports` | Íconos solo de Lucide; `components/app`, `marketplace` y `expresivos` solo desde sus superficies | §1.1, §5.4 |

Además:

- `src/design/tokens.test.ts` fija los valores de §2, verifica el contraste de §10 y que `globals.css` no tenga colores fuera de `:root`, sombras ni gradientes nuevos.
- `eslint-rules/lernio-design.test.mjs` prueba que cada regla detecta lo que tiene que detectar.
- En Claude Code, un hook (`.claude/settings.json`) corre el lint sobre cada archivo editado y devuelve los errores al agente antes de seguir.

### Lo que el lint no ve

Se revisa a mano en cada PR:

- Un primario por vista cuando la vista junta componentes de varios archivos.
- Que el color de área acompañe siempre a un nombre.
- Que la cuadrícula no quede debajo de listas, tablas o texto largo.
- Stickers: como mucho uno en la app, y solo con un dato real.
- Lo que no está disponible no aparece como disponible (§9).
- Targets de toque de 44 px y labels reales en todos los campos (§10).

## Cambiar el sistema

1. La decisión se toma en `producto` (ADR o actualización de la especificación).
2. Se cambia el token en `globals.css` y el valor en `src/design/tokens.test.ts`, en el mismo PR.
3. Si cambia una regla, se actualiza este documento y su test en `eslint-rules/`.

Nunca se agrega un color, un radio o un tamaño en una pantalla para resolver un caso: se suma al sistema o se usa lo que hay.
