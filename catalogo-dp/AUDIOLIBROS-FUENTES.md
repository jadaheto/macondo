# Audiolibros LibriVox — fuentes y verificación

Recuperado el **2026-10-31** por el agente de adquisición de audiolibros. 100 recursos en `audiolibros/`, descritos en `audiolibros.manifest.json` (formato de `FORMATO.md`, `status: DRAFT`).

## Método

1. Catálogo completo de LibriVox descargado con la API (`/api/feed/audiobooks?format=json&limit=500&offset=N&fields={id,title,language,authors,...}`, 45 páginas, pausas de 1,5 s). El parámetro `language=Spanish` de la API **no filtra** (devolvía todo el catálogo), así que se filtró localmente por `language == "Spanish"`: 588 proyectos.
2. Metadatos extendidos (`?id=N&extended=1`) de los candidatos: secciones, lectores, URL de 64 kbps, fuente del texto. Los autores de las secciones de antologías multiautor se tomaron de la tabla de capítulos de la página del libro en librivox.org.
3. Descarga secuencial con `curl -fL --retry 3` (desde la tercera pasada también `--retry-all-errors`, porque archive.org cortó varias conexiones con el error 56; el script es reanudable y se ejecutó tres veces hasta completar sin fallos), User-Agent descriptivo y 1,5 s de pausa entre archivos; solo archivos `_64kb.mp3` de archive.org (nunca 128 kbps ni zip). Temporales en `_tmp/audio/` (borrados tras concatenar).
4. Obras de varias secciones: unidas en un único MP3 con `ffmpeg -f concat -safe 0 -i list.txt -c copy` (si todas las secciones tenían el mismo códec/frecuencia/canales; si no, recodificación a 64 kbps mono con libmp3lame). El índice con tiempos de inicio está en `reviewNotes` de cada entrada.
5. Verificación de cada MP3 final: bytes mágicos (ID3 `494433` o sincronía `0xFFE*`), duración con `ffprobe`, SHA-256 y tamaño (límite inicial 150 MB/archivo y 2,5 GB en total; ampliado por el coordinador, con aprobación del usuario, a 300 MB/archivo y 6 GB para el lote 1, y luego a 10 GB para los 100 recursos).
6. Validación de cada entrada con `ResourceInputSchema` de `@macondo/shared` (`packages/shared/dist/index.js`).

Scripts: `_tools/audio-fetch-details.sh`, `_tools/audio-show.py`, `_tools/audio-plan.py` (selección y metadatos), `_tools/audio-build.py` (descarga/concatenación), `_tools/audio-manifest.py` (verificación, manifiesto e informe), `_tools/audio-validate.js`.

## Filtro legal

- **Grabación**: todas las grabaciones LibriVox están dedicadas al dominio público.
- **Texto**: LibriVox solo verifica el dominio público en EE. UU. Para Colombia (Ley 23 de 1982, art. 21: vida + 80 años) se exigió autor fallecido **en 1945 o antes** según `dod` de la API (o de la ficha del autor en la página del libro, para antologías). Se descartaron autores sin fecha de muerte o fallecidos después de 1945.
- **Traducciones**: se priorizaron obras escritas originalmente en español. Las únicas obras no originales en español son adaptaciones hechas por autores también fallecidos antes de 1946 (José Martí †1895 sobre Laboulaye †1883 y Andersen †1875; Juan Valera †1905 sobre un cuento tradicional japonés; Rafael Pombo †1912, versiones libres de rimas infantiles inglesas tradicionales). Los cuentos populares chilenos son de tradición oral anónima, recogidos y redactados por Ramón Laval (†1929). No se incluyó ninguna traducción cuyo traductor no pudiera identificarse.
- **Aparato editorial**: se omitieron secciones de prólogos, biografías o notas de editores no identificados (La vida es sueño s0, s1, s16; María s0; Mitología s1; Páginas escogidas s1). Se excluyeron biografías y semblanzas (p. ej. «Tres héroes» de La Edad de Oro y la tercera parte de la Mitología de Fernán Caballero), porque otro proceso produce las audiobiografías.

## Lotes

- **Lote 1** (entradas 1–50 del manifiesto): selección general 1.º–11.º, con clásicos latinoamericanos, colombianos y españoles.
- **Lote 2** (entradas 51–100): pedido posterior del usuario, priorizando 1.º–5.º (cuentos populares chilenos de Ramón Laval, más textos de La Edad de Oro, fábulas de Pombo, leyendas), más algunos clásicos para 8.º–11.º.

## Resumen

- Recursos: **100** · Duración total: **111:12:00** (400320 s) · Tamaño total: **3.20 GB** (3202926078 bytes)
- Archivo más grande: 180.3 MiB · Todos en MP3 64 kbps.
- Lote 1: 50 recursos · 80:29:43 · 2.32 GB
- Lote 2: 50 recursos · 30:42:18 · 0.88 GB
- Recursos cuyo rango de grados incluye cada franja (total / lote 1 / lote 2):
  - 1.º–3.º: 45 / 21 / 24
  - 4.º–5.º: 61 / 30 / 31
  - 6.º–8.º: 62 / 28 / 34
  - 9.º–11.º: 52 / 28 / 24
- Recursos de literatura colombiana: 9 (Pombo, Carrasquilla, Isaacs, Rivera).

## Tabla

| Lote | Archivo | LibriVox id (secciones) | Título | Autor (†) | Traductor/adaptador | Lectores | Grados | Duración | SHA-256 (prefijo) | Bytes |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `librivox-6706-s01.mp3` | [6706](https://librivox.org/cuentos-de-la-selva-para-los-ninos-by-horacio-quiroga/) (s1) | La abeja haragana | Horacio Quiroga (1937) | — | AnabelleC | 1–5 | 14:07 | `936a9e74c7b9` | 6776320 |
| 1 | `librivox-6706-s02.mp3` | [6706](https://librivox.org/cuentos-de-la-selva-para-los-ninos-by-horacio-quiroga/) (s2) | Historia de dos cachorros de coatí y de dos cachorros de hombre | Horacio Quiroga (1937) | — | AnabelleC | 2–5 | 16:17 | `b1403598689e` | 7821312 |
| 1 | `librivox-6706-s04.mp3` | [6706](https://librivox.org/cuentos-de-la-selva-para-los-ninos-by-horacio-quiroga/) (s4) | La tortuga gigante | Horacio Quiroga (1937) | — | AnabelleC | 1–5 | 11:27 | `a23a7f765c8d` | 5500416 |
| 1 | `librivox-6706-s05.mp3` | [6706](https://librivox.org/cuentos-de-la-selva-para-los-ninos-by-horacio-quiroga/) (s5) | El paso del Yabebirí | Horacio Quiroga (1937) | — | Mongope | 3–6 | 22:53 | `aac2405d2036` | 10986496 |
| 1 | `librivox-6706-s06.mp3` | [6706](https://librivox.org/cuentos-de-la-selva-para-los-ninos-by-horacio-quiroga/) (s6) | El loro pelado | Horacio Quiroga (1937) | — | Luis Alberto Martín | 1–5 | 12:29 | `ddd5f97a7a15` | 5997056 |
| 1 | `librivox-6706-s07.mp3` | [6706](https://librivox.org/cuentos-de-la-selva-para-los-ninos-by-horacio-quiroga/) (s7) | La guerra de los yacarés | Horacio Quiroga (1937) | — | Joyfull | 3–6 | 24:55 | `66afaf940dfd` | 11958784 |
| 1 | `librivox-6706-s08.mp3` | [6706](https://librivox.org/cuentos-de-la-selva-para-los-ninos-by-horacio-quiroga/) (s8) | La gama ciega | Horacio Quiroga (1937) | — | Mongope | 2–5 | 13:44 | `7d2089a45f58` | 6595584 |
| 1 | `librivox-2162-s03.mp3` | [2162](https://librivox.org/la-edad-de-oro-by-jose-marti/) (s3) | Meñique | José Martí (1895) | José Martí (adaptación de un cuento de Édouard Laboulaye, †1883) | Luigina | 3–7 | 36:54 | `bfc6c4c4157d` | 17710600 |
| 1 | `librivox-2162-s07.mp3` | [2162](https://librivox.org/la-edad-de-oro-by-jose-marti/) (s7) | Bebé y el señor don Pomposo | José Martí (1895) | — | Luigina | 2–5 | 9:56 | `74d3e000ef10` | 4772693 |
| 1 | `librivox-2162-s11.mp3` | [2162](https://librivox.org/la-edad-de-oro-by-jose-marti/) (s11) | Nené traviesa | José Martí (1895) | — | Luigina | 2–5 | 12:55 | `4e05d06f5ad3` | 6200846 |
| 1 | `librivox-2162-s17.mp3` | [2162](https://librivox.org/la-edad-de-oro-by-jose-marti/) (s17) | El camarón encantado | José Martí (1895) | José Martí (adaptación de un cuento de Édouard Laboulaye, †1883) | jaid | 3–7 | 23:18 | `de13e49ff487` | 11186688 |
| 1 | `librivox-2162-s23.mp3` | [2162](https://librivox.org/la-edad-de-oro-by-jose-marti/) (s23) | La muñeca negra | José Martí (1895) | — | Karen Savage | 2–6 | 17:46 | `0da771818aeb` | 8529508 |
| 1 | `librivox-20074-s21.mp3` | [20074](https://librivox.org/fabulas-y-verdades-by-rafael-pombo/) (s21) | Cuentos pintados | Rafael Pombo (1912) | Rafael Pombo (versiones libres de rimas infantiles tradicionales en inglés) | MiltonFMH | 1–4 | 19:41 | `fbe29fc6b57c` | 9459915 |
| 1 | `librivox-20074-s22.mp3` | [20074](https://librivox.org/fabulas-y-verdades-by-rafael-pombo/) (s22–s25) | Cuentos morales para niños formales | Rafael Pombo (1912) | Rafael Pombo (versiones libres de rimas infantiles tradicionales en inglés) | MiltonFMH | 1–5 | 1:28:39 | `d264e31ce549` | 42553212 |
| 1 | `librivox-20074-s01.mp3` | [20074](https://librivox.org/fabulas-y-verdades-by-rafael-pombo/) (s1–s10) | Fábulas y verdades (primera parte) | Rafael Pombo (1912) | — | MiltonFMH | 3–8 | 2:41:27 | `c65157b1bedb` | 77493968 |
| 1 | `librivox-21304.mp3` | [21304](https://librivox.org/en-la-diestra-de-dios-padre-by-tomas-carrasquilla/) (completo) | En la diestra de Dios Padre | Tomás Carrasquilla (1940) | — | Consuelo Aponte | 7–11 | 1:09:09 | `abea889ee693` | 33195523 |
| 1 | `librivox-7662.mp3` | [7662](https://librivox.org/cuentos-adivinanzas-y-refranes-populares-by-fernan-caballero/) (completo) | Cuentos, adivinanzas y refranes populares | Fernán Caballero (1877) | — | Varios (10): gribuongiorne, Kathrine Engan, Etel Buss, Tux… | 2–7 | 2:54:49 | `98fdc54abb85` | 83914447 |
| 1 | `librivox-13232.mp3` | [13232](https://librivox.org/la-mitologia-contada-a-los-ninos-by-fernan-caballero/) (s2–s14) | Mitología contada a los niños | Fernán Caballero (1877) | — | KendalRigans | 4–8 | 1:55:00 | `867793915bfc` | 55199398 |
| 1 | `librivox-15446.mp3` | [15446](https://librivox.org/la-media-docena-by-juan-gualberto-lopez/) (completo) | La media docena: cuentos y fábulas para niños | Juan Gualberto López-Valdemoro, conde de las Navas (1935) | — | KendalRigans | 2–6 | 1:03:27 | `a2445f67defa` | 30454389 |
| 1 | `librivox-19615.mp3` | [19615](https://librivox.org/el-caballero-carmelo-y-otros-cuentos-by-abraham-valdelomar-pinto/) (completo) | El Caballero Carmelo y otros cuentos | Abraham Valdelomar (1919) | — | KendalRigans | 5–10 | 1:36:31 | `4ba28e5370c8` | 46325091 |
| 1 | `librivox-3898-s04.mp3` | [3898](https://librivox.org/relatos-y-cuentos-vol-001/) (s4) | ¡Adiós, Cordera! | Leopoldo Alas «Clarín» (1901) | — | Marian Martin | 5–9 | 24:15 | `26f068ced423` | 11639988 |
| 1 | `librivox-3898-s05.mp3` | [3898](https://librivox.org/relatos-y-cuentos-vol-001/) (s5) | El ratón Pérez | Luis Coloma (1915) | — | Marian Martin | 1–4 | 26:14 | `6e1698906ba1` | 12589582 |
| 1 | `librivox-3898-s06.mp3` | [3898](https://librivox.org/relatos-y-cuentos-vol-001/) (s6) | El alguacil endemoniado | Francisco de Quevedo (1645) | — | Marian Martin | 9–11 | 29:15 | `f52fdd6273f2` | 14041381 |
| 1 | `librivox-3898-s07.mp3` | [3898](https://librivox.org/relatos-y-cuentos-vol-001/) (s7) | El pescadorcito Urashima | Juan Valera (1905) | Juan Valera (versión española de un cuento tradicional japonés) | Marian Martin | 2–6 | 7:41 | `166286d76f8a` | 3686435 |
| 1 | `librivox-4182-s06.mp3` | [4182](https://librivox.org/relatos-y-cuentos-vol-002/) (s6) | La camisa del hombre feliz | Luis Coloma (1915) | — | Omar | 3–7 | 13:05 | `ea56f0720e81` | 6284887 |
| 1 | `librivox-4182-s08.mp3` | [4182](https://librivox.org/relatos-y-cuentos-vol-002/) (s8) | El almohadón de plumas | Horacio Quiroga (1937) | — | Omar | 9–11 | 9:37 | `58ab5a25fffb` | 4614304 |
| 1 | `librivox-4182-s12.mp3` | [4182](https://librivox.org/relatos-y-cuentos-vol-002/) (s12) | La conjuración de las palabras | Benito Pérez Galdós (1920) | — | Marian Martin | 5–10 | 18:10 | `d798ca8d8a24` | 8724959 |
| 1 | `librivox-13609-s05.mp3` | [13609](https://librivox.org/antologia-de-cuentos-hispanoamericanos-by-various/) (s5) | La garita del diablo | Manuel Fernández Juncos (1928) | — | Juan Santana | 5–9 | 20:43 | `8738745fa098` | 9959306 |
| 1 | `librivox-9358.mp3` | [9358](https://librivox.org/fabulas-literarias-by-tomas-de-iriarte/) (completo) | Fábulas literarias | Tomás de Iriarte (1791) | — | Varios (12): Catherine Grissom, Pamela Nagami, Mongope, mariemdover… | 5–10 | 2:12:29 | `b9003aae55a3` | 63595948 |
| 1 | `librivox-21015.mp3` | [21015](https://librivox.org/fabulas-by-felix-maria-de-samaniego/) (completo) | Fábulas | Félix María de Samaniego (1801) | — | Varios (8): Epachuko, Meribau, GatoLunar, mpinedag… | 3–8 | 4:08:03 | `74b9aaedd73c` | 119064385 |
| 1 | `librivox-2527.mp3` | [2527](https://librivox.org/simplemente-dario-by-ruben-dario/) (completo) | Simplemente Darío | Rubén Darío (1916) | — | arturo | 5–11 | 22:28 | `c3a6c16a9f8d` | 10785579 |
| 1 | `librivox-13242.mp3` | [13242](https://librivox.org/rimas-by-gustavo-adolfo-becquer/) (completo) | Rimas | Gustavo Adolfo Bécquer (1870) | — | KendalRigans | 9–11 | 54:01 | `e9285a2bef7b` | 25926565 |
| 1 | `librivox-13497.mp3` | [13497](https://librivox.org/coplas-by-jorge-manrique/) (completo) | Coplas por la muerte de su padre | Jorge Manrique (1479) | — | KendalRigans | 9–11 | 11:54 | `192a89467347` | 5718336 |
| 1 | `librivox-15253.mp3` | [15253](https://librivox.org/paginas-escogidas-by-antonio-machado-ruiz/) (s2–s12) | Páginas escogidas (poesía) | Antonio Machado (1939) | — | KendalRigans | 9–11 | 1:28:39 | `739da2f5922a` | 42555920 |
| 1 | `librivox-5079-s09.mp3` | [5079](https://librivox.org/leyendas-by-gustavo-adolfo-becquer/) (s9) | El rayo de luna | Gustavo Adolfo Bécquer (1870) | — | Omar | 8–11 | 24:53 | `ab1bdf2fad06` | 11948032 |
| 1 | `librivox-5079-s21.mp3` | [5079](https://librivox.org/leyendas-by-gustavo-adolfo-becquer/) (s21) | Maese Pérez el organista | Gustavo Adolfo Bécquer (1870) | — | Gabriela Cowan | 7–11 | 36:55 | `d378d0a12ad4` | 17721344 |
| 1 | `librivox-5079-s08.mp3` | [5079](https://librivox.org/leyendas-by-gustavo-adolfo-becquer/) (s8) | El monte de las ánimas | Gustavo Adolfo Bécquer (1870) | — | Elena del Valle | 8–11 | 19:21 | `28224889addb` | 9290752 |
| 1 | `librivox-8509.mp3` | [8509](https://librivox.org/el-gaucho-martin-fierro-by-jose-hernandez/) (completo) | El gaucho Martín Fierro | José Hernández (1886) | — | Paolo Paez, Victor Villarraza, gribuongiorne | 8–11 | 1:32:12 | `befd372f0b73` | 44257428 |
| 1 | `librivox-3579.mp3` | [3579](https://librivox.org/lazarillo-de-tormes/) (completo) | Lazarillo de Tormes | Anónimo (anónimo, 1554) | — | Tux | 8–11 | 1:56:37 | `38ee512b269d` | 55980757 |
| 1 | `librivox-13104.mp3` | [13104](https://librivox.org/la-vida-es-sueno-by-pedro-calderon-de-la-barca/) (s2–s15) | La vida es sueño | Pedro Calderón de la Barca (1681) | — | KendalRigans | 9–11 | 1:52:12 | `93837db26752` | 53857955 |
| 1 | `librivox-20704.mp3` | [20704](https://librivox.org/el-si-de-las-ninas-by-leandro-fernandez-de-moratin/) (completo) | El sí de las niñas | Leandro Fernández de Moratín (1828) | — | Epachuko | 9–11 | 2:05:06 | `1c0e662703f5` | 60046897 |
| 1 | `librivox-17676-s01.mp3` | [17676](https://librivox.org/maria-by-jorge-isaacs/) (s1–s15) | María (parte 1 de 2) | Jorge Isaacs (1895) | — | MiltonFMH | 9–11 | 6:33:55 | `0566798692f0` | 189083203 |
| 1 | `librivox-17676-s16.mp3` | [17676](https://librivox.org/maria-by-jorge-isaacs/) (s16–s29) | María (parte 2 de 2) | Jorge Isaacs (1895) | — | MiltonFMH | 9–11 | 5:35:35 | `6e8f7989bdd7` | 161083284 |
| 1 | `librivox-21023.mp3` | [21023](https://librivox.org/leyendas-de-los-indios-guaranies-by-filiberto-de-oliveira-cezar/) (completo) | Leyendas de los indios guaraníes | Filiberto de Oliveira Cézar (1910) | — | mpinedag, Epachuko | 5–10 | 2:43:17 | `1a32be467f4e` | 78378385 |
| 1 | `librivox-20630.mp3` | [20630](https://librivox.org/leyendas-de-los-indios-quichuas-by-filiberto-de-oliveira-cezar/) (completo) | Leyendas de los indios quichuas | Filiberto de Oliveira Cézar (1910) | — | Varios (5): Lu, Meribau, mpinedag, Cristina Peláez… | 5–10 | 1:54:20 | `5903a0d5061b` | 54882804 |
| 1 | `librivox-18867-s01.mp3` | [18867](https://librivox.org/la-voragine-by-jose-eustasio-rivera/) (s1–s16) | La vorágine (parte 1 de 2) | José Eustasio Rivera (1928) | — | MiltonFMH | 10–11 | 5:37:06 | `93cc0da24eea` | 161808876 |
| 1 | `librivox-18867-s17.mp3` | [18867](https://librivox.org/la-voragine-by-jose-eustasio-rivera/) (s17–s33) | La vorágine (parte 2 de 2) | José Eustasio Rivera (1928) | — | MiltonFMH | 10–11 | 6:26:10 | `03a07b665cd7` | 185362754 |
| 1 | `librivox-16285.mp3` | [16285](https://librivox.org/marianela-by-benito-perez-galdos/) (completo) | Marianela | Benito Pérez Galdós (1920) | — | Maritza Mateo | 8–11 | 6:01:30 | `dee2da40d122` | 173519443 |
| 1 | `librivox-15710.mp3` | [15710](https://librivox.org/tradiciones-peruanas-by-ricardo-palma/) (completo) | Tradiciones peruanas (selección) | Ricardo Palma (1919) | — | Varios (10): Epachuko, evafolch, RQuintero, mpinedag… | 7–11 | 5:27:18 | `1c1ec1e0081a` | 157102020 |
| 1 | `librivox-8805.mp3` | [8805](https://librivox.org/el-sombrero-de-tres-picos-by-pedro-antonio-de-alarcon-y-ariza/) (completo) | El sombrero de tres picos | Pedro Antonio de Alarcón (1891) | — | Tux | 9–11 | 2:51:16 | `f177756ac501` | 82205614 |
| 2 | `librivox-21132-s02.mp3` | [21132](https://librivox.org/cuentos-populares-en-chile-by-ramon-laval/) (s2) | El pescadito encantado | Ramón Laval (recopilador) (1929) | — | juanina | 1–5 | 10:47 | `22babb62bc50` | 5182850 |
| 2 | `librivox-21132-s04.mp3` | [21132](https://librivox.org/cuentos-populares-en-chile-by-ramon-laval/) (s4) | La tenquita | Ramón Laval (recopilador) (1929) | — | rroderick | 1–5 | 8:05 | `3c4985a4b5cc` | 3889847 |
| 2 | `librivox-21132-s05.mp3` | [21132](https://librivox.org/cuentos-populares-en-chile-by-ramon-laval/) (s5) | El gallito | Ramón Laval (recopilador) (1929) | — | Consuelo Aponte | 1–4 | 4:55 | `6ae2166d78d0` | 2362351 |
| 2 | `librivox-21132-s06.mp3` | [21132](https://librivox.org/cuentos-populares-en-chile-by-ramon-laval/) (s6) | La tortilla o el canarito encantado | Ramón Laval (recopilador) (1929) | — | Consuelo Aponte | 2–6 | 29:20 | `3501649e730f` | 14099738 |
| 2 | `librivox-21132-s09.mp3` | [21132](https://librivox.org/cuentos-populares-en-chile-by-ramon-laval/) (s9) | La huachita cordera | Ramón Laval (recopilador) (1929) | — | rroderick | 1–5 | 15:03 | `f1379436b457` | 7230387 |
| 2 | `librivox-21132-s11.mp3` | [21132](https://librivox.org/cuentos-populares-en-chile-by-ramon-laval/) (s11) | El Miñique | Ramón Laval (recopilador) (1929) | — | GatoLunar | 2–6 | 13:30 | `e2465e6534c5` | 6486715 |
| 2 | `librivox-21132-s12.mp3` | [21132](https://librivox.org/cuentos-populares-en-chile-by-ramon-laval/) (s12) | Los tres consejos | Ramón Laval (recopilador) (1929) | — | GatoLunar | 3–7 | 16:23 | `e689e6c05f17` | 7870713 |
| 2 | `librivox-21132-s13.mp3` | [21132](https://librivox.org/cuentos-populares-en-chile-by-ramon-laval/) (s13) | El loro adivino | Ramón Laval (recopilador) (1929) | — | GatoLunar | 2–6 | 25:23 | `06603c48e28b` | 12197987 |
| 2 | `librivox-21132-s14.mp3` | [21132](https://librivox.org/cuentos-populares-en-chile-by-ramon-laval/) (s14) | El medio pollo | Ramón Laval (recopilador) (1929) | — | juanina | 1–5 | 13:20 | `63559a08ea80` | 6410573 |
| 2 | `librivox-21132-s19.mp3` | [21132](https://librivox.org/cuentos-populares-en-chile-by-ramon-laval/) (s19) | El compadrito león, potito quemado | Ramón Laval (recopilador) (1929) | — | Epachuko | 2–6 | 23:53 | `20854f11e044` | 11480072 |
| 2 | `librivox-21132-s21.mp3` | [21132](https://librivox.org/cuentos-populares-en-chile-by-ramon-laval/) (s21) | Chilindrín y Chilindrón | Ramón Laval (recopilador) (1929) | — | rroderick | 2–6 | 22:08 | `12ed56211602` | 10633893 |
| 2 | `librivox-21132-s22.mp3` | [21132](https://librivox.org/cuentos-populares-en-chile-by-ramon-laval/) (s22) | Juan Valiente, el de la vaquilla | Ramón Laval (recopilador) (1929) | — | Epachuko | 2–6 | 7:55 | `7cfe17998a85` | 3809750 |
| 2 | `librivox-21132-s23.mp3` | [21132](https://librivox.org/cuentos-populares-en-chile-by-ramon-laval/) (s23) | La sapita encantada | Ramón Laval (recopilador) (1929) | — | Epachuko | 1–5 | 15:31 | `c1ee9595e75e` | 7457358 |
| 2 | `librivox-21132-s24.mp3` | [21132](https://librivox.org/cuentos-populares-en-chile-by-ramon-laval/) (s24) | Gallarín y el gigante | Ramón Laval (recopilador) (1929) | — | Nicole J. LeBoeuf | 2–6 | 29:54 | `5bc5ff30259e` | 14367070 |
| 2 | `librivox-21132-s26.mp3` | [21132](https://librivox.org/cuentos-populares-en-chile-by-ramon-laval/) (s26) | La lorita encantada | Ramón Laval (recopilador) (1929) | — | MiltonFMH | 1–5 | 13:10 | `94e3edabbc62` | 6329832 |
| 2 | `librivox-21132-s28.mp3` | [21132](https://librivox.org/cuentos-populares-en-chile-by-ramon-laval/) (s28) | El león y el hombre | Ramón Laval (recopilador) (1929) | — | Epachuko | 2–6 | 12:13 | `6d9679bc226e` | 5872337 |
| 2 | `librivox-21132-s36.mp3` | [21132](https://librivox.org/cuentos-populares-en-chile-by-ramon-laval/) (s36) | Por qué el jote tiene la cabeza y el cogote sin plumas | Ramón Laval (recopilador) (1929) | — | Consuelo Aponte | 1–5 | 4:16 | `9938bba83f31` | 2048196 |
| 2 | `librivox-21132-s17.mp3` | [21132](https://librivox.org/cuentos-populares-en-chile-by-ramon-laval/) (s17) | El árbol de las tres manzanas de oro | Ramón Laval (recopilador) (1929) | — | Consuelo Aponte | 2–6 | 24:52 | `932d357bf425` | 11950119 |
| 2 | `librivox-2162-s00.mp3` | [2162](https://librivox.org/la-edad-de-oro-by-jose-marti/) (s0) | A los niños que lean La Edad de Oro | José Martí (1895) | — | Karen Savage | 3–7 | 5:18 | `7a9922523c43` | 2548114 |
| 2 | `librivox-2162-s05.mp3` | [2162](https://librivox.org/la-edad-de-oro-by-jose-marti/) (s5) | La Ilíada, de Homero | José Martí (1895) | — | Christian Al-Kadi | 5–9 | 33:27 | `c205c8ed0209` | 16053614 |
| 2 | `librivox-2162-s06.mp3` | [2162](https://librivox.org/la-edad-de-oro-by-jose-marti/) (s6) | Un juego nuevo y otros viejos | José Martí (1895) | — | Luigina | 3–7 | 13:26 | `3c0c5b936d0b` | 6449130 |
| 2 | `librivox-2162-s09.mp3` | [2162](https://librivox.org/la-edad-de-oro-by-jose-marti/) (s9) | La historia del hombre, contada por sus casas | José Martí (1895) | — | Alejandra Gonzalez | 4–8 | 30:09 | `304ae6445a09` | 14475425 |
| 2 | `librivox-2162-s13.mp3` | [2162](https://librivox.org/la-edad-de-oro-by-jose-marti/) (s13) | Las ruinas indias | José Martí (1895) | — | phossil | 5–9 | 33:53 | `a295847f650d` | 16267606 |
| 2 | `librivox-2162-s21.mp3` | [2162](https://librivox.org/la-edad-de-oro-by-jose-marti/) (s21) | Un paseo por la tierra de los anamitas | José Martí (1895) | — | mpinedag | 5–9 | 26:11 | `3c1e5e3d2c7e` | 12570151 |
| 2 | `librivox-2162-s22.mp3` | [2162](https://librivox.org/la-edad-de-oro-by-jose-marti/) (s22) | Historia de la cuchara y el tenedor | José Martí (1895) | — | Andy | 3–7 | 17:45 | `b54bd4f48604` | 8517616 |
| 2 | `librivox-2162-s24.mp3` | [2162](https://librivox.org/la-edad-de-oro-by-jose-marti/) (s24) | Cuentos de elefantes | José Martí (1895) | — | Bob Sage | 3–7 | 23:26 | `3672507fdd8e` | 11248964 |
| 2 | `librivox-2162-s25.mp3` | [2162](https://librivox.org/la-edad-de-oro-by-jose-marti/) (s25) | Los dos ruiseñores | José Martí (1895) | José Martí (adaptación de «El ruiseñor» de Hans Christian Andersen, †1875) | Bob Sage | 3–7 | 34:08 | `c7db02c6d47b` | 16383382 |
| 2 | `librivox-20074-s11.mp3` | [20074](https://librivox.org/fabulas-y-verdades-by-rafael-pombo/) (s11–s20) | Fábulas y verdades (segunda parte) | Rafael Pombo (1912) | — | MiltonFMH | 3–8 | 3:32:05 | `e4192ca33f87` | 101799132 |
| 2 | `librivox-5079-s20.mp3` | [5079](https://librivox.org/leyendas-by-gustavo-adolfo-becquer/) (s20) | Los ojos verdes | Gustavo Adolfo Bécquer (1870) | — | Rosacarmela | 8–11 | 20:40 | `1bcd6dbc000d` | 9922048 |
| 2 | `librivox-5079-s06.mp3` | [5079](https://librivox.org/leyendas-by-gustavo-adolfo-becquer/) (s6) | El gnomo | Gustavo Adolfo Bécquer (1870) | — | Gabriela Cowan | 6–10 | 37:57 | `570916b6a41f` | 18218496 |
| 2 | `librivox-5079-s13.mp3` | [5079](https://librivox.org/leyendas-by-gustavo-adolfo-becquer/) (s13) | La corza blanca | Gustavo Adolfo Bécquer (1870) | — | frauka | 7–11 | 46:40 | `20d0edb1c34f` | 22398976 |
| 2 | `librivox-5079-s16.mp3` | [5079](https://librivox.org/leyendas-by-gustavo-adolfo-becquer/) (s16) | La cueva de la mora | Gustavo Adolfo Bécquer (1870) | — | DreamVoz | 7–11 | 12:30 | `95113bd06078` | 5998592 |
| 2 | `librivox-4182-s02.mp3` | [4182](https://librivox.org/relatos-y-cuentos-vol-002/) (s2) | El duende-beso | Juan Valera (1905) | — | Legentis | 7–11 | 16:03 | `faf4334f31a0` | 7705518 |
| 2 | `librivox-4182-s03.mp3` | [4182](https://librivox.org/relatos-y-cuentos-vol-002/) (s3) | La muñequita | Juan Valera (1905) | — | ensimismada | 6–10 | 17:00 | `bd7dacb795f2` | 8163188 |
| 2 | `librivox-3898-s02.mp3` | [3898](https://librivox.org/relatos-y-cuentos-vol-001/) (s2) | Los buques suicidantes | Horacio Quiroga (1937) | — | Marian Martin | 8–11 | 8:52 | `dafce4faf27d` | 4254025 |
| 2 | `librivox-13609-s04.mp3` | [13609](https://librivox.org/antologia-de-cuentos-hispanoamericanos-by-various/) (s4) | El lago encantado | Amado Nervo (1919) | — | Claudia Hernández | 5–9 | 12:16 | `db4067fb5b40` | 5898938 |
| 2 | `librivox-13609-s07.mp3` | [13609](https://librivox.org/antologia-de-cuentos-hispanoamericanos-by-various/) (s7) | El extranjero | Pedro Antonio de Alarcón (1891) | — | Ditirambo | 9–11 | 23:27 | `39364f5d3840` | 11269665 |
| 2 | `librivox-13609-s12.mp3` | [13609](https://librivox.org/antologia-de-cuentos-hispanoamericanos-by-various/) (s12) | Dos sabios | Leopoldo Alas «Clarín» (1901) | — | Epachuko | 9–11 | 19:48 | `84112f95058f` | 9515394 |
| 2 | `librivox-21264-s01.mp3` | [21264](https://librivox.org/leyendas-puertorriquenas-by-cayetano-coll-y-toste/) (s1) | Guanina | Cayetano Coll y Toste (1930) | — | MiltonFMH | 6–10 | 25:16 | `65a28ed7529b` | 12143615 |
| 2 | `librivox-21264-s21.mp3` | [21264](https://librivox.org/leyendas-puertorriquenas-by-cayetano-coll-y-toste/) (s21) | El pirata Cofresí | Cayetano Coll y Toste (1930) | — | MiltonFMH | 6–10 | 12:23 | `072303058e9b` | 5953108 |
| 2 | `librivox-19098-s02.mp3` | [19098](https://librivox.org/leyendas-historicas-mexicanas-by-heriberto-frias/) (s2) | La fundación de Tenochtitlán | Heriberto Frías (1925) | — | Pérdida en el río | 4–8 | 12:03 | `b7c74405dfd8` | 5789323 |
| 2 | `librivox-19267-s10.mp3` | [19267](https://librivox.org/tradiciones-argentinas-by-pastor-servando-obligado/) (s10) | ¿Por qué el Pergamino se llama Pergamino? | Pastor Servando Obligado (1924) | — | mpinedag | 5–9 | 10:26 | `1376601da6f8` | 5013031 |
| 2 | `librivox-16146.mp3` | [16146](https://librivox.org/cuentos-de-navidad-y-reyes-by-emilia-pardo-bazan/) (completo) | Cuentos de Navidad y Reyes | Emilia Pardo Bazán (1921) | — | Varios (9): Epachuko, Mongope, Odal, mpinedag… | 7–11 | 3:34:59 | `31132ea02d25` | 103189048 |
| 2 | `librivox-15087.mp3` | [15087](https://librivox.org/la-gitanilla-by-miguel-de-cervantes-saavedra/) (completo) | La gitanilla | Miguel de Cervantes (1616) | — | KendalRigans | 9–11 | 2:14:48 | `4988ee2a6a63` | 64703570 |
| 2 | `librivox-13341.mp3` | [13341](https://librivox.org/fuente-ovejuna-by-felix-arturo-lope-de-vega/) (completo) | Fuente Ovejuna | Félix Lope de Vega (1635) | — | KendalRigans | 10–11 | 1:33:42 | `a81d4f58dcea` | 44972973 |
| 2 | `librivox-16967.mp3` | [16967](https://librivox.org/don-juan-by-jose-zorrilla-y-moral/) (completo) | Don Juan Tenorio | José Zorrilla (1893) | — | Epachuko | 9–11 | 2:42:40 | `b3729347a656` | 78078679 |
| 2 | `librivox-19128.mp3` | [19128](https://librivox.org/el-estudiante-de-salamanca-by-jose-de-espronceda/) (completo) | El estudiante de Salamanca | José de Espronceda (1842) | — | Victor Villarraza | 10–11 | 1:37:35 | `c24307fa91a4` | 46839590 |
| 2 | `librivox-11486.mp3` | [11486](https://librivox.org/la-cautiva-by-esteban-echeverria/) (completo) | La cautiva | Esteban Echeverría (1851) | — | mariemdover | 9–11 | 1:20:46 | `b282f63cf34a` | 38766899 |
| 2 | `librivox-12389.mp3` | [12389](https://librivox.org/fausto-by-estanislao-del-campo/) (completo) | Fausto (impresiones del gaucho Anastasio el Pollo) | Estanislao del Campo (1880) | — | mariemdover | 8–11 | 43:17 | `15224eb12168` | 20776098 |
| 2 | `librivox-21306.mp3` | [21306](https://librivox.org/a-mi-madre-by-rosalia-de-castro/) (completo) | A mi madre | Rosalía de Castro (1885) | — | Lu | 9–11 | 18:47 | `93547061091c` | 9013013 |

## Exclusiones notables

- **Biografías** (las produce otro agente como AUDIOBIOGRAPHY): «Tres héroes» (Martí), *La vida de Rubén Darío*, *Vida de Lord Byron*, etc.
- **Duplicados de `demo-content/`**: «Las medias de los flamencos» (Quiroga; LibriVox 6706 s3 y también Relatos y cuentos 001 s1) y «Los zapaticos de rosa» (Martí; 2162 s19).
- **Autor fallecido después de 1945 o sin fecha**: Juan Ramón Jiménez (*Platero y yo*, †1958), Pío Baroja (†1956), Mariano Azuela (†1952), Alfonso Reyes (†1959), Oliverio Girondo (†1967), Pablo Neruda (†1973), Julio Camba (†1962), Vicente Huidobro (†1948; «La montaña» en la Antología de cuentos hispanoamericanos), H. G. Wells (†1946), Luis Eduardo Pacheco (†1976), *Supersticiones y leyendas mayas* (autor sin fecha de muerte).
- **Traducciones con traductor no identificado** (texto de autor antiguo pero traducción sin datos verificables): Fábulas de Esopo (fuente: traducción web moderna), Cuentos de Grimm (fuente: cuentosdegrimm.com), Perrault, Andersen (*Cuentos escogidos*, traductor no indicado), Madame d’Aulnoy, Schmid (*Cuentos nuevos*), Afanásiev (*Cuentos populares rusos*), Frobenius, *Alicia* abreviada (1914, traductor anónimo), *Las mil noches y una noche*, *Simbad*, Homero, Shakespeare, Verne, Dickens, etc. Esto es lo que más limita la oferta para 1.º–3.º.
- **Contenido o fuente no apropiados para primaria**: «Delgadina y el culebrón» (Laval; tema del romance de Delgadina), chascarros breves de Laval de menos de 3 minutos o con burlas (s29–s35, s37–s40); Apéndice de *Fábulas y verdades* (ensayo sobre un método de lectura); *Cuentos mejicanos* de Cornyn (autores de cada texto no identificados en la API); *Supersticiones y leyendas mayas* (autor sin fecha de muerte); *Costa Rica pintoresca* y *Cuentos mexicanos* (sin audio publicado).
- **Duplicados internos evitados**: «La hormiguita» y «Los caballeros del pez» (ya en Fernán Caballero 7662), «Historia de dos cachorros de coatí» (Relatos 002 s7, ya en 6706), «El resucitado» y «Los duendes del Cuzco» (ya en *Tradiciones peruanas*), «La garita del diablo» de Coll y Toste (ya en la versión de Fernández Juncos), «¡Adiós, Cordera!» de la Antología (ya en Relatos 001).
- **Obras largas divididas** (superan 300 MB / ~10 h): *María* (12,3 h) y *La vorágine* (12 h) se dividieron en dos partes cada una, por secciones completas. Con el límite ampliado se añadieron *Marianela*, *Tradiciones peruanas*, *La vorágine* y *El sombrero de tres picos*, y se retiraron «El lago encantado» y «Un espanto de verdad» (descripción no verificable) y «Los duendes del Cuzco» de Relatos y cuentos 002 (incluida ya en *Tradiciones peruanas*).
- **Sin audio publicado**: *Policarpa Salabarrieta* (Constancio Franco Vargas), proyecto sin archivos en la API.
- *La Navidad en las montañas* (Altamirano): la fuente es una edición escolar estadounidense con posible aparato editorial; no verificado, se dejó fuera.

## Pendiente de revisión humana

- Revisión pedagógica de todas las fichas (`status: DRAFT`), en especial las marcadas en `reviewNotes` (terror, violencia, temas adultos, expresiones de época).
- Relatos y cuentos 001 (LibriVox 3898): la página marca las secciones con idioma «en»; confirmar escuchando que la lectura en español es clara.
- Lote 2: 18 cuentos populares de Laval tienen descripción genérica (basada en el título); conviene escucharlos o leerlos (Project Gutenberg #63424) antes de publicar.
- Escucha de control de los archivos concatenados (las transiciones entre secciones no se revisaron de oído).
- Descripciones redactadas sin escuchar los audios: se basan en el conocimiento de las obras y en los títulos de sección; conviene cotejarlas.

## Portadas (2026-11-11)

Los 100 audiolibros usan ahora el **arte del proyecto publicado por LibriVox en archive.org** (`url_iarchive` de la API → JPG del ítem que no es miniatura ni forma de onda), de dominio público por las normas de LibriVox; 41 proyectos, de modo que las secciones de una misma obra comparten portada. Son imágenes de 300 × 300 px; se sirven normalizadas a JPEG. Procedencia en `coverCredit` de `audiolibros.manifest.json`. Ver ADR-019.
