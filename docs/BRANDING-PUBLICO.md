# Identidad Comfasucre — lado público de Macondo Digital

Fuente: `branding/branding.md` (kit Comfasucre del 26/10/2026). Alcance: portal estudiante (`/`, `/catalogo`, `/recurso`, `/leer`, `/retos`, `/galeria`, `/offline`), `/kiosco` y `/tv`. El panel `/admin` tiene su propio layout y no forma parte de este documento.

## Perfiles

| Área | Perfil | Escopo CSS | Fuente |
| --- | --- | --- | --- |
| Portal estudiante | PQR §3.1/§10 + **adaptación infantil (PROPUESTA)** | `:root` | Outfit (`/brand/css/fonts-local.css`) |
| `/kiosco` | Kiosco táctil Digiturno §3.4 | `[data-brand-profile="kiosco"]` | `system-ui, -apple-system, "Segoe UI"` |
| `/tv` | Pantalla de sala §3.5 | `[data-brand-profile="sala"]` | Inter (`/brand/css/inter-local.css`) |

**Propuesta, no estándar aprobado:** la escala estudiantil (raíz 20/18/17/16 px según banda de grado 1–3/4–5/6–8/9–11, controles de al menos 48 px, radios de 10/14/16 px, fondo de página `#f4f7fa`, mosaicos llenos para 1.º–3.º y bandas en turquesa/verde/azul) es una adaptación propia. La guía (§4) indica que las escalas compactas PQR/Vista 360 no deben usarse en un portal público.

## Tokens por rol (Tailwind `brand-*` → variable `--brand-*`)

| Rol | Estudiante | Kiosco | Sala |
| --- | --- | --- | --- |
| primary / primary-hover | `#17365d` / `#102b4b` | `#064679` / `#073258` | `#063b75` / `#053976` |
| secondary | `#205b88` | `#087ea4` | `#0569b9` |
| accent (turquesa/cian) | `#1595a3` | `#079bbb` | `#00a9de` |
| accent-strong (texto) | `#14717b` | `#087ea4` | `#0569b9` |
| positive / positive-strong | `#76a82b` / `#4c761c` | `#087a68` | `#087a68` |
| heading / text / muted | `#17365d` / `#24364b` / `#587086` | `#073258` / `#153d5c` / `#557086` | `#073769` / `#103962` / `#52749a` |
| surface / soft / bg | `#fff` / `#eef5fa` / `#f4f7fa` | `#fff` / `#edf4fa` / `#eef4f8` | `#fff` / `#f4f9ff` / `#f1f6fb` + degradado ambiental |
| border / control-border | `#d9e4ed` / `#718096`* | `#cddce7` / `#bfd3e3` | `#dbe6f1` / `#c9d9ec` |
| focus (contorno) + halo | `#1595a3` + `0 0 0 3px rgba(21,149,163,.16)` | `#087ea4`* + halo `rgba(7,155,187,.22)` | — (TV sin interacción) |
| estados (fondo/texto) | PQR §3.1 | Kiosco §3.4 | — |

`*` = desviación justificada por contraste (ver abajo). Las sombras, radios (`rounded-control/card/panel`) y el tamaño táctil (`min-h-touch`: 48 px en el portal estudiante, 56 px en el kiosco) también son variables.

## Logotipo, iconos y acento Macondo

- El logotipo es `/brand/images/logo_comfasucre.png` y conserva la proporción con `object-fit: contain`. El texto alternativo es «Comfasucre, de todos». Tamaños: 100×44 a 118×52 en la cabecera estudiantil, 138×58 en el kiosco y 134×60 × escala en la sala (`--u = min(1vw, 1.7778vh)`, 1u = 19,2 px en 1920×1080).
- Los iconos son de Remix Icon: el estilo `ri-*-line` y los rellenos de play, pausa, favorito y estrella. Se generan en línea desde `/brand/fonts/remixicon.svg` (`src/components/remixGlyphs.ts`, Apache-2.0), así que no se carga `icons.min.css` (unos 600 KB). Los iconos decorativos llevan `aria-hidden`, y los botones que solo tienen icono llevan `aria-label`.
- La mariposa amarilla se usa solo como un acento de 16 px junto a «Biblioteca Macondo». No compite con la marca.
- Para la PWA se usan `theme_color #17365d` y los iconos `/icons/comfasucre-192.png` y `-256.png` (copias del favicon del kit). `icon.svg` contiene ese PNG incrustado. No existe una versión de 512 px porque el kit no la incluye, así que queda pendiente si se requiere.

## Contraste (WCAG 2.1 AA) — `node apps/web/scripts/brand-contrast.mjs`

Resultado: **57 parejas, 0 fallos**. Mínimos de las parejas de texto: estudiante muted sobre suave 4,68:1; éxito 4,74:1; kiosco muted sobre fondo 4,68:1; kiosco cian sobre panel 4,64:1; sala muted sobre blanco 4,86:1. Los textos blancos del bloque de llamado de sala dan entre 11,33 y 6,73:1. En el extremo claro `#0096d5` dan 3,32:1, válido porque en TV solo hay texto grande (≥29 px). Elementos que no son texto: foco turquesa entre 3,33 y 3,58:1, borde de campo `#718096` entre 3,73 y 4,02:1, foco del kiosco entre 4,18 y 4,64:1.

Desviaciones derivadas del análisis:

1. Borde de campo estudiantil `#718096` (texto secundario PQR) en lugar de `#b9cad8`, porque este último da 1,8:1 sobre blanco.
2. Contorno de foco del kiosco `#087ea4` en lugar de `#079bbb`, que da 2,95:1 sobre `#eef4f8`. El `#079bbb` se mantiene en el halo.
3. El texto `muted` de la sala (`#52749a`) se usa solo sobre blanco, porque sobre `#f1f6fb` da 4,47:1.
4. El estado deshabilitado se marca con opacidad 0,55, como en §10. WCAG exime a los componentes inactivos.

## Fuera de alcance / pendiente

- Las portadas provienen de la API (`demo-content`) y no se modificaron.
- Modo oscuro: no se implementa (§8: requiere un juego completo propio).
- Validación física en Fire HD 10: **pendiente de validación física**.
