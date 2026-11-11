# Audiobiografías y audioresúmenes — método, voz, fuentes y verificación

Generado el **2026-10-31** por el agente de audiobiografías/audioresúmenes. **30 audiobiografías** (14 de LibriVox + 16 con guion original) y **20 audioresúmenes** (guion original). Duración total **5.96 h**, **171.9 MB**. Todas las entradas en `status: DRAFT`.

Manifiestos: `audiobiografias.manifest.json`, `audioresumenes.manifest.json` (formato de `FORMATO.md`, con los campos extra `text`, `timeline`, `funFacts`, `questions`, `relatedTitle`, `relatedCreator`). Archivos: `audiobiografias/*.mp3`, `audioresumenes/*.mp3`.

## Criterio legal

- **Textos**: dominio público en Colombia (Ley 23 de 1982: autor y traductor fallecidos antes de 1946) **o** texto original escrito para el proyecto. Los guiones originales se redactaron con palabras propias; los hechos se apoyan en datos históricos ampliamente documentados (los hechos no son objeto de derecho de autor). No se copiaron frases de Wikipedia ni de otras fuentes. Las únicas citas literales son versos breves de obras en dominio público (p. ej., Candelario Obeso, †1884).
- **Grabaciones LibriVox**: dedicadas al dominio público por LibriVox (https://librivox.org/pages/public-domain/). Se usaron solo los archivos de 64 kbps de archive.org.
- **Personas vivas o fallecidas recientemente**: excluidas. Gabriela Mistral (†1957) aparece solo como tema de una biografía original; no se citan sus poemas (no están en dominio público en Colombia).
- **Resúmenes**: obras derivadas breves, originales, de obras en dominio público; se leyó el texto fuente antes de redactar (ver tabla).

## Voz sintética (guiones originales)

- **Motor**: Piper TTS (`piper-tts` 1.8.0, paquete de OHF-Voice/piper1-gpl; la licencia GPL del software no se extiende al audio generado), instalado en `catalogo-dp/_tmp/tts/venv` (Python 3.14).
- **Voz**: `es_ES-carlfm-x_low` de https://huggingface.co/rhasspy/piper-voices (repositorio con licencia **MIT**). MODEL_CARD: dataset https://github.com/carlfm01/my-speech-datasets, licencia **Public domain**, modelo *trained from scratch*. Copia del MODEL_CARD en `catalogo-dp/_tmp/tts/voices/MODEL_CARD`.
- **Por qué esta voz**: se revisaron los MODEL_CARD de todas las voces en español. Las de mayor calidad (`es_ES-davefx-medium`, `es_ES-sharvard-medium`, `es_AR-daniela-high`, `es_MX-ald-*`) son ajustes finos (*finetuned*) del modelo inglés `lessac`, cuyo dataset (Blizzard 2013) tiene una licencia restrictiva; `es_ES-mls_*` parte del modelo `ryan`; `es_MX-claude-high` no documenta su base. `carlfm` es la única entrenada desde cero con datos de dominio público, por lo que se eligió pese a su calidad *x_low* (16 kHz).
- **Parámetros**: length_scale 1.3, noise_scale 0.6, noise_w 0.7; 0,35 s de silencio entre frases y 0,9 s entre párrafos. Conversión: ffmpeg/libmp3lame, **64 kbps, mono, 44,1 kHz**, etiquetas ID3v2.3.
- **Calidad**: inteligible pero robótica; algunas consonantes finales se debilitan. Se recomienda regrabar con narrador humano (con cesión de derechos firmada) antes de producción. No se usó la voz de macOS (`say`), cuya licencia es personal/no comercial.
- **Prueba de inteligibilidad** (transcripción automática con faster-whisper `small` de un fragmento de cada uno de varios archivos generados; solo control, no sustituye la escucha humana):

```
[audiobiografias/macondo-francisco-jose-de-caldas.mp3, primeros 40 s] a Uyobiografía de Francisco José de Caldas, biblioteca macondo. Francisco José de Caldas nació en Popayán el 4 de octubre de 1768. Su familia quería que fuera abogado y en efecto estudió derecho en el colegio mayor de nuestra Señora del Rosario en Santa Fe, pero su verdadera pasión le estaba en otra parte. En las estrellas, las montañas, las plantas y los números. De reideso en el sur del Virreinato, Caldas se dedicó al comercio para ganarse la vida. Mientras viajaba con sus merepancias por caminos de Herradura, observaba el cielo media distancias.
[audiobiografias/macondo-benkos-bioho.mp3, primeros 40 s] Audio-biografía de Bencos-Bio, Biblioteca Macondo. La historia de Bencos-Bio comienza muy lejos de Colombia, en la costa occidental de África. Según la tradición, nació en la región de las Islas Vijagos, en la actual Quineavisao, en la segunda mitad del siglo XVI. Allí fue capturado por traficantes de personas y llevado, encadenado, en un bar con egreero a través del Océano Atlántico. Llevo a Cartagena de Indias, que entonces era uno de los puertos más importantes del comercio de personas esclavizadas en América. Hombres, mujeres y niños africanos eran vendidos como si fueran mercancía...
[audioresumenes/macondo-raton-perez.mp3, primeros 40 s] Audier Suman de Raton Pérez, de Luis Coloma, Biblio Otec Camacondo. Este cuento fue escrito hacia 1891 por el padre Luis Coloma para un niño de verdad. El pequeño rey Alfonso XIII de España. Según se cuenta, lo escribió cuando al niño rey se le cayó un diente. En el cuento, el protagonista es el rey Guby, un niño pequeño que reina con la ayuda de su madre. Un día se le mueve un diente y los médicos de la corte se lo sacan. Su mamá, la reina, le dice que escriba una carta al ratón Pérez y que ponga el diente debajo de la almohada. Esa noche apareció un ratoncito muy eleirante,
[audioresumenes/macondo-don-quijote.mp3, primeros 40 s] Audió resumen de Don Quijote de la Mancha, de Miguel de Cervantes Saavedra, biblioteca macondo. El ingenioso Hidalgo Don Quijote de la Mancha, de Miguel de Cervantes, es considerado la primera novela moderna y ya obra más importante de la lengua española. La primera parte se publicó en 1605 y la segunda en 1615. En un lugar de la Mancha vive un Hidalgo de unos 50 años, Alonso Quijano. Lee tantos libros de caballetías que pierde el juicio y decide hacerse caballero andante para deshacer injusticias. Y en que unas armas viejas llaman su flaco caballo rocinante, se hace llamar Don Quijote de la Mancha.
```

## Método

1. **LibriVox**: catálogo en español (588 proyectos; el filtro `language` de la API no filtra, se filtró localmente) y metadatos extendidos (`?id=N&extended=1`) de los candidatos biográficos. Descarga secuencial con `curl`, User-Agent descriptivo y 1,5 s de pausa (`_tools/biores-lv-download.sh`), solo `_64kb.mp3`.
2. **Revisión de contenido**: se leyó el texto fuente cuando estaba disponible (Gutenberg: Martí, Ramón y Cajal, Lummis) y, cuando no, se transcribió el audio con faster-whisper (`_tools/biores-transcribe.py`) para revisar el contenido (Fernán Caballero, Darío, Obregón, Confucio, Gimeno de Flaquer). Se descartaron 4 secciones tras la revisión (ver `_tools/biores-lv-meta.py`, `DESCARTADAS`). Se cambió la selección de Ramón y Cajal de los caps. I–II a los caps. III–IV (más narrativos).
3. **Guiones originales** (`_tools/biores-bios.py`, `_tools/biores-resumenes.py`) → síntesis con Piper (`_tools/biores-tts.py`, `_tools/biores-build.py`).
4. **Verificación** (`_tools/biores-verify.py`): bytes mágicos (ID3/sincronía MPEG), `ffprobe` (códec, duración → `durationSeconds`, bitrate, canales), SHA-256 y tamaño. **Validación** (`_tools/biores-validate.js`) de cada entrada con `ResourceInputSchema` de `packages/shared/dist/index.js` más comprobaciones propias (DRAFT, archivo existente, ≥3 preguntas, índice de respuesta válido, timeline/funFacts en biografías). Resultado:

```
audiobiografias.manifest.json 30 entradas
audioresumenes.manifest.json 20 entradas
50 entradas validadas, 0 fallas
```

Reproducir: `bash catalogo-dp/_tools/biores-lv-download.sh` → `catalogo-dp/_tmp/tts/venv/bin/python -I catalogo-dp/_tools/biores-build.py` → `python3 -I catalogo-dp/_tools/biores-verify.py` → `node catalogo-dp/_tools/biores-validate.js` → `python3 -I catalogo-dp/_tools/biores-fuentes.py`.

## Audiobiografías de LibriVox

| Archivo | Obra / autor (†) | Sección(es) y lectores | Grados | Duración | Bytes | SHA-256 (prefijo) |
|---|---|---|---|---|---|---|
| `audiobiografias/librivox-2162-marti-musicos-poetas-y-pintores.mp3` | Músicos, poetas y pintores (La Edad de Oro) — José Martí (†1895) | LibriVox #2162, sección(es) 14; Bob Sage (voluntarios de LibriVox) | 6–11 | 41:19 | 19832598 | `3c3553b0cf32ecfd` |
| `audiobiografias/librivox-2162-marti-tres-heroes.mp3` | Tres héroes (La Edad de Oro) — José Martí (†1895) | LibriVox #2162, sección(es) 1; Luigina (voluntarios de LibriVox) | 6–11 | 15:59 | 7672060 | `ffe3d8c5402f4165` |
| `audiobiografias/librivox-13232-caballero-aristoteles-heraclito-democrito.mp3` | Aristóteles, Heráclito y Demócrito (Historia de los grandes hombres de la Grecia) — Fernán Caballero (†1877) | LibriVox #13232, sección(es) 17; KendalRigans (voluntarios de LibriVox) | 7–11 | 6:25 | 3081483 | `47fa7a1015f5bc54` |
| `audiobiografias/librivox-2162-marti-el-padre-las-casas.mp3` | El Padre Las Casas (La Edad de Oro) — José Martí (†1895) | LibriVox #2162, sección(es) 18; jaid (voluntarios de LibriVox) | 7–11 | 25:49 | 12391871 | `4bd39e7f9ad896b4` |
| `audiobiografias/librivox-13232-caballero-esopo-y-poetas-griegos.mp3` | Esopo, poetas griegos e Hipócrates (Historia de los grandes hombres de la Grecia) — Fernán Caballero (†1877) | LibriVox #13232, sección(es) 22; KendalRigans (voluntarios de LibriVox) | 7–11 | 8:02 | 3862853 | `d58fd31fe13b93d7` |
| `audiobiografias/librivox-13232-caballero-licurgo-socrates-platon.mp3` | Licurgo, Sócrates y Platón (Historia de los grandes hombres de la Grecia) — Fernán Caballero (†1877) | LibriVox #13232, sección(es) 16; KendalRigans (voluntarios de LibriVox) | 8–11 | 6:11 | 2976462 | `185fe1016152c840` |
| `audiobiografias/librivox-19586-ramon-y-cajal-recuerdos-infancia.mp3` | Recuerdos de mi vida: infancia (capítulos III y IV) — Santiago Ramón y Cajal (†1934) | LibriVox #19586, sección(es) 4, 5; Epachuko (voluntarios de LibriVox) | 8–11 | 25:05 | 12036849 | `812f1f71e028f307` |
| `audiobiografias/librivox-22907-confucio-vida-de-confucio.mp3` | Vida de Confucio (Vida y pensamientos morales de Confucio) — Pierre-Charles Levesque (compilación) (†1812); trad. Enrique Ataide y Portugal (†1815) | LibriVox #22907, sección(es) 3; Fernando Falcoff (voluntarios de LibriVox) | 8–11 | 12:52 | 6185736 | `a673c76ebe7e9782` |
| `audiobiografias/librivox-22609-lummis-colon-el-descubridor.mp3` | Colón el descubridor (Los exploradores españoles del siglo XVI) — Charles F. Lummis (†1928); trad. Arturo Cuyás (†1925) | LibriVox #22609, sección(es) 3; Piotr Nater (voluntarios de LibriVox) | 9–11 | 13:11 | 6334473 | `a5e42e7f410acee2` |
| `audiobiografias/librivox-22609-lummis-cabeza-de-vaca.mp3` | El primer caminante en América: Álvar Núñez Cabeza de Vaca (Los exploradores españoles del siglo XVI) — Charles F. Lummis (†1928); trad. Arturo Cuyás (†1925) | LibriVox #22609, sección(es) 9; juanina (voluntarios de LibriVox) | 9–11 | 29:43 | 14280551 | `77d156e61819a14f` |
| `audiobiografias/librivox-21404-gimeno-heroinas-mexicanas-y-espanolas.mp3` | Heroínas mexicanas y españolas (Mujeres: vidas paralelas) — Concepción Gimeno de Flaquer (†1919) | LibriVox #21404, sección(es) 9; Consuelo Aponte (voluntarios de LibriVox) | 9–11 | 11:28 | 5513405 | `cd43b873da14ff61` |
| `audiobiografias/librivox-22137-obregon-balboa-primeros-anos.mp3` | Vasco Núñez de Balboa: primeros años y fundación de Santa María la Antigua del Darién — Ángel Ruiz de Obregón y Retortillo (†1933) | LibriVox #22137, sección(es) 1; Epachuko (voluntarios de LibriVox) | 9–11 | 16:34 | 7963102 | `7add831721dab5f4` |
| `audiobiografias/librivox-22137-obregon-balboa-descubrimiento-pacifico.mp3` | Vasco Núñez de Balboa: travesía del istmo y descubrimiento del Mar del Sur — Ángel Ruiz de Obregón y Retortillo (†1933) | LibriVox #22137, sección(es) 4; Epachuko (voluntarios de LibriVox) | 9–11 | 25:08 | 12076734 | `2c55f916047df72c` |
| `audiobiografias/librivox-13121-dario-vida-caps-1-5.mp3` | La vida de Rubén Darío escrita por él mismo (capítulos I a V) — Rubén Darío (†1916) | LibriVox #13121, sección(es) 1; KendalRigans (voluntarios de LibriVox) | 10–11 | 19:17 | 9263693 | `2725a68ec929e3a7` |

URL exactas de cada sección: campo `source.sections` del manifiesto. Página del proyecto: `source.url`. Fuente del texto según LibriVox: `source.textSource`.

## Audiobiografías con guion original

| Archivo | Persona | Grados | Palabras narradas | Duración | Bytes | SHA-256 (prefijo) |
|---|---|---|---|---|---|---|
| `audiobiografias/macondo-leonardo-da-vinci-para-ninos.mp3` | Leonardo da Vinci | 2–5 | 318 | 2:12 | 1053494 | `f1389f2e2e828134` |
| `audiobiografias/macondo-simon-bolivar-para-ninos.mp3` | Simón Bolívar | 2–5 | 332 | 2:17 | 1099252 | `64fa4711fba80fc5` |
| `audiobiografias/macondo-beethoven-para-ninos.mp3` | Ludwig van Beethoven | 3–5 | 343 | 2:16 | 1090071 | `879a3583d894c13e` |
| `audiobiografias/macondo-marie-curie-para-ninos.mp3` | Marie Curie | 3–5 | 342 | 2:22 | 1132894 | `ba7935b856d16c70` |
| `audiobiografias/macondo-policarpa-salavarrieta.mp3` | Policarpa Salavarrieta | 3–5 | 352 | 2:28 | 1184952 | `ced7df09a98f168b` |
| `audiobiografias/macondo-ada-lovelace.mp3` | Ada Lovelace | 6–11 | 570 | 3:49 | 1832351 | `798213fa7d9e87dc` |
| `audiobiografias/macondo-antonio-narino.mp3` | Antonio Nariño | 6–11 | 533 | 3:41 | 1770288 | `7c6720ea897e9f83` |
| `audiobiografias/macondo-benkos-bioho.mp3` | Benkos Biohó | 6–11 | 622 | 4:10 | 2000997 | `9d1a9755e11b31be` |
| `audiobiografias/macondo-francisco-jose-de-caldas.mp3` | Francisco José de Caldas | 6–11 | 575 | 3:53 | 1863095 | `fe3204b006f853df` |
| `audiobiografias/macondo-gabriela-mistral.mp3` | Gabriela Mistral | 6–11 | 537 | 3:40 | 1764022 | `593b67a1b1dee0c6` |
| `audiobiografias/macondo-jose-celestino-mutis.mp3` | José Celestino Mutis | 6–11 | 559 | 3:40 | 1760478 | `d89b3110a335a368` |
| `audiobiografias/macondo-jose-prudencio-padilla.mp3` | José Prudencio Padilla | 6–11 | 564 | 3:43 | 1786604 | `40c1abb56a8b5a1a` |
| `audiobiografias/macondo-candelario-obeso.mp3` | Candelario Obeso | 7–11 | 533 | 3:33 | 1702582 | `1e6fac857f174a49` |
| `audiobiografias/macondo-jorge-isaacs.mp3` | Jorge Isaacs | 7–11 | 530 | 3:27 | 1654509 | `ecd0d75124e858fc` |
| `audiobiografias/macondo-juan-jose-nieto-gil.mp3` | Juan José Nieto Gil | 7–11 | 512 | 3:26 | 1652433 | `4cd280ebc15f5fdf` |
| `audiobiografias/macondo-sor-juana-ines-de-la-cruz.mp3` | Sor Juana Inés de la Cruz | 7–11 | 609 | 3:48 | 1826525 | `31723a2d3fb26255` |

## Audioresúmenes (guion original)

| Archivo | Obra resumida — autor (†) | Texto leído para resumir | Grados | Palabras | Duración | Bytes | SHA-256 (prefijo) |
|---|---|---|---|---|---|---|---|
| `audioresumenes/macondo-la-lechera.mp3` | *La lechera* — Félix María Samaniego (†1801) | demo-content/files/samaniego-fabulas.epub | 1–4 | 308 | 2:04 | 992427 | `7572fa8e5a4a08ef` |
| `audioresumenes/macondo-la-tortuga-gigante.mp3` | *La tortuga gigante* — Horacio Quiroga (†1937) | https://es.wikisource.org/wiki/La_tortuga_gigante | 1–4 | 366 | 2:18 | 1105702 | `8c082a8450d62af1` |
| `audioresumenes/macondo-raton-perez.mp3` | *Ratón Pérez* — Luis Coloma (†1915) | libros/gutenberg-36558.epub | 1–4 | 371 | 2:18 | 1102379 | `dda84293548c987c` |
| `audioresumenes/macondo-bebe-y-el-senor-don-pomposo.mp3` | *Bebé y el señor don Pomposo* — José Martí (†1895) | demo-content/files/marti-la-edad-de-oro.epub | 2–5 | 336 | 2:03 | 982875 | `162500b2b6ad6690` |
| `audioresumenes/macondo-la-abeja-haragana.mp3` | *La abeja haragana* — Horacio Quiroga (†1937) | https://es.wikisource.org/wiki/La_abeja_haragana | 2–5 | 334 | 2:11 | 1049903 | `ab23167bfbd2b867` |
| `audioresumenes/macondo-la-muneca-negra.mp3` | *La muñeca negra* — José Martí (†1895) | demo-content/files/marti-la-edad-de-oro.epub | 2–5 | 329 | 2:04 | 994762 | `f737271d9ba4c3f7` |
| `audioresumenes/macondo-el-camaron-encantado.mp3` | *El camarón encantado* — José Martí (versión de un cuento de Laboulaye) (†1895) | demo-content/files/marti-la-edad-de-oro.epub | 4–7 | 342 | 2:10 | 1038449 | `424ef1379ca24781` |
| `audioresumenes/macondo-la-navidad-en-las-montanas.mp3` | *La Navidad en las montañas* — Ignacio Manuel Altamirano (†1893) | libros/gutenberg-10825.epub | 7–11 | 390 | 2:31 | 1207108 | `4ae3c4d67d00b1cf` |
| `audioresumenes/macondo-coplas-por-la-muerte-de-su-padre.mp3` | *Coplas por la muerte de su padre* — Jorge Manrique (†1479) | libros/gutenberg-49333.epub | 8–11 | 393 | 2:32 | 1212713 | `f7eae68af7c016b4` |
| `audioresumenes/macondo-don-quijote.mp3` | *Don Quijote de la Mancha* — Miguel de Cervantes Saavedra (†1616) | libros/gutenberg-2000.epub | 8–11 | 464 | 3:01 | 1451987 | `bc4ed3f0570917a2` |
| `audioresumenes/macondo-el-capitan-veneno.mp3` | *El Capitán Veneno* — Pedro Antonio de Alarcón (†1891) | libros/gutenberg-29731.epub | 8–11 | 337 | 2:14 | 1075015 | `6f51666da902a6d0` |
| `audioresumenes/macondo-el-rayo-de-luna.mp3` | *El rayo de luna* — Gustavo Adolfo Bécquer (†1870) | libros/gutenberg-53552.epub | 8–11 | 388 | 2:32 | 1215413 | `2ba406447056d824` |
| `audioresumenes/macondo-el-si-de-las-ninas.mp3` | *El sí de las niñas* — Leandro Fernández de Moratín (†1828) | libros/gutenberg-50027.epub | 8–11 | 368 | 2:23 | 1143771 | `21e2ec092f59aeac` |
| `audioresumenes/macondo-lazarillo-de-tormes.mp3` | *Lazarillo de Tormes* — Anónimo (anónimo, s. XVI) | libros/gutenberg-320.epub | 8–11 | 443 | 2:45 | 1317817 | `a0590de4e6cf0867` |
| `audioresumenes/macondo-marianela.mp3` | *Marianela* — Benito Pérez Galdós (†1920) | libros/gutenberg-17340.epub | 8–11 | 372 | 2:28 | 1181761 | `69ae02fdab3d4108` |
| `audioresumenes/macondo-mi-ultimo-adios.mp3` | *Mi último adiós* — José Rizal (†1896) | libros/gutenberg-18600.epub | 8–11 | 394 | 2:25 | 1161528 | `3b67246ed9bde384` |
| `audioresumenes/macondo-trafalgar.mp3` | *Trafalgar* — Benito Pérez Galdós (†1920) | libros/gutenberg-16961.epub | 8–11 | 408 | 2:41 | 1290431 | `01e51ec71fd1be53` |
| `audioresumenes/macondo-el-sombrero-de-tres-picos.mp3` | *El sombrero de tres picos* — Pedro Antonio de Alarcón (†1891) | libros/gutenberg-29506.epub | 9–11 | 383 | 2:29 | 1193689 | `c8fd8dd69e4b0154` |
| `audioresumenes/macondo-fuente-ovejuna.mp3` | *Fuente Ovejuna* — Lope de Vega (†1635) | libros/gutenberg-60198.epub | 9–11 | 371 | 2:26 | 1171108 | `d95f29288491e7db` |
| `audioresumenes/macondo-ariel.mp3` | *Ariel* — José Enrique Rodó (†1917) | libros/gutenberg-22899.epub | 10–11 | 440 | 2:50 | 1363151 | `6540975336576861` |

Lectura de fuentes: lectura completa de los textos breves (Ratón Pérez, La tortuga gigante, La abeja haragana, Bebé y el señor don Pomposo, La muñeca negra, El camarón encantado, La lechera, El rayo de luna, Mi último adiós); en obras extensas (Lazarillo, Quijote, Marianela, El sí de las niñas, Fuente Ovejuna, El Capitán Veneno, Trafalgar, La Navidad en las montañas, Ariel, El sombrero de tres picos, Coplas) se cotejaron en el EPUB del catálogo personajes, lugares, fechas y episodios clave (búsquedas dirigidas y lectura de pasajes, incluido el desenlace). *María* (Isaacs) se descartó como resumen porque no se pudo consultar el texto (Wikisource limitó las peticiones) y fue sustituida por *El sombrero de tres picos*.

## Pendiente de revisión humana

- **Todas** las pistas con voz sintética: escucha completa (pronunciación de nombres propios y cifras) y, idealmente, regrabación con narrador humano.
- **Contenido sensible / perspectiva histórica** (ver `reviewNotes`): Lummis (Colón, Cabeza de Vaca) y Obregón (Balboa) presentan la conquista de forma apologética; el cap. 4 de Balboa narra sin crítica una matanza de indígenas (valorar si se publica). Fernán Caballero y Gimeno de Flaquer: tono moralizante del siglo XIX. Darío (caps. I–V): alusiones sensuales adolescentes (solo 10.º–11.º). Martí, *El Padre Las Casas*: violencia de la conquista.
- **Resúmenes**: *Fuente Ovejuna* (acoso y violencia del Comendador, 9.º–11.º); *El camarón encantado* (final trágico); revisión pedagógica de preguntas y grados.
- **Datos a confirmar por el equipo**: fecha de nacimiento de Policarpa Salavarrieta (se indica como la más citada) y de Sor Juana (1648/1651, se indica la duda); detalles tradicionales de Benkos Biohó (presentados como tradición); autoría del original francés de *Vida y pensamientos morales de Confucio* (atribuida a P.-C. Levesque).
- **Sin portadas**: `cover: null` en todas las entradas.

## Lote 2 (21 audiobiografías adicionales)

Generado el 2026-10-31 a petición del usuario para completar 50 audiobiografías (30 del lote 1 − 1 retirada (Balboa, travesía del istmo) − la demo de Pombo retirada + 21). **21 entradas** en `audiobiografias-lote2.manifest.json`: 5 de LibriVox + 16 con guion original (incluye una nueva audiobiografía de **Rafael Pombo** que sustituye a la demo con voz de macOS). 9 pensadas para 1.º–5.º. **`status: PUBLISHED`** (publicación aprobada por el usuario); los avisos sensibles se mantienen en `reviewNotes`. Duración 1.93 h, 55.5 MB.

**Método**: igual que el lote 1. LibriVox: se revisaron las secciones biográficas restantes de los proyectos en español ya catalogados; se descartó *El soldado poeta* (Lummis) por narrar sin crítica la guerra de Ácoma. El contenido de las 5 secciones elegidas se revisó con transcripción automática (faster-whisper). Guiones originales (`_tools/biores-bios-lote2.py`) narrados con la misma voz Piper `es_ES-carlfm-x_low` (modelo MIT, dataset de dominio público). Construcción y verificación: `_tools/biores-lote2.py` (bytes mágicos, ffprobe, decodificación completa sin errores, SHA-256, tamaño); validación: `_tools/biores-validate-lote2.js` (ResourceInputSchema + PUBLISHED, archivo, ≥3 preguntas, timeline y funFacts). No se citan versos de autores aún protegidos (Luis Carlos López †1950, canciones de Lucho Bermúdez †1994).

Validación:

```
audiobiografias-lote2.manifest.json 21 entradas
21 entradas validadas, 0 fallas
```

Control de inteligibilidad (primeros 30 s de la nueva audiobiografía de Pombo):

```
Audió biografía de Rafael Pombo, biblioteca macondo. Conoces a Renrenre Nacuajo, el que salió muy tieso y muy majo, y a la pobre viejecita, que no tenía nada que comer. Esos personajes los inventó un poeta colombiano llamado Rafael Pombo. Rafael Pombo nació en Bogotá el 7 de noviembre de 1833. Desde niños le encantaban las palabras, las rimas y los cuentos. Estudió para ser ingeniero, pero lo que más me gustaba era escribir...
```

| Archivo | Título — autor (†) / origen | Grados | Duración | Bytes | SHA-256 (prefijo) |
|---|---|---|---|---|---|
| `audiobiografias/librivox-13232-caballero-los-siete-sabios.mp3` | Los siete sabios de Grecia (Historia de los grandes hombres de la Grecia) — Fernán Caballero (†1877); LibriVox #13232, sección 15; KendalRigans (voluntarios de LibriVox) | 7–11 | 11:11 | 5372687 | `bc713571742a7d17` |
| `audiobiografias/librivox-13232-caballero-teofrasto-herodoto-epaminondas.mp3` | Teofrasto, Heródoto y Epaminondas (Historia de los grandes hombres de la Grecia) — Fernán Caballero (†1877); LibriVox #13232, sección 20; KendalRigans (voluntarios de LibriVox) | 7–11 | 6:59 | 3360329 | `06ff7126b28acce5` |
| `audiobiografias/librivox-21404-gimeno-madame-dacier-y-marquesa-du-chatelet.mp3` | Madame Dacier y la Marquesa du Châtelet (Mujeres: vidas paralelas) — Concepción Gimeno de Flaquer (†1919); LibriVox #21404, sección 8; Consuelo Aponte (voluntarios de LibriVox) | 9–11 | 17:57 | 8624885 | `eef802d8477209a0` |
| `audiobiografias/librivox-21404-gimeno-beatriz-galindo-e-isidra-guzman.mp3` | Beatriz Galindo y María Isidra Guzmán (Mujeres: vidas paralelas) — Concepción Gimeno de Flaquer (†1919); LibriVox #21404, sección 13; EnriqueRendon (voluntarios de LibriVox) | 9–11 | 18:56 | 9095788 | `39ebf274293b38f9` |
| `audiobiografias/librivox-21404-gimeno-dos-escritoras-realistas.mp3` | Dos escritoras realistas: María de Zayas y Fernán Caballero (Mujeres: vidas paralelas) — Concepción Gimeno de Flaquer (†1919); LibriVox #21404, sección 15; EnriqueRendon (voluntarios de LibriVox) | 10–11 | 16:46 | 8058596 | `52ae81768af01581` |
| `audiobiografias/macondo-rafael-pombo-2.mp3` | Audiobiografía: Rafael Pombo — Guion original; voz Piper es_ES-carlfm-x_low | 1–4 | 2:18 | 1103639 | `2cb51396a42c0899` |
| `audiobiografias/macondo-antonia-santos.mp3` | Audiobiografía: Antonia Santos — Guion original; voz Piper es_ES-carlfm-x_low | 3–5 | 2:08 | 1026320 | `d9271983b95a6b34` |
| `audiobiografias/macondo-isaac-newton-para-ninos.mp3` | Audiobiografía: Isaac Newton — Guion original; voz Piper es_ES-carlfm-x_low | 3–5 | 2:05 | 1001866 | `22bc563cffbc4939` |
| `audiobiografias/macondo-louis-pasteur-para-ninos.mp3` | Audiobiografía: Louis Pasteur — Guion original; voz Piper es_ES-carlfm-x_low | 3–5 | 2:10 | 1041574 | `1b5a2949136f8714` |
| `audiobiografias/macondo-hans-christian-andersen-para-ninos.mp3` | Audiobiografía: Hans Christian Andersen — Guion original; voz Piper es_ES-carlfm-x_low | 1–4 | 2:00 | 963018 | `fde3d2b8c7f5767e` |
| `audiobiografias/macondo-galileo-galilei-para-ninos.mp3` | Audiobiografía: Galileo Galilei — Guion original; voz Piper es_ES-carlfm-x_low | 3–5 | 1:57 | 939596 | `db421b906c34c603` |
| `audiobiografias/macondo-alexander-von-humboldt-para-ninos.mp3` | Audiobiografía: Alexander von Humboldt — Guion original; voz Piper es_ES-carlfm-x_low | 3–5 | 2:12 | 1060818 | `4e438fcdc130cc70` |
| `audiobiografias/macondo-juana-azurduy-para-ninos.mp3` | Audiobiografía: Juana Azurduy — Guion original; voz Piper es_ES-carlfm-x_low | 4–5 | 1:58 | 946906 | `e0ad685e1c442480` |
| `audiobiografias/macondo-lucho-bermudez-para-ninos.mp3` | Audiobiografía: Lucho Bermúdez — Guion original; voz Piper es_ES-carlfm-x_low | 3–6 | 1:56 | 926010 | `381234f1d85a9614` |
| `audiobiografias/macondo-manuel-quintin-lame.mp3` | Audiobiografía: Manuel Quintín Lame — Guion original; voz Piper es_ES-carlfm-x_low | 7–11 | 3:43 | 1786389 | `0ed163ea5567d5b0` |
| `audiobiografias/macondo-luis-carlos-lopez.mp3` | Audiobiografía: Luis Carlos López — Guion original; voz Piper es_ES-carlfm-x_low | 7–11 | 3:23 | 1628606 | `846a19796bd4e417` |
| `audiobiografias/macondo-soledad-acosta-de-samper.mp3` | Audiobiografía: Soledad Acosta de Samper — Guion original; voz Piper es_ES-carlfm-x_low | 7–11 | 3:31 | 1687134 | `b68604fcd1f71b1f` |
| `audiobiografias/macondo-pedro-romero.mp3` | Audiobiografía: Pedro Romero — Guion original; voz Piper es_ES-carlfm-x_low | 6–11 | 3:35 | 1722845 | `2741375c5e714313` |
| `audiobiografias/macondo-agustin-codazzi.mp3` | Audiobiografía: Agustín Codazzi — Guion original; voz Piper es_ES-carlfm-x_low | 6–11 | 3:49 | 1829849 | `7d163532d06288c4` |
| `audiobiografias/macondo-manuela-beltran.mp3` | Audiobiografía: Manuela Beltrán — Guion original; voz Piper es_ES-carlfm-x_low | 6–11 | 3:30 | 1684608 | `888ee254d7f2e6ca` |
| `audiobiografias/macondo-diego-luis-cordoba.mp3` | Audiobiografía: Diego Luis Córdoba — Guion original; voz Piper es_ES-carlfm-x_low | 8–11 | 3:30 | 1680225 | `5d7ce78d2d8ea78f` |

**Revisión recomendada (lote 2)**: escucha completa de las pistas sintéticas (nombres propios); fechas inciertas de Pedro Romero y datos escasos de Manuela Beltrán (indicados en el texto); tono decimonónico de Fernán Caballero y Gimeno de Flaquer; Lucho Bermúdez (†1994) y Diego Luis Córdoba (†1964) son figuras del siglo XX, sin citas de obras protegidas.


## Regrabación 2026-11-05 con es_ES-davefx-medium

Las **52 pistas con guion original** (16 audiobiografías del lote 1, 16 del lote 2 y 20 audioresúmenes) se volvieron a narrar con la voz Piper **`es_ES-davefx-medium`**, elegida por el usuario tras la comparación de `entregables/muestras-voz/`. Las 19 audiobiografías de LibriVox no se tocaron. Duración total de estas pistas: **144:35 antes → 139:02 después** (8675 s → 8342 s).

- **Voz**: `es_ES-davefx-medium` (español de España, 1 hablante, calidad *medium*, 22 050 Hz). MODEL_CARD (copia en `catalogo-dp/_tmp/tts-muestras/piper-voices/davefx-MODEL_CARD`): dataset https://github.com/OHF-Voice/voice-datasets con licencia **CC0**; modelo *finetuned* a partir de la voz inglesa `lessac` (medium). Repositorio de modelos: https://huggingface.co/rhasspy/piper-voices (licencia MIT), ruta `es/es_ES/davefx/medium/` (`es_ES-davefx-medium.onnx`, 63 201 294 bytes, SHA-256 `6658b03b1a6c316ee4c265a9896abc1393353c2d9e1bca7d66c2c442e222a917`; copia local en `catalogo-dp/_tmp/tts-muestras/piper-voices/`). La licencia GPL de `piper-tts` no se extiende al audio generado.
- **Motor y parámetros**: `piper-tts` 1.8.0 en `catalogo-dp/_tmp/tts/venv` (Python 3.14); length_scale 1.0, noise_scale 0.667 y noise_w 0.8 (valores por defecto del `.onnx.json`); silencios insertados: 0,5 s entre frases, 0,7 s entre párrafos, 0,9 s tras la línea de título, 0,5 s al inicio y 0,6 s al final. Conversión con ffmpeg/libmp3lame: **64 kbps, mono, 44,1 kHz**, ID3v2.3 (título, artista «Biblioteca Macondo», género Speech).
- **Tiempo de cómputo**: 706 s de CPU en total para 52 pistas (registro por pista en `catalogo-dp/_tmp/renarrado/sintesis-log.tsv`; MP3 intermedios en `catalogo-dp/_tmp/renarrado/`).
- **Verificación de cada MP3**: bytes mágicos (ID3), `ffprobe` (códec mp3, 44 100 Hz, mono), decodificación completa con ffmpeg sin errores, SHA-256 y tamaño (`catalogo-dp/_tmp/renarrado/verify.json`).
- **Stack vivo** (http://localhost:3100): para cada recurso se subió el nuevo MP3 con `POST /api/admin/resources/:id/file` (la API reemplaza el archivo, borra el anterior y recalcula `fileSha256`/`fileSizeBytes`) y se hizo `PATCH /api/admin/resources/:id` con `narrator`, `durationSeconds` y `license.licenseName` (solo se sustituyó `es_ES-carlfm-x_low` por `es_ES-davefx-medium (datos CC0)`; `rightsHolder` y el resto sin cambios). Se comprobó en `GET /api/resources/:id` el nuevo `fileSha256`, `durationSeconds` y `status: PUBLISHED`, y que una petición con `Range: bytes=0-1023` a `/api/resources/:id/file` responde 206 con los mismos bytes que el archivo local. El estado no se modificó.
- **Manifiestos**: en las entradas afectadas se actualizaron `sha256`, `sizeBytes`, `durationSeconds`, `narrator`, `license.licenseName` y `reviewNotes`; los archivos `audiobiografias/macondo-*.mp3` y `audioresumenes/macondo-*.mp3` se sustituyeron con el mismo nombre. Las secciones anteriores de este documento conservan los valores de la grabación original con `carlfm` como registro histórico.

| Archivo | Título | id en el stack | Duración antes → después | Bytes | SHA-256 (nuevo) | CPU (s) |
|---|---|---|---|---|---|---|
| `audiobiografias/macondo-leonardo-da-vinci-para-ninos.mp3` | Audiobiografía: Leonardo da Vinci | `cmvx60h5c008qli01xt7b7vpp` | 2:12 → 2:02 | 976785 | `03a048c0d9a472e51e7a952caec4df747704205bbaa00141dc1048609b0449da` | 9.7 |
| `audiobiografias/macondo-simon-bolivar-para-ninos.mp3` | Audiobiografía: Simón Bolívar | `cmvx60h67008xli01ikfved9o` | 2:17 → 2:07 | 1013558 | `848581a7b3029fc929961dfdd888432466d4563d8ddf883d7667aa7e92b45bec` | 9.6 |
| `audiobiografias/macondo-beethoven-para-ninos.mp3` | Audiobiografía: Ludwig van Beethoven | `cmvx60h740094li015yeh95gy` | 2:16 → 2:09 | 1028827 | `764b1ce8e520c718eefafcf45846b9e7e873fcc2b71e1acef78cefe2d7928308` | 9.3 |
| `audiobiografias/macondo-marie-curie-para-ninos.mp3` | Audiobiografía: Marie Curie | `cmvx60h85009bli01mh27wmro` | 2:22 → 2:16 | 1088577 | `24238e2cb1de0aa8ca8fbf108afa81403e68159e747565c80c41b6db9a146434` | 9.8 |
| `audiobiografias/macondo-policarpa-salavarrieta.mp3` | Audiobiografía: Policarpa Salavarrieta | `cmvx60h9h009ili01rt1687nd` | 2:28 → 2:15 | 1083584 | `535e2cfc05e8be40729e5efac2cace191de818308e188c0cfeab1c9fe8f26497` | 9.8 |
| `audiobiografias/macondo-ada-lovelace.mp3` | Audiobiografía: Ada Lovelace | `cmvx60ham009pli01y48c9htn` | 3:49 → 3:45 | 1801200 | `aa57a65bb3372c129d51c9dd94b6ddaa3837c7515217ca11a7170db4f435e9c6` | 16.6 |
| `audiobiografias/macondo-antonio-narino.mp3` | Audiobiografía: Antonio Nariño | `cmvx60hc2009wli013d3vegkt` | 3:41 → 3:32 | 1695460 | `11627704cd32c9723da12de95006c4020fc648424b857c18e0be019074ab081c` | 15.7 |
| `audiobiografias/macondo-benkos-bioho.mp3` | Audiobiografía: Benkos Biohó | `cmvx60hdb00a3li01z7g2keil` | 4:10 → 4:00 | 1923871 | `9a1031f94754e876db002fce0c03f6b48e2c05d041c617f8d21fbf258cc7556c` | 18.6 |
| `audiobiografias/macondo-francisco-jose-de-caldas.mp3` | Audiobiografía: Francisco José de Caldas | `cmvx60hef00aali01f9k84r6g` | 3:53 → 3:41 | 1769459 | `5a4a83329814071e6ecc3298ea0d805665ce60a0763e38bbf94f84c2507e9641` | 17.1 |
| `audiobiografias/macondo-gabriela-mistral.mp3` | Audiobiografía: Gabriela Mistral | `cmvx60hfm00ahli0140w8jt5e` | 3:40 → 3:29 | 1676447 | `9433ad287e4764c8a96ab994ece39880ab7c9dc5765347bbf321e7c9b2a2aaac` | 16.4 |
| `audiobiografias/macondo-jose-celestino-mutis.mp3` | Audiobiografía: José Celestino Mutis | `cmvx60hgv00aoli01agsoqk7l` | 3:40 → 3:38 | 1742074 | `9b1daaf70a9e76e2289f5eed861b9da925dc90fcc5fe6c2a0eab53211b17aa06` | 17.4 |
| `audiobiografias/macondo-jose-prudencio-padilla.mp3` | Audiobiografía: José Prudencio Padilla | `cmvx60hi600avli010p0l1hdo` | 3:43 → 3:36 | 1730376 | `85852c35baefce925effe0d0feece2574afc029df3ae1ae8a61da3342f27bc4f` | 17.9 |
| `audiobiografias/macondo-candelario-obeso.mp3` | Audiobiografía: Candelario Obeso | `cmvx60hja00b2li01jh6hnkd6` | 3:33 → 3:27 | 1660146 | `974c3bf7b9e0e63ec64f1e11a97b21e50157903310be58d1a0ce7650e90b111d` | 17.4 |
| `audiobiografias/macondo-jorge-isaacs.mp3` | Audiobiografía: Jorge Isaacs | `cmvx60hkg00b9li01e64jxqsy` | 3:27 → 3:20 | 1599534 | `02f4934a47d1080c855255a9b20c25d3ee9fa2859bac45ebfc929e56b0aa1047` | 17.6 |
| `audiobiografias/macondo-juan-jose-nieto-gil.mp3` | Audiobiografía: Juan José Nieto Gil | `cmvx60hlg00bgli016kwf8zrs` | 3:26 → 3:18 | 1587845 | `463b636a55e25828e4b6cac04382d49933eedb310da6b691704c54776bda7796` | 19.4 |
| `audiobiografias/macondo-sor-juana-ines-de-la-cruz.mp3` | Audiobiografía: Sor Juana Inés de la Cruz | `cmvx60hmf00bnli014bhyrxcg` | 3:48 → 3:44 | 1790986 | `35626d8499be30573741e8fabdebf462b303ae9d5b38b0d7c7743448b1902262` | 19.1 |
| `audiobiografias/macondo-rafael-pombo-2.mp3` | Audiobiografía: Rafael Pombo | `cmvx802p10025oc01deejrfby` | 2:18 → 2:12 | 1058904 | `f0104204ed3372f4ec90af41a3554b96adc69e2f5b8481bd2dcb6e20c70233ea` | 10.6 |
| `audiobiografias/macondo-antonia-santos.mp3` | Audiobiografía: Antonia Santos | `cmvx802py002eoc019o2m04ic` | 2:08 → 2:03 | 987019 | `6976af7132495c390e37333856482ee0b946d7dac6a90cda570774d37fb88067` | 10.1 |
| `audiobiografias/macondo-isaac-newton-para-ninos.mp3` | Audiobiografía: Isaac Newton | `cmvx802qw002noc018s6aegu2` | 2:05 → 1:58 | 943547 | `423b91c04bf44a3f356d7846ceefcd57c1d2883f8984926cddad8fa991c3d095` | 9.8 |
| `audiobiografias/macondo-louis-pasteur-para-ninos.mp3` | Audiobiografía: Louis Pasteur | `cmvx802rq002woc01gqh98b5s` | 2:10 → 2:04 | 994540 | `fd5739ba2593eef3b7b483df3bebcee8c59263f106d084b30ded2fc9e3a81b43` | 10.8 |
| `audiobiografias/macondo-hans-christian-andersen-para-ninos.mp3` | Audiobiografía: Hans Christian Andersen | `cmvx802sm0035oc01pul4lt6q` | 2:00 → 1:54 | 912222 | `ae711905fbb6e8095075ae51803029ae131b4f0410d6886f45c073b35101e67c` | 9.5 |
| `audiobiografias/macondo-galileo-galilei-para-ninos.mp3` | Audiobiografía: Galileo Galilei | `cmvx802tf003eoc014nma54va` | 1:57 → 1:54 | 914087 | `3363f69dc898217841956dcf087a6c6bc5cbff75ddff6b09a14321292865d1fb` | 9.1 |
| `audiobiografias/macondo-alexander-von-humboldt-para-ninos.mp3` | Audiobiografía: Alexander von Humboldt | `cmvx802uc003noc01teh47evw` | 2:12 → 2:02 | 977631 | `e25bb89d1c740b6aa6f85858d8481abf14b661f522fc66ea2d5eb7ff8f1ca248` | 10.4 |
| `audiobiografias/macondo-juana-azurduy-para-ninos.mp3` | Audiobiografía: Juana Azurduy | `cmvx802vc003woc01417dzvfz` | 1:58 → 1:54 | 916173 | `491b1d0bc2e27d45907d9c535bd7f1231acba4bb77e7145e4abd7d88f56ef45b` | 9.9 |
| `audiobiografias/macondo-lucho-bermudez-para-ninos.mp3` | Audiobiografía: Lucho Bermúdez | `cmvx802w50045oc01d5l9hw10` | 1:56 → 1:53 | 906980 | `94d0a219a5aac727e45d622bd64b0767a45d8d882513f5d61869e6a16ce0a4af` | 10.2 |
| `audiobiografias/macondo-manuel-quintin-lame.mp3` | Audiobiografía: Manuel Quintín Lame | `cmvx802x1004eoc01fetemodg` | 3:43 → 3:42 | 1773419 | `597348caa223f5ab1ec5f79f73bd2e578c1cc25d54795f23026fe2b655adc9cd` | 19.5 |
| `audiobiografias/macondo-luis-carlos-lopez.mp3` | Audiobiografía: Luis Carlos López | `cmvx802y5004noc01ycbm7ccj` | 3:23 → 3:12 | 1536224 | `b49f8a512a89ae5a37d0462bc1339e72a6d58a057712fd8777a8f846f638c53b` | 16.5 |
| `audiobiografias/macondo-soledad-acosta-de-samper.mp3` | Audiobiografía: Soledad Acosta de Samper | `cmvx802z5004woc0121k6yew2` | 3:31 → 3:28 | 1662252 | `a3dcfd7db9f785dbbea336a992d9c5cb4d7e1d06d9f0fa1a03ae92f318166ff0` | 17.7 |
| `audiobiografias/macondo-pedro-romero.mp3` | Audiobiografía: Pedro Romero | `cmvx8030c0055oc01ipn5tpnm` | 3:35 → 3:30 | 1679991 | `b10313fa00310d9cabed8aef5ddd9485f97667b7a7bb7e6f53254dd2c360065f` | 17.8 |
| `audiobiografias/macondo-agustin-codazzi.mp3` | Audiobiografía: Agustín Codazzi | `cmvx8031m005eoc01b50c61yv` | 3:49 → 3:42 | 1780099 | `8c597f239c216a7e26dc5ccb5104e2b14914df6a50c77ded96dbe162b91598c1` | 19.3 |
| `audiobiografias/macondo-manuela-beltran.mp3` | Audiobiografía: Manuela Beltrán | `cmvx8032s005noc01auunzm8b` | 3:30 → 3:27 | 1654711 | `4b2be094cd4c2428ad00ff05ef91e30ecc48f0ea8ec4c9422e88612dce840907` | 19.7 |
| `audiobiografias/macondo-diego-luis-cordoba.mp3` | Audiobiografía: Diego Luis Córdoba | `cmvx8033v005woc01bo8uopi4` | 3:30 → 3:24 | 1636118 | `f6943ba02e95d9eb7eab8b3fa2f838d4ab5a84f7f4aec86aa96503024ba82ae6` | 19.5 |
| `audioresumenes/macondo-la-lechera.mp3` | Audioresumen: La lechera | `cmvx60hry00buli01rh2l6ckp` | 2:04 → 1:54 | 916345 | `eb4c537fc034ccb1b0d50c90705a5c3807502b0ae1f3189de5b99553180ece33` | 9.9 |
| `audioresumenes/macondo-la-tortuga-gigante.mp3` | Audioresumen: La tortuga gigante | `cmvx60hsw00c1li01egdw8aes` | 2:18 → 2:13 | 1068072 | `ae53914455ec98abdeb658be4958b26100f4cdee6ef484762f1050f08e6ac925` | 10.8 |
| `audioresumenes/macondo-raton-perez.mp3` | Audioresumen: Ratón Pérez | `cmvx60htv00c8li01se0kpfxa` | 2:18 → 2:10 | 1036746 | `b664f1aa8cf7fee80e06d3f7430de79b34deeed54d6ff84afc3a182c54719974` | 10.6 |
| `audioresumenes/macondo-bebe-y-el-senor-don-pomposo.mp3` | Audioresumen: Bebé y el señor don Pomposo | `cmvx60huu00cfli01dbomea3m` | 2:03 → 1:56 | 926855 | `cdcc786f51f703a1ced35132c12f21522c3781ff6e8da1a2ad41bbccde8c486a` | 10.3 |
| `audioresumenes/macondo-la-abeja-haragana.mp3` | Audioresumen: La abeja haragana | `cmvx60hvp00cmli016m6s1mlg` | 2:11 → 2:05 | 1002034 | `f671f0b4c0de1e0b2d234c5cb1f4d24cfcb7cc3a2fcd72966922c5a90bd0bd93` | 10.1 |
| `audioresumenes/macondo-la-muneca-negra.mp3` | Audioresumen: La muñeca negra | `cmvx60hwz00ctli01ya6ow0f5` | 2:04 → 1:58 | 943131 | `50a0c373dbcefbd92ae29a1a1738e40f61ebf61921533b131b3020d831610ec6` | 9.9 |
| `audioresumenes/macondo-el-camaron-encantado.mp3` | Audioresumen: El camarón encantado | `cmvx60hxy00d0li019bq6f1xv` | 2:10 → 2:03 | 986609 | `72e370ee67e58e4a131141b0bc12d9680610824024b9fb9ea679be2da2edaacc` | 11.3 |
| `audioresumenes/macondo-la-navidad-en-las-montanas.mp3` | Audioresumen: La Navidad en las montañas | `cmvx60hyy00d7li019ze6stz6` | 2:31 → 2:28 | 1184316 | `f716b21258749440b44d9b4268d53db4b1a1d6c1c811f3df1b976b601eb57e5d` | 14.6 |
| `audioresumenes/macondo-coplas-por-la-muerte-de-su-padre.mp3` | Audioresumen: Coplas por la muerte de su padre | `cmvx60i0500deli010b0weslu` | 2:32 → 2:23 | 1145827 | `78f802c1d04b914af679a79db51490c12e7507205c048c2324dd1352fd80eebd` | 12.8 |
| `audioresumenes/macondo-don-quijote.mp3` | Audioresumen: Don Quijote de la Mancha | `cmvx60i1d00dlli01jv8j8kms` | 3:01 → 2:54 | 1391579 | `18b86b2aea0243878e89037a614edf2c5c8eb3b9d20871b0875793e920a3b778` | 15.3 |
| `audioresumenes/macondo-el-capitan-veneno.mp3` | Audioresumen: El Capitán Veneno | `cmvx60i2j00dsli01adjdevra` | 2:14 → 2:11 | 1044700 | `8264bfadaef686b217e2c1db6828a0887ceea59a29cfc117fbfc8bea2bbf9a10` | 12.4 |
| `audioresumenes/macondo-el-rayo-de-luna.mp3` | Audioresumen: El rayo de luna | `cmvx60i3l00dzli0176dgwm7w` | 2:32 → 2:21 | 1132435 | `b73e8bc60f181b73bf379710c25376de2c3763e51b8ac1b8955bce09b4af35a2` | 12.1 |
| `audioresumenes/macondo-el-si-de-las-ninas.mp3` | Audioresumen: El sí de las niñas | `cmvx60i4l00e6li01r5s1fm7n` | 2:23 → 2:16 | 1085035 | `1f9536c405a385cc18336e85331779adda0c65e466464c4941252268d02cd6d6` | 12.2 |
| `audioresumenes/macondo-lazarillo-de-tormes.mp3` | Audioresumen: Lazarillo de Tormes | `cmvx60i5j00edli01ztfew7q6` | 2:45 → 2:39 | 1270992 | `d4f9a14339a643ba5cc9ed21e966326bf8a5082c51591d81e350d84a13401916` | 13.1 |
| `audioresumenes/macondo-marianela.mp3` | Audioresumen: Marianela | `cmvx60i6g00ekli01g7c6e9d6` | 2:28 → 2:19 | 1114875 | `7e9d110a82a2a445cbdb59508ebd8ad6208d8d51bd10a7d42cd3f2cda1a9a7f2` | 11.5 |
| `audioresumenes/macondo-mi-ultimo-adios.mp3` | Audioresumen: Mi último adiós | `cmvx60i7d00erli013m5676x1` | 2:25 → 2:20 | 1121391 | `b45408d17a8359a3a6326de2d79fbe8b2d143ee7693e9608fff4bcd13e0b1f03` | 11.8 |
| `audioresumenes/macondo-trafalgar.mp3` | Audioresumen: Trafalgar | `cmvx60i8l00eyli01vy5n1bwq` | 2:41 → 2:35 | 1236919 | `0ae605006f4b45e73c2f9811d3b8dc67c8615dd65e18e420d28a8788047ce053` | 13.2 |
| `audioresumenes/macondo-el-sombrero-de-tres-picos.mp3` | Audioresumen: El sombrero de tres picos | `cmvx60i9s00f5li01tzu42loj` | 2:29 → 2:24 | 1149372 | `2bedf1d68b809d261d1dd6bf0fdfb3de75e39648a9943ee114e533b89f89d8b1` | 12.2 |
| `audioresumenes/macondo-fuente-ovejuna.mp3` | Audioresumen: Fuente Ovejuna | `cmvx60iau00fcli01lzqae794` | 2:26 → 2:24 | 1153541 | `aa747c4f70586fe590d05ba48279fd8d6b639ec7278955f5569d92e1a802e0fd` | 13.4 |
| `audioresumenes/macondo-ariel.mp3` | Audioresumen: Ariel | `cmvx60icl00fjli01l5lb4jix` | 2:50 → 2:51 | 1366482 | `66d32c83bcdbe9fb0506d016f620e98247ad1f70c46155206af59024275812d7` | 16.7 |

Control de inteligibilidad de la regrabación (faster-whisper `small`, primeros 40 s de tres pistas nuevas; solo control automático, no sustituye la escucha humana; las deformaciones de «Audiobiografía … Biblioteca Macondo» en la línea de título son errores del reconocedor que ya aparecían con la voz anterior):

```
[audiobiografias/macondo-francisco-jose-de-caldas.mp3, primeros 40 s] Audioviografía de Francisco José de Caldas, vividote Camacondo. Francisco José de Caldas nació en Popayán el 4 de octubre de 1768. Su familia quería que fuera abogado y en efecto estudió derecho en el colegio mayor de nuestra señora del Rosario, en Sándace. Pero su verdadera pasión estaba en otra parte, en las estrellas, las montañas, las plantas y los números. De regreso en el sur del Vireinato, Caldas se dedicó al comercio para ganarse la vida. Mientras viajaba con sus mercancías por caminos de herradura, observaba el cielo, medía distancias y anotaba la forma del terreno.
[audiobiografias/macondo-rafael-pombo-2.mp3, primeros 40 s] Odioviografía de Rafael Pombo, vivido teca macondo. Conoces a Rinrin Renacuajo, el que salió muy tieso y muy majo. Y da la pobre viejecita, que no tenía nada que comer. Esos personajes los inventó un poeta colombiano llamado Rafael Pombo. Rafael Pombo nació en Bogotá el 7 de noviembre de 1833. Desde niño le encantaban las palabras, las rimas y los cuentos. Estudió para ser ingeniero, pero lo que más degustaba era escribir poemas. Cuando era joven, vejo a Estados Unidos, a la ciudad de Nueva York, para trabajar en la oficina que representaba a Colombia. Vivió allí mucho más.
[audioresumenes/macondo-raton-perez.mp3, primeros 40 s] Audio resume de Ratón Pérez de Luis Coloma, biblioteca macondo. Este cuento fue escrito hacia 1891 por el padre Luis Coloma para un niño de verdad, el pequeño rey Alfonso XIII de España. Según se cuenta, lo escribió cuando al niño rey se le cayó un diente. En el cuento, el protagonista es el rey Bubi, un niño pequeño que reina con la ayuda de su madre. Un día se le mueve un diente y los médicos de la corte se lo sacan. Su mamá, la reina, le dice que escriba una carta al ratón Pérez y que ponda el diente debajo de la almohada. Esa noche aparece un ratoncito muy elegante, con sombrero de paja, lentes de oro y una cartera roja.
```

Validación tras la regrabación (`ResourceInputSchema` de `packages/shared/dist/index.js` + SHA-256 y tamaño de cada archivo): `audiobiografias.manifest.json` 30, `audiobiografias-lote2.manifest.json` 21, `audioresumenes.manifest.json` 20 → **71 entradas validadas, 0 fallas**; 52 con narrador `davefx`, 19 de LibriVox sin cambios. Conteos públicos del stack tras el reemplazo: BOOK 300, AUDIOBOOK 100, AUDIOBIOGRAPHY 50, AUDIOSUMMARY 20, GALLERY 100 (sin cambios).
