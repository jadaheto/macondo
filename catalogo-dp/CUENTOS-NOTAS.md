# Cuentos originales (grados 1.º–3.º)

Colección de **30 cuentos originales** escritos para Macondo Digital (Biblioteca Macondo, Comfasucre), porque el catálogo de dominio público casi no tiene lecturas en español para 1.º–3.º. Ambientados en Sucre y el Caribe colombiano: Golfo de Morrosquillo, manglares, ciénagas, sabanas, La Mojana, el río San Jorge, Sincelejo, Tolú, Coveñas, Sampués, Ovejas.

- Archivos: `cuentos/<slug>.epub` (EPUB 3), `cuentos/portadas/<slug>.png` (600×900), manifiesto `cuentos.manifest.json` (30 entradas, `type` BOOK, `status` DRAFT).
- Autor: «Biblioteca Macondo – Comfasucre (cuento original)». Licencia: «Contenido original de Comfasucre (todos los derechos reservados)», 30 dispositivos, uso sin conexión, territorio CO.
- Campos extra por entrada: `text` (texto completo), `questions` (3 preguntas, formato trivia de retos), `glossary` (palabras nuevas, grados 2–3), `theme`, `grade`, `wordCount`. El importador (`scripts/import-catalog.mjs`) envía `text` y `questions` como `extra`; `glossary`, `theme`, `grade` y `wordCount` no los usa todavía.

## Aviso honesto sobre la autoría

Los textos se **redactaron con asistencia de IA** (Claude, de Anthropic) siguiendo los lineamientos de la biblioteca. Las ilustraciones son **dibujos vectoriales propios**: SVG generado por código escrito para esta colección (`_tools/cuentos-svg.py`), sin imágenes de terceros, bancos de imágenes ni generadores de imágenes. Las portadas usan la fuente Outfit (licencia SIL OFL, incluida en el repositorio). Ningún cuento imita ni versiona obras o personajes protegidos.

Cada entrada lleva en `reviewNotes`: *«Cuento original redactado con asistencia de IA; requiere revisión pedagógica y de estilo antes de publicar.»* **Nada debe publicarse sin esa revisión humana.**

## Índice por grado

### Grado 1 (120–250 palabras: frases cortas, repetición, palabras frecuentes; conteo y letras)

| Título | Slug | Tema | Grados | Palabras | EPUB |
|---|---|---|---|---|---|
| Cinco cangrejitos | `cinco-cangrejitos` | números | 1 | 143 | 98 KB |
| Garza mira los colores | `garza-mira-los-colores` | colores | 1 | 163 | 95 KB |
| Hola, manatí | `hola-manati` | respeto por los animales | 1 | 167 | 91 KB |
| M de manglar | `m-de-manglar` | letras | 1 | 151 | 84 KB |
| ¿Quién vive en la ceiba? | `quien-vive-en-la-ceiba` | animales y su hogar | 1 | 149 | 95 KB |
| La semilla de Sara | `la-semilla-de-sara` | las plantas | 1 | 145 | 88 KB |
| Tomás juega conmigo | `tomas-juega-conmigo` | inclusión | 1 | 143 | 90 KB |
| Diez mariposas amarillas | `diez-mariposas-amarillas` | números | 1 | 150 | 98 KB |
| Agua para todos | `agua-para-todos` | cuidar el agua | 1–2 | 165 | 75 KB |
| El tambor de Nico | `el-tambor-de-nico` | música tradicional | 1 | 150 | 86 KB |

### Grado 2 (250–450 palabras)

| Título | Slug | Tema | Grados | Palabras | EPUB |
|---|---|---|---|---|---|
| La gaita de Juancho | `la-gaita-de-juancho` | tradiciones | 2 | 335 | 95 KB |
| Los colores de Inés | `los-colores-de-ines` | emociones | 1–2 | 313 | 91 KB |
| La sombra grande del chigüiro | `la-sombra-del-chiguiro` | compartir | 2 | 308 | 95 KB |
| Los guardianes del reciclaje | `los-guardianes-del-reciclaje` | reciclaje | 2–3 | 324 | 98 KB |
| Valentina habla con las manos | `valentina-habla-con-las-manos` | inclusión | 2–3 | 332 | 90 KB |
| Lucero y el jardín de la escuela | `lucero-y-el-jardin` | polinización | 2–3 | 295 | 94 KB |
| Babi, la babilla | `babi-la-babilla` | respeto a la diversidad | 2 | 295 | 91 KB |
| El viaje de Gotita por La Mojana | `el-viaje-de-gotita` | ciclo del agua | 2–3 | 315 | 93 KB |
| El aullido de Aurelio | `el-aullido-de-aurelio` | diversidad de talentos | 2 | 313 | 91 KB |
| Bienvenida, Yuleidis | `bienvenida-yuleidis` | convivencia escolar | 2–3 | 301 | 89 KB |

### Grado 3 (450–800 palabras)

| Título | Slug | Tema | Grados | Palabras | EPUB |
|---|---|---|---|---|---|
| El secreto del manglar | `el-secreto-del-manglar` | ciencia | 3 | 615 | 110 KB |
| Las tortugas de Rincón del Mar | `las-tortugas-de-rincon-del-mar` | conservación | 3 | 588 | 98 KB |
| La canoa de la abuela Mercedes | `la-canoa-de-la-abuela-mercedes` | historia | 3 | 587 | 101 KB |
| El club de la Luna | `el-club-de-la-luna` | ciencia | 3 | 519 | 90 KB |
| El porro de la banda escolar | `el-porro-de-la-banda` | inclusión | 3 | 575 | 101 KB |
| Las semillas viajeras | `las-semillas-viajeras` | ciencia | 3 | 581 | 105 KB |
| El círculo de la palabra | `el-circulo-de-la-palabra` | convivencia escolar | 2–3 | 611 | 100 KB |
| El mapa de los sonidos | `el-mapa-de-los-sonidos` | inclusión | 3 | 621 | 108 KB |
| Las pintas del sombrero | `las-pintas-del-sombrero` | patrimonio cultural | 3 | 669 | 97 KB |
| El barrilete de diciembre | `el-barrilete-de-diciembre` | ciencia | 3 | 644 | 104 KB |

## Temas cubiertos

- **Ciencias:** ciclo del agua, semillas y dispersión, polinización, fases de la Luna, viento, manglar como guardería y protección costera, tortugas marinas.
- **Matemáticas y lectoescritura (grado 1):** conteo hasta 5 y hasta 10, la letra M, colores; patrones en las pintas del sombrero (grado 3).
- **Valores y convivencia:** amistad, inclusión (silla de ruedas, niña sorda y lengua de señas, niño ciego con bastón blanco), emociones, círculo de la palabra, acogida a una niña que llega del Pacífico, respeto a los animales silvestres (mirar sin tocar ni alimentar), cuidado del agua, reciclaje.
- **Patrimonio cultural:** gaita, tambor, porro sabanero, sombrero vueltiao y caña flecha, canales zenúes de La Mojana. Se mencionan como patrimonio, sin marcas.
- Personajes diversos: niñas y niños afrocolombianos, zenúes y mestizos; abuelas y abuelos; niñas y niños con discapacidad que protagonizan sin que la discapacidad sea el único rasgo.

## Método y herramientas (`_tools/cuentos-*`)

1. `cuentos-data/g1.json`, `g2.json`, `g3a.json`, `g3b.json`: textos, escenas, preguntas y glosario de cada cuento.
2. `cuentos-svg.py`: biblioteca de dibujos planos (fondos, animales, personas, objetos) y `render_scene()` para un lienzo de 800×600.
3. `cuentos-build.py`: valida rangos de palabras, preguntas y glosarios; renderiza portadas HTML a PNG con Chromium (Playwright, `cuentos-covers.js`); arma cada EPUB 3 (mimetype primero y sin comprimir, `container.xml`, OPF con dc:language/title/creator/rights y dcterms:modified, `nav.xhtml` y `toc.ncx`, portada, de 2 a 4 páginas con ilustración SVG, página «Para conversar / Palabras nuevas» y créditos); escribe el manifiesto con sha256 y tamaño. Reproducible: `python3 -I catalogo-dp/_tools/cuentos-build.py`.
4. `cuentos-preview.py` y `cuentos-shot.js`: hojas de contacto para revisar las escenas.
5. Validación: `python3 -I _tools/cuentos-validate-epub.py cuentos` (estructura) y `node _tools/cuentos-validate.js` (esquema, sha256 y archivos).

## Validación ejecutada (2026-10-31)

- `cuentos-validate-epub.py`: 30/30 OK. Comprueba la firma ZIP, que mimetype sea la primera entrada y sin comprimir, los CRC, que todo el XML esté bien formado (OPF/XHTML/SVG/NCX), que el manifiesto OPF coincida con los archivos, que estén los metadatos obligatorios, nav y cover-image, y que cada archivo pese menos de 1 MB (todos rondan los 80–110 KB).
- `unzip -t`: 30/30 sin errores.
- `ResourceInputSchema` (`packages/shared/dist`): 30/30 válidos, tanto la entrada tal cual como con `extra: {text, questions}`. También 30/30 con `_tools/validate.js`. sha256 y tamaño comprobados.
- **epubcheck no se ejecutó**: no está instalado y el entorno no permitió correr el .jar descargado. Queda pendiente pasar epubcheck antes de publicar.
- Portadas revisadas a ojo en hojas de contacto: el título y la franja «Cuento · Grado N» se leen bien.

## Pendiente para la revisión pedagógica

- Revisar estilo, vocabulario y extensión por grado. En grado 1 también hay que revisar las preguntas, que tienen un nivel de lectura mayor que los cuentos.
- «Valentina habla con las manos»: la Lengua de Señas Colombiana se describe en términos generales; conviene que la revise alguien que conozca la LSC o la comunidad sorda.
- «La canoa de la abuela Mercedes»: verificar la datación de los canales zenúes («hace más de mil años») y que todavía se vean en La Mojana y la cuenca del San Jorge.
- «El mapa de los sonidos»: revisar que sea fiel a la experiencia de un niño ciego (bastón blanco, braille).
- «Bienvenida, Yuleidis»: revisar las palabras regionales (Guapi, Pacífico).
- Las ilustraciones son esquemáticas (estilo plano sencillo); el sombrero de las escenas evoca el sombrero vueltiao de forma simplificada.
