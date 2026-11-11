# Fuentes y licencias del contenido de demostración

Recuperado/generado el **2026-10-31**. Criterio legal: dominio público **en Colombia** (Ley 23 de 1982, art. 21: vida del autor + 80 años → autor fallecido antes de 1946), o contenido original del proyecto. En grabaciones se verificó además que la grabación misma esté dedicada al dominio público (LibriVox). Todos los archivos se verificaron por bytes mágicos, tamaño y SHA-256; los 8 registros de `manifest.json` validan contra `ResourceInputSchema` de `@macondo/shared`.

> Las portadas escaneadas de ediciones del siglo XX **no** se incluyeron: sus ilustradores no están verificados como de dominio público en Colombia (p. ej. *Azul...* ed. Mundo Latino, ilustrada por Enrique Ochoa, fallecido en 1978). Por eso se retiraron de los EPUB y se generaron portadas propias.

## Archivos

| Archivo | Obra / autor (fallecimiento) | Fuente | Base legal | Bytes | SHA-256 | Modificaciones |
|---|---|---|---|---|---|---|
| `files/samaniego-fabulas.epub` | *Fábulas*, Félix María Samaniego (1801); notas de Miguel de Toro Gómez (1922), ed. Armand Colin, París 1902 | https://www.gutenberg.org/ebooks/55206.epub.noimages | Dominio público CO (autor y anotador fallecidos antes de 1946); Licencia Project Gutenberg conservada en el archivo | 188293 | `3f1d91729e136082fbec22eab7c55a77c77ea25b93c1071b2308a8d8d00eefbb` | Versión sin imágenes. Se retiró la portada escaneada (ilustrador no identificado) y sus referencias en OPF/HTML; la portada interna se sustituyó por título en texto. Texto y licencia PG intactos. |
| `files/marti-la-edad-de-oro.epub` | *La Edad de Oro* (1889), José Martí (1895) | https://www.gutenberg.org/ebooks/19898.epub.noimages | Dominio público CO; Licencia Project Gutenberg | 209873 | `1c9f489053354e7dfead88997dd5f00fa9c7a145ab5fabcf1972765b3ba3c65f` | Ninguna (portada interna generada automáticamente por PG). |
| `files/dario-azul.epub` | *Azul...*, Rubén Darío (1916); carta-prólogo de Juan Valera (1905) | https://www.gutenberg.org/ebooks/52894.epub.noimages | Dominio público CO (texto). Ilustraciones de Enrique Ochoa (†1978) **excluidas** | 107278 | `553c72dcb23db96ccd78635ea2aa1a7dd8b0e72ff0165501c1b4ff949121966a` | Versión sin imágenes; se retiró además la portada escaneada (diseño de Ochoa) y sus referencias. Quedan textos alternativos tipo "imagen no disponible". |
| `files/pombo-renacuajo-y-viejecita.pdf` | "El renacuajo paseador" y "La pobre viejecita", Rafael Pombo (1912) | Texto: https://es.wikisource.org/wiki/El_renacuajo_paseador y https://es.wikisource.org/wiki/La_pobre_viejecita (wikitexto `action=raw`) | Dominio público CO. La transcripción de un texto de dominio público no genera derechos nuevos | 10889 | `7120209474ad16984b7543dbe64476000a979fc56115161ed4bc749963d650de` | **PDF generado por nosotros** (`tools/build_demo.py`, PDF 1.4, Helvetica base-14, A5, 8 páginas). Solo formato; en "La pobre viejecita" se separaron estrofas de 8 versos. Texto sin cambios (incluye pequeñas omisiones de puntuación de la transcripción). |
| `files/quiroga-las-medias-de-los-flamencos.mp3` | "Las medias de los flamencos" (*Cuentos de la selva*, 1918), Horacio Quiroga (1937). Lectora: Charbelí Ramos Chávez | https://archive.org/download/cuentosdelaselva_1603_librivox/cuentosdelaselva_03_quiroga_64kb.mp3 (LibriVox #6706) | Texto: dominio público CO (1937 + 80 = 2017). Grabación: LibriVox, *Public Domain Mark 1.0* | 5177856 | `d1e1b4c8ae043a04d222a76cf71c69c50e729c20ebd23bb87e00ac281f43dbf0` | Ninguna. 64 kbps, 647 s. |
| `files/marti-los-zapaticos-de-rosa.mp3` | "Los zapaticos de rosa" (*La Edad de Oro*), José Martí (1895). Lector/a: jaid | https://archive.org/download/edad_de_oro_1001_librivox/edaddeoro_19_marti_64kb.mp3 (LibriVox #2162) | Texto: dominio público CO. Grabación: LibriVox, dedicación al dominio público (`creativecommons.org/licenses/publicdomain`) | 3094999 | `633a659c147a53debef5ea74f9a78829c78b0605b5baa5d96a754cb11ea56a4f` | Ninguna. 64 kbps, 387 s. |
| `files/audiobiografia-rafael-pombo.mp3` | Texto original escrito para Macondo Digital | Generado: `say -v Paulina` (macOS) → `ffmpeg/libmp3lame` 64 kbps mono | Contenido propio de demostración | 832138 | `f099f4343918c39c6da66ed44270f6aa8ff3fafb8e7a0ff7075c5d14daed352f` | Voz sintética, 104 s. Ver nota de voz. |
| `files/audioresumen-las-medias-de-los-flamencos.mp3` | Resumen original de una obra de dominio público (Quiroga) | Igual que el anterior | Contenido propio de demostración | 944342 | `5ea1ec1644dc6570c7da34065bf181126267529aa94fc8465a6ca1afcb14a67d` | Voz sintética, 118 s. Resumen cotejado con el texto de Wikisource. |

## Portadas (`covers/*.png`, 600×900)

Las 8 portadas son **diseños propios** generados con `tools/build_demo.py` (SVG → PNG con `qlmanage` y `sips`): solo texto, formas y colores; sin imágenes de terceros.

| Archivo | Bytes | SHA-256 |
|---|---|---|
| `covers/samaniego-fabulas.png` | 37500 | `06e785b41523ea4d1c6613ba46927ca4f5d5fe98564f763638a134d4f3770e9c` |
| `covers/marti-la-edad-de-oro.png` | 38126 | `04a4518d3dc584b5605fce7f52797ea49678113ef2206e871d9a7a29f47eee5f` |
| `covers/dario-azul.png` | 31783 | `c98a9b7c4c3390480dd14fd643591fd1bed88bf099975732a370b4e1e480bdce` |
| `covers/pombo-renacuajo-y-viejecita.png` | 45228 | `42b6a06f47a5e43a05963bb550df543f9fc8efc509838246289806d976fee728` |
| `covers/quiroga-las-medias-de-los-flamencos.png` | 49492 | `ebaad6b679fefe755e9e0e0fedabf3fe55906c84f4e333a1957c3778353d25f8` |
| `covers/marti-los-zapaticos-de-rosa.png` | 44946 | `3d3e4d7ccc6c56d0c24bf34c0d45528ec1de578f14c45bf06094d07e8ee64c75` |
| `covers/audiobiografia-rafael-pombo.png` | 41240 | `3075992a36e87cc8c6d909d111eda5974bc6207e2ecd11a3c03817a1381f364c` |
| `covers/audioresumen-las-medias-de-los-flamencos.png` | 48497 | `ac1df570521eaef8865e209ff3d2b1b0e653d8f77062ab46bd5290ed9eb3878f` |

## Notas y advertencias

- **Project Gutenberg**: los EPUB conservan la cabecera y la licencia PG completas. Su uso aquí es gratuito y no comercial (biblioteca escolar). Si alguna vez se distribuyeran con fines comerciales, revisar la sección 1.E.8 de la licencia PG o quitar todas las referencias a PG. Se respetó su política de robots: 3 descargas directas, sin rastreo.
- **Voz sintética de macOS**: la licencia de macOS permite usar las voces del sistema para crear contenido propio de uso personal y no comercial. Se considera aceptable **solo para la demo interna**; antes de producción, reemplazar por narración humana con cesión de derechos firmada (marcado así en `license.licenseName`).
- **Contenido de las obras**: *La Edad de Oro* (1889) contiene expresiones propias de su época (p. ej., roles de género). Se recomienda acompañamiento del docente o una nota de contexto en la ficha.
- **No obtenido**: una galería (`GALLERY`) — no se buscaron imágenes de Wikimedia Commons con licencia verificada en esta iteración. *María* de Jorge Isaacs no está en Project Gutenberg en español (búsqueda sin resultados).
- **Reproducir**: `python3 -I demo-content/tools/build_demo.py <dir_descargas> <raíz_repo>` (requiere las descargas originales, `say`, `ffmpeg` con libmp3lame, `qlmanage`, `sips`; solo macOS). Las descargas de Wikisource deben guardarse como `ws_El_renacuajo_paseador.txt` y `ws_La_pobre_viejecita.txt`.
