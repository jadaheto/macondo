# Libros de dominio público (Project Gutenberg, español) — fuentes y derechos

Recuperado el **2026-10-31** por el agente de adquisición de libros. **200 EPUB** en `libros/`, manifiesto `libros.manifest.json` (formato `FORMATO.md`, todas las entradas en estado `DRAFT`). Tamaño total: **60.7 MB** (60702650 bytes).

## Método

1. **Catálogo**: una sola descarga del catálogo offline `https://www.gutenberg.org/cache/epub/feeds/pg_catalog.csv` (borrado al final). Se tomaron los ítems `Type=Text` con `Language=es` exclusivamente: **887** títulos.
2. **Filtro legal automático** (`_tools/parse_catalog.py`, `_tools/legal_filter.py`, `_tools/legal_check.py`): se extrajeron los años de nacimiento–muerte del campo *Authors* para cada persona acreditada (autor, traductor, editor, prologuista, anotador, ilustrador, compilador…). Se exigió muerte **≤1945** (Ley 23 de 1982, art. 21: vida + 80 años) para **todas** ellas. Se excluyó a quien no tuviera año de muerte o lo tuviera incierto después de 1900. Años aproximados medievales/antiguos (p. ej. Homero, Juan Ruiz «1350?») se aceptaron por ser indudablemente anteriores. Obras anónimas/tradicionales, aceptadas.
   Resultado: 601 títulos pasan el filtro automático; 286 rechazados por derechos o fechas desconocidas.
3. **Curaduría escolar** (`_tools/selection.py`): se priorizaron cuento, fábula, leyenda, poesía, teatro, autores latinoamericanos y colombianos, Siglo de Oro, clásicos del siglo XIX y del 98, traducciones de clásicos universales y divulgación histórica/científica. Se descartaron textos religiosos, jurídicos, técnicos, diccionarios, recetarios, publicaciones periódicas y obras eróticas o de contenido adulto marcado. Se excluyeron los 3 títulos ya presentes en `demo-content` (#55206, #19898, #52894).
4. **Revisión manual de traducciones y paratextos**: para obras extranjeras sin traductor en el catálogo se inspeccionó la portada del EPUB (`_tools/front.py`, `_tools/inspect_epub.py`); para todos los EPUB se buscaron menciones de prologuistas, anotadores, traductores e ilustradores en las primeras páginas (`_tools/sweep_front.py`). Se aceptaron traducciones publicadas **antes de 1946 sin traductor identificable** (se indica en `reviewNotes`); se rechazaron las de traductor identificado sin fecha de muerte verificable.
5. **Descarga** (`_tools/download.sh`): secuencial, sin paralelismo, 2 s de pausa entre descargas, User-Agent descriptivo, `curl -fL --retry 3`, límite de 8 MB por archivo. Se pidió primero la edición **sin imágenes** (`https://www.gutenberg.org/ebooks/<ID>.epub.noimages`). Las ediciones sin imágenes conservan solo la imagen de portada.
6. **Portadas escaneadas con ilustrador no verificado**: en #36558 (*Ratón Pérez*, dibujos de M. Pedrero), #47650 y #50341 (Darío, ilustraciones de Enrique Ochoa, †1978) se **retiró la portada escaneada** del EPUB (`_tools/strip_cover.py`); texto y licencia PG intactos. Los sha256 del manifiesto corresponden al archivo modificado.
7. **Verificación** (`_tools/verify.py`) de cada archivo: bytes mágicos `504b0304`, `unzip -t` correcto, entrada `mimetype` = `application/epub+zip`, presencia de la licencia Project Gutenberg, ausencia de avisos de copyright en la cabecera, tamaño ≤ 8 MB; sha256 y tamaño registrados.
8. **Validación de esquema**: las 200 entradas se validaron con `ResourceInputSchema` de `packages/shared/dist/index.js` (resultado: 200/200 válidas).

## Distribución

Por banda de grado (según `gradeMin`):

| Banda | Títulos |
|---|---|
| 1.º–5.º | 7 |
| 6.º–8.º | 60 |
| 9.º–11.º | 133 |

> En Project Gutenberg casi no hay literatura infantil en español de dominio público en Colombia (el catálogo en español no contiene a Andersen, Grimm, Perrault, Verne ni Collodi). Por eso la banda 1.º–5.º es pequeña: se privilegiaron cuentos tradicionales, fábulas y novelas juveniles, y muchas colecciones de cuentos y poesía se asignaron a 6.º–8.º.

Por categoría (una obra puede tener varias):

| Categoría | Títulos |
|---|---|
| Literatura española | 104 |
| Novela | 65 |
| Literatura latinoamericana | 47 |
| Clásicos universales | 44 |
| Saber 11 | 38 |
| Historia | 33 |
| Teatro | 28 |
| Poesía | 23 |
| Cuento | 22 |
| Siglo de Oro | 18 |
| Ensayo | 11 |
| Episodios nacionales | 10 |
| Mitología | 8 |
| Novela histórica | 8 |
| Ciencia | 8 |
| Viajes | 8 |
| Crónica de Indias | 8 |
| Leyendas | 7 |
| Poesía épica | 7 |
| Romanticismo | 7 |
| Humor | 6 |
| Aventura | 5 |
| Realismo | 5 |
| Biografía | 5 |
| Literatura colombiana | 5 |
| Literatura medieval | 3 |
| Novela picaresca | 3 |
| Literatura filipina | 3 |
| Costumbrismo | 3 |
| Literatura infantil | 2 |
| Tradición oral | 2 |
| Literatura juvenil | 2 |
| Antología | 2 |
| Ciencia ficción | 2 |
| Naturalismo | 2 |
| Modernismo | 2 |
| Crónica | 2 |
| Fábulas | 1 |
| Valores | 1 |
| Novela corta | 1 |
| Terror | 1 |
| Astronomía | 1 |
| Divulgación | 1 |
| Naturaleza | 1 |
| Prosa satírica | 1 |
| Novela alegórica | 1 |
| Periodismo | 1 |
| Policiaco | 1 |
| Memorias | 1 |
| Arte | 1 |

## Títulos

| ID PG | Título | Autor | † autor | Traductor (†) | Grados | SHA-256 (prefijo) | Bytes |
|---|---|---|---|---|---|---|---|
| [36558](https://www.gutenberg.org/ebooks/36558) | Ratón Pérez: cuento infantil | Luis Coloma | 1915 | — | 1–4 | `4c5c1415bfb9` | 24248 |
| [69164](https://www.gutenberg.org/ebooks/69164) | Cuentos chilenos de nunca acabar | Ramón A. Laval | 1929 | — | 2–6 | `29d617874901` | 149518 |
| [63424](https://www.gutenberg.org/ebooks/63424) | Cuentos populares en Chile | Ramón A. Laval | 1929 | — | 4–8 | `cd355343ea52` | 288910 |
| [29497](https://www.gutenberg.org/ebooks/29497) | Fábulas literarias | Tomás de Iriarte | 1791 | — | 4–8 | `0d0285c59a23` | 126648 |
| [73486](https://www.gutenberg.org/ebooks/73486) | Corazón | Edmondo De Amicis | 1908 | anónimo, pre-1946 | 4–8 | `6719a868bc47` | 331623 |
| [45438](https://www.gutenberg.org/ebooks/45438) | La isla del tesoro | Robert Louis Stevenson | 1894 | Manuel Caballero (1926) | 5–9 | `3ce7f48fc8d2` | 308959 |
| [57648](https://www.gutenberg.org/ebooks/57648) | Romancero selecto del Cid | Anónimo | — | — | 5–9 | `2684144aea14` | 272063 |
| [77298](https://www.gutenberg.org/ebooks/77298) | Las mejores tradiciones peruanas | Ricardo Palma | 1919 | — | 6–11 | `113ca0359420` | 337442 |
| [55812](https://www.gutenberg.org/ebooks/55812) | Cuentos de navidad y reyes; cuentos de la patria; cuentos antiguos | Emilia Pardo Bazán | 1921 | — | 6–10 | `39e8e8ede012` | 234907 |
| [77072](https://www.gutenberg.org/ebooks/77072) | Las aventuras de Telémaco seguidas de las de Aristonoo | Fénelon | 1715 | Mariano Antonio Collado (1853) | 6–10 | `4096b41e1a75` | 643739 |
| [64656](https://www.gutenberg.org/ebooks/64656) | Historia de los siete murciélagos, leyenda árabe | Manuel Fernández y González | 1888 | — | 6–9 | `0f35723e9068` | 270625 |
| [57654](https://www.gutenberg.org/ebooks/57654) | La Ilíada | Homero | -651 | Luis Segalá y Estalella (1938) | 7–11 | `15a476eb1fa4` | 599261 |
| [58221](https://www.gutenberg.org/ebooks/58221) | La Odisea | Homero | -651 | Luis Segalá y Estalella (1938) | 7–11 | `da66fdaa4824` | 565756 |
| [75703](https://www.gutenberg.org/ebooks/75703) | Libro de poemas | Federico García Lorca | 1936 | — | 7–11 | `6405f22c4760` | 129994 |
| [53552](https://www.gutenberg.org/ebooks/53552) | Obras escogidas | Gustavo Adolfo Bécquer | 1870 | — | 7–11 | `55aa74060d51` | 343039 |
| [65880](https://www.gutenberg.org/ebooks/65880) | Las cien mejores poesías (lí­ricas) de la lengua castellana | Selección de Marcelino Menéndez y Pelayo | — | — | 7–11 | `83a901c9c073` | 313977 |
| [49437](https://www.gutenberg.org/ebooks/49437) | Páginas escogidas | Antonio Machado | 1939 | — | 8–11 | `de27d62634b0` | 139203 |
| [10825](https://www.gutenberg.org/ebooks/10825) | La Navidad en las Montañas | Ignacio Manuel Altamirano | 1893 | — | 7–11 | `b24a1eb5a806` | 160202 |
| [62359](https://www.gutenberg.org/ebooks/62359) | El anacronópete; Viaje a China; Metempsicosis | Enrique Gaspar | 1902 | — | 7–11 | `1077b30ad792` | 395767 |
| [29506](https://www.gutenberg.org/ebooks/29506) | El sombrero de tres picos Historia verdadera de un sucedido que anda en romances | Pedro Antonio de Alarcón | 1891 | — | 8–11 | `ab927ce3a253` | 287253 |
| [29731](https://www.gutenberg.org/ebooks/29731) | El Capitán Veneno The Hispanic Series | Pedro Antonio de Alarcón | 1891 | — | 8–11 | `74cc35518f8c` | 234898 |
| [16961](https://www.gutenberg.org/ebooks/16961) | Trafalgar | Benito Pérez Galdós | 1920 | — | 8–11 | `20cabf113ff1` | 201271 |
| [17340](https://www.gutenberg.org/ebooks/17340) | Marianela | Benito Pérez Galdós | 1920 | — | 8–11 | `889476794d8b` | 287519 |
| [320](https://www.gutenberg.org/ebooks/320) | Vida De Lazarillo De Tormes Y De Sus Fortunas Y Adversidades | Anónimo | — | — | 8–11 | `507cae738f33` | 123324 |
| [2000](https://www.gutenberg.org/ebooks/2000) | Don Quijote | Miguel de Cervantes Saavedra | 1616 | — | 8–11 | `382ddbe4c60a` | 949563 |
| [57955](https://www.gutenberg.org/ebooks/57955) | Los entremeses | Miguel de Cervantes Saavedra | 1616 | — | 8–11 | `323aa599c548` | 160155 |
| [49333](https://www.gutenberg.org/ebooks/49333) | Coplas por la muerte de su padre | Jorge Manrique | 1479 | — | 8–11 | `90ede6978502` | 92408 |
| [50027](https://www.gutenberg.org/ebooks/50027) | El sí de las niñas | Leandro Fernández de Moratín | 1828 | — | 8–11 | `26153b51deb1` | 114351 |
| [14765](https://www.gutenberg.org/ebooks/14765) | El Gaucho Martín Fierro | José Hernández | 1886 | — | 8–11 | `5183574dd6b2` | 107627 |
| [15066](https://www.gutenberg.org/ebooks/15066) | La Vuelta de Martín Fierro | José Hernández | 1886 | — | 8–11 | `483abd178348` | 145276 |
| [18600](https://www.gutenberg.org/ebooks/18600) | Mi Ultimo Adiós | José Rizal | 1896 | — | 8–11 | `4612e60cc9d9` | 76412 |
| [79262](https://www.gutenberg.org/ebooks/79262) | Parábolas | José Enrique Rodó | 1917 | — | 8–11 | `28b6906cc29b` | 154474 |
| [75382](https://www.gutenberg.org/ebooks/75382) | Pachín González | José María de Pereda | 1906 | — | 8–11 | `01f49734bf23` | 331868 |
| [27900](https://www.gutenberg.org/ebooks/27900) | El manco de Lepanto episodio de la vida del príncipe de los ingenios, Miguel de  | Manuel Fernández y González | 1888 | — | 8–11 | `0a200dc005fc` | 205480 |
| [65685](https://www.gutenberg.org/ebooks/65685) | Libros de caballerías Selección | Selección de Ramón María Tenreiro | — | — | 8–11 | `dd368342cc4f` | 334805 |
| [46196](https://www.gutenberg.org/ebooks/46196) | Cuentos Clásicos del Norte, Primera Serie | Edgar Allan Poe | 1849 | Carmen Torres Calderón de Pinillos (1943) | 8–11 | `768d9a79ed17` | 230637 |
| [46496](https://www.gutenberg.org/ebooks/46496) | Cuentos Clásicos del Norte, Segunda Serie | Washington Irving, Edward Everett Hale, Nathaniel Hawthorne | 1909 | Carmen Torres Calderón de Pinillos (1943) | 8–11 | `d841c0246921` | 270110 |
| [29770](https://www.gutenberg.org/ebooks/29770) | Plick y Plock | Eugène Sue | 1857 | Tomás Orts-Ramos (1939) | 8–11 | `641d0f7e7b2f` | 213100 |
| [36546](https://www.gutenberg.org/ebooks/36546) | Los pescadores de "Trépang" | Emilio Salgari | 1911 | anónimo, pre-1946 | 8–11 | `cd78e370a51f` | 210955 |
| [24801](https://www.gutenberg.org/ebooks/24801) | El prisionero de Zenda | Anthony Hope | 1933 | anónimo, pre-1946 | 8–11 | `3d89f86166e9` | 202101 |
| [24823](https://www.gutenberg.org/ebooks/24823) | Silas Marner | George Eliot | 1880 | anónimo, pre-1946 | 8–11 | `a51a26ff0d83` | 256704 |
| [22975](https://www.gutenberg.org/ebooks/22975) | La niña robada | Hendrik Conscience | 1883 | anónimo, pre-1946 | 8–11 | `03394e221955` | 144859 |
| [66902](https://www.gutenberg.org/ebooks/66902) | Los desposados: Historia milanesa del siglo XVII - Tomo 1 | Alessandro Manzoni | 1873 | anónimo, pre-1946 | 9–11 | `46589a05e577` | 397564 |
| [67231](https://www.gutenberg.org/ebooks/67231) | Los desposados: Historia milanesa del siglo XVII - Tomo 2 | Alessandro Manzoni | 1873 | anónimo, pre-1946 | 9–11 | `40cd6fe6a57e` | 433354 |
| [20930](https://www.gutenberg.org/ebooks/20930) | Cosmografía | Amédée Guillemin | 1893 | anónimo, pre-1946 | 7–11 | `5c36d30b4a90` | 119277 |
| [26284](https://www.gutenberg.org/ebooks/26284) | El Mar | Jules Michelet | 1874 | anónimo, pre-1946 | 9–11 | `04f2bd7571fb` | 283840 |
| [16625](https://www.gutenberg.org/ebooks/16625) | Clásicos Castellanos: Libro de Buen Amor | Juan Ruiz, Arcipreste de Hita | 1350 | — | 10–11 | `63b12452509d` | 668725 |
| [61202](https://www.gutenberg.org/ebooks/61202) | Novelas ejemplares | Miguel de Cervantes Saavedra | 1616 | — | 9–11 | `9d8d60f48642` | 529918 |
| [16110](https://www.gutenberg.org/ebooks/16110) | Viage al Parnaso La Numancia (Tragedia) y El Trato de Argel (Comedia) | Miguel de Cervantes Saavedra | 1616 | — | 10–11 | `1bfcab514403` | 219804 |
| [12457](https://www.gutenberg.org/ebooks/12457) | El Diablo Cojuelo | Luis Vélez de Guevara | 1644 | — | 9–11 | `3aee3599b707` | 329346 |
| [32315](https://www.gutenberg.org/ebooks/32315) | Historia de la vida del Buscón, llamado Don Pablos, ejemplo de vagabundos y espe | Francisco de Quevedo | 1645 | — | 9–11 | `ae5c8b462284` | 175261 |
| [65999](https://www.gutenberg.org/ebooks/65999) | Los Sueños, Volume I | Francisco de Quevedo | 1645 | — | 10–11 | `3589b0765596` | 334399 |
| [62691](https://www.gutenberg.org/ebooks/62691) | El criticón (tomo 1 de 2) | Baltasar Gracián y Morales | 1658 | — | 10–11 | `e40f122a83b0` | 370420 |
| [60198](https://www.gutenberg.org/ebooks/60198) | Fuente Ovejuna | Lope de Vega | 1635 | — | 9–11 | `2201de522eb1` | 103321 |
| [57590](https://www.gutenberg.org/ebooks/57590) | La verdad sospechosa | Juan Ruiz de Alarcón | 1639 | — | 8–11 | `34d39a8316c7` | 144069 |
| [77445](https://www.gutenberg.org/ebooks/77445) | Las paredes oyen | Juan Ruiz de Alarcón | 1639 | — | 9–11 | `83f740c13de5` | 168480 |
| [54436](https://www.gutenberg.org/ebooks/54436) | Teatro selecto, tomo 1 de 4 | Pedro Calderón de la Barca | 1681 | — | 9–11 | `bdd95c2ff36a` | 350716 |
| [76276](https://www.gutenberg.org/ebooks/76276) | El lindo don Diego | Agustín Moreto | 1669 | — | 8–11 | `6c21b9735dd8` | 179877 |
| [60147](https://www.gutenberg.org/ebooks/60147) | Vida del escudero Marcos de Obregón | Vicente Espinel | 1624 | — | 10–11 | `d14339360124` | 494149 |
| [74087](https://www.gutenberg.org/ebooks/74087) | Obras selectas de la celebre monja de Mejico, sor Juana Ines de la Cruz | Sor Juana Inés de la Cruz | 1695 | — | 9–11 | `8147497ebd86` | 318904 |
| [50492](https://www.gutenberg.org/ebooks/50492) | Historia de Gil Blas de Santillana: Novela (Vol 1 de 3) | Alain René Le Sage | 1747 | José Francisco de Isla (1781) | 9–11 | `2b9004f91845` | 299318 |
| [52682](https://www.gutenberg.org/ebooks/52682) | Historia de Gil Blas de Santillana: Novela (Vol 2 de 3) | Alain René Le Sage | 1747 | José Francisco de Isla (1781) | 9–11 | `b742d3505eeb` | 316778 |
| [55796](https://www.gutenberg.org/ebooks/55796) | Historia de Gil Blas de Santillana: Novela (Vol 3 de 3) | Alain René Le Sage | 1747 | José Francisco de Isla (1781) | 9–11 | `8ec446f46399` | 430365 |
| [58261](https://www.gutenberg.org/ebooks/58261) | Vida de Cervantes | Gregorio Mayans y Siscar | 1781 | — | 9–11 | `92ee513715ab` | 201557 |
| [60927](https://www.gutenberg.org/ebooks/60927) | Comedias escogidas | Leandro Fernández de Moratín, Molière | 1828 | — | 9–11 | `c50af9ddc771` | 287591 |
| [56454](https://www.gutenberg.org/ebooks/56454) | Hamlet: Drama en cinco actos | William Shakespeare | 1616 | Leandro Fernández de Moratín (1828) | 9–11 | `7d5eea3bda2b` | 146842 |
| [31541](https://www.gutenberg.org/ebooks/31541) | Fígaro (Artículos selectos) | Mariano José de Larra | 1837 | — | 9–11 | `59f9a8abf6e4` | 295417 |
| [59492](https://www.gutenberg.org/ebooks/59492) | Don Álvaro, o, La fuerza del Sino | Duque de Rivas | 1865 | — | 9–11 | `91d4b396192f` | 114027 |
| [76073](https://www.gutenberg.org/ebooks/76073) | Traidor, inconfeso y martir | José Zorrilla | 1893 | — | 9–11 | `65d712b5d80d` | 184124 |
| [70984](https://www.gutenberg.org/ebooks/70984) | En las orillas del Sar | Rosalía de Castro | 1885 | — | 8–11 | `96c3bca50edc` | 232560 |
| [23600](https://www.gutenberg.org/ebooks/23600) | La gaviota | Fernán Caballero | 1877 | — | 9–11 | `347aebeabbe4` | 308719 |
| [26314](https://www.gutenberg.org/ebooks/26314) | Viajes por España | Pedro Antonio de Alarcón | 1891 | — | 9–11 | `6c3cc442ba01` | 263988 |
| [59154](https://www.gutenberg.org/ebooks/59154) | El Niño de la Bola: Novela | Pedro Antonio de Alarcón | 1891 | — | 9–11 | `eebff231e34d` | 266987 |
| [61244](https://www.gutenberg.org/ebooks/61244) | Cosas que fueron: Cuadros de costumbres | Pedro Antonio de Alarcón | 1891 | — | 9–11 | `87bcb4f4924a` | 214070 |
| [67248](https://www.gutenberg.org/ebooks/67248) | El clavo | Pedro Antonio de Alarcón | 1891 | — | 9–11 | `3c3ec601aeac` | 135881 |
| [27214](https://www.gutenberg.org/ebooks/27214) | Cuentos y diálogos | Juan Valera | 1905 | — | 9–11 | `e364de00bc2d` | 171071 |
| [17223](https://www.gutenberg.org/ebooks/17223) | Pepita Jiménez | Juan Valera | 1905 | — | 10–11 | `f7fb684d03b1` | 202326 |
| [13210](https://www.gutenberg.org/ebooks/13210) | El Comendador Mendoza Obras Completas Tomo VII | Juan Valera | 1905 | — | 10–11 | `34d7fe82a62e` | 234930 |
| [21831](https://www.gutenberg.org/ebooks/21831) | Misericordia | Benito Pérez Galdós | 1920 | — | 10–11 | `4d983c256757` | 295437 |
| [66488](https://www.gutenberg.org/ebooks/66488) | El abuelo (Novela en cinco jornadas) | Benito Pérez Galdós | 1920 | — | 10–11 | `203c451e177e` | 298482 |
| [11070](https://www.gutenberg.org/ebooks/11070) | La Fontana de Oro | Benito Pérez Galdós | 1920 | — | 10–11 | `b442421004a7` | 416341 |
| [15206](https://www.gutenberg.org/ebooks/15206) | Torquemada en la hoguera | Benito Pérez Galdós | 1920 | — | 10–11 | `b45d4265dee5` | 246220 |
| [53355](https://www.gutenberg.org/ebooks/53355) | La novela en el tranvía | Benito Pérez Galdós | 1920 | — | 9–11 | `b8297b7cf6ef` | 93155 |
| [55563](https://www.gutenberg.org/ebooks/55563) | El amigo Manso | Benito Pérez Galdós | 1920 | — | 10–11 | `4af908f9f51b` | 344570 |
| [28002](https://www.gutenberg.org/ebooks/28002) | Electra | Benito Pérez Galdós | 1920 | — | 10–11 | `8e453c645312` | 214578 |
| [52392](https://www.gutenberg.org/ebooks/52392) | Miau | Benito Pérez Galdós | 1920 | — | 10–11 | `d125695b6acc` | 322738 |
| [73322](https://www.gutenberg.org/ebooks/73322) | Nazarín | Benito Pérez Galdós | 1920 | — | 10–11 | `414858262fbc` | 314237 |
| [67126](https://www.gutenberg.org/ebooks/67126) | El caballero encantado (cuento real... inverosí­mil) | Benito Pérez Galdós | 1920 | — | 9–11 | `953a81afa642` | 351670 |
| [14311](https://www.gutenberg.org/ebooks/14311) | Bailén | Benito Pérez Galdós | 1920 | — | 8–11 | `e5fc4cdcc4bd` | 245319 |
| [21906](https://www.gutenberg.org/ebooks/21906) | Cádiz | Benito Pérez Galdós | 1920 | — | 8–11 | `dd5c5c285944` | 268542 |
| [49433](https://www.gutenberg.org/ebooks/49433) | Zaragoza | Benito Pérez Galdós | 1920 | — | 8–11 | `7387b7445280` | 230907 |
| [67415](https://www.gutenberg.org/ebooks/67415) | Gerona | Benito Pérez Galdós | 1920 | — | 8–11 | `bb59c274caac` | 267413 |
| [67155](https://www.gutenberg.org/ebooks/67155) | La corte de Carlos IV | Benito Pérez Galdós | 1920 | — | 8–11 | `65d58aedeed5` | 286811 |
| [67189](https://www.gutenberg.org/ebooks/67189) | El 19 de marzo y el 2 de mayo | Benito Pérez Galdós | 1920 | — | 8–11 | `4bdacc7b75c4` | 292739 |
| [67360](https://www.gutenberg.org/ebooks/67360) | Napoleón en Chamartín | Benito Pérez Galdós | 1920 | — | 8–11 | `8b67f3da3f67` | 310433 |
| [67705](https://www.gutenberg.org/ebooks/67705) | Juan Martín el Empecinado | Benito Pérez Galdós | 1920 | — | 8–11 | `e0923329a90d` | 286708 |
| [67817](https://www.gutenberg.org/ebooks/67817) | La batalla de los Arapiles | Benito Pérez Galdós | 1920 | — | 8–11 | `dfdc5a580fa3` | 405639 |
| [17073](https://www.gutenberg.org/ebooks/17073) | La Regenta | Leopoldo Alas «Clarín» | 1901 | — | 11–11 | `6a7232078dc9` | 882111 |
| [62361](https://www.gutenberg.org/ebooks/62361) | El Señor y los demás son Cuentos | Leopoldo Alas «Clarín» | 1901 | — | 10–11 | `443dcf2d59bd` | 223329 |
| [18005](https://www.gutenberg.org/ebooks/18005) | Los pazos de Ulloa | Emilia Pardo Bazán | 1921 | — | 10–11 | `16816dfd0fe6` | 300570 |
| [55514](https://www.gutenberg.org/ebooks/55514) | Cuentos de amor | Emilia Pardo Bazán | 1921 | — | 10–11 | `1be1b0dd7ec2` | 237591 |
| [75814](https://www.gutenberg.org/ebooks/75814) | En tranvía | Emilia Pardo Bazán | 1921 | — | 9–11 | `b30623f0520f` | 279569 |
| [49388](https://www.gutenberg.org/ebooks/49388) | Sotileza | José María de Pereda | 1906 | — | 9–11 | `b9e2e0022115` | 390811 |
| [24127](https://www.gutenberg.org/ebooks/24127) | Peñas arriba | José María de Pereda | 1906 | — | 9–11 | `8ae350b45982` | 398571 |
| [12627](https://www.gutenberg.org/ebooks/12627) | Escenas Montañesas | José María de Pereda | 1906 | — | 9–11 | `10946ca298b8` | 310282 |
| [53429](https://www.gutenberg.org/ebooks/53429) | El sabor de la tierruca | José María de Pereda | 1906 | — | 9–11 | `9cb390cfb66e` | 325540 |
| [31013](https://www.gutenberg.org/ebooks/31013) | La hermana San Sulpicio | Armando Palacio Valdés | 1938 | — | 10–11 | `36c4ff01890f` | 381298 |
| [36573](https://www.gutenberg.org/ebooks/36573) | La aldea perdida Novela-poema de costumbres campesinas | Armando Palacio Valdés | 1938 | — | 9–11 | `95cceb01a99e` | 312677 |
| [39444](https://www.gutenberg.org/ebooks/39444) | Páginas escogidas | Armando Palacio Valdés | 1938 | — | 9–11 | `e1a35dc4bc0b` | 286546 |
| [38814](https://www.gutenberg.org/ebooks/38814) | La novela de un novelista | Armando Palacio Valdés | 1938 | — | 9–11 | `ea021805eff2` | 327750 |
| [49413](https://www.gutenberg.org/ebooks/49413) | El señor de Bembibre | Enrique Gil y Carrasco | 1846 | — | 9–11 | `79e4d91a1bb3` | 416641 |
| [33275](https://www.gutenberg.org/ebooks/33275) | El cocinero de su majestad: Memorias del tiempo de Felipe III | Manuel Fernández y González | 1888 | — | 9–11 | `1ab7b79856a5` | 768866 |
| [44584](https://www.gutenberg.org/ebooks/44584) | Los monfíes de las Alpujarras: novela original | Manuel Fernández y González | 1888 | — | 9–11 | `2fc519728c37` | 988543 |
| [49660](https://www.gutenberg.org/ebooks/49660) | La alhambra; leyendas árabes | Manuel Fernández y González | 1888 | — | 8–11 | `0c13392c44ff` | 563588 |
| [14944](https://www.gutenberg.org/ebooks/14944) | La Barraca | Vicente Blasco Ibáñez | 1928 | — | 9–11 | `12ef3defcc54` | 221941 |
| [66514](https://www.gutenberg.org/ebooks/66514) | Cuentos valencianos | Vicente Blasco Ibáñez | 1928 | — | 9–11 | `e61d24467284` | 206655 |
| [24536](https://www.gutenberg.org/ebooks/24536) | Los cuatro jinetes del apocalipsis | Vicente Blasco Ibáñez | 1928 | — | 10–11 | `f32101b66523` | 412153 |
| [41746](https://www.gutenberg.org/ebooks/41746) | Flor de mayo | Vicente Blasco Ibáñez | 1928 | — | 10–11 | `385165a33643` | 263395 |
| [63810](https://www.gutenberg.org/ebooks/63810) | La vuelta al mundo de un novelista; vol. 1/3 | Vicente Blasco Ibáñez | 1928 | — | 9–11 | `3489f1bd80e3` | 340838 |
| [63816](https://www.gutenberg.org/ebooks/63816) | La vuelta al mundo de un novelista; vol. 2/3 | Vicente Blasco Ibáñez | 1928 | — | 9–11 | `ea65d7da598c` | 342908 |
| [49836](https://www.gutenberg.org/ebooks/49836) | Niebla (Nivola) | Miguel de Unamuno | 1936 | — | 10–11 | `cfa1f6342524` | 227072 |
| [44512](https://www.gutenberg.org/ebooks/44512) | Abel Sánchez: Una Historia de Pasión | Miguel de Unamuno | 1936 | — | 10–11 | `22c9b2f9d720` | 127917 |
| [75472](https://www.gutenberg.org/ebooks/75472) | Vida de Don Quijote y Sancho | Miguel de Unamuno | 1936 | — | 10–11 | `f1cabae1b44d` | 483566 |
| [78052](https://www.gutenberg.org/ebooks/78052) | Andanzas y visiones españolas | Miguel de Unamuno | 1936 | — | 10–11 | `6b15e7c14087` | 310145 |
| [68525](https://www.gutenberg.org/ebooks/68525) | Poesías completas | Antonio Machado | 1939 | — | 8–11 | `6d56013e3e9a` | 189413 |
| [72665](https://www.gutenberg.org/ebooks/72665) | Romancero gitano | Federico García Lorca | 1936 | — | 9–11 | `d29f8489e9ac` | 153259 |
| [68745](https://www.gutenberg.org/ebooks/68745) | Luces de Bohemia: Esperpento | Ramón del Valle-Inclán | 1936 | — | 10–11 | `15c652033c33` | 268732 |
| [68154](https://www.gutenberg.org/ebooks/68154) | Tirano Banderas: Novela de tierra caliente | Ramón del Valle-Inclán | 1936 | — | 10–11 | `ceb0a9acb2f2` | 433652 |
| [49013](https://www.gutenberg.org/ebooks/49013) | La venganza de Don Mendo | Pedro Muñoz Seca | 1936 | — | 8–11 | `0b5270110677` | 154643 |
| [53947](https://www.gutenberg.org/ebooks/53947) | La señorita de Trevelez: Farsa cómica en tres actos | Carlos Arniches y Barrera | 1943 | — | 9–11 | `41465c6d7657` | 118198 |
| [63019](https://www.gutenberg.org/ebooks/63019) | Sainetes | Carlos Arniches y Barrera | 1943 | — | 8–11 | `eab242316f61` | 297128 |
| [76793](https://www.gutenberg.org/ebooks/76793) | Marcela, o ¿a cuál de los tres? | Manuel Bretón de los Herreros | 1873 | — | 8–11 | `64fa0bf466a6` | 162015 |
| [58331](https://www.gutenberg.org/ebooks/58331) | Recuerdos de mi vida (tomo 1 de 2) | Santiago Ramón y Cajal | 1934 | — | 8–11 | `44e797d21aa8` | 323933 |
| [60675](https://www.gutenberg.org/ebooks/60675) | Recuerdos de mi vida (tomo 2 de 2) | Santiago Ramón y Cajal | 1934 | — | 8–11 | `2c33a6a659d8` | 515477 |
| [66373](https://www.gutenberg.org/ebooks/66373) | Reglas y consejos sobre investigación científica (Los tónicos de la voluntad) | Santiago Ramón y Cajal | 1934 | — | 10–11 | `299ada91b84e` | 274769 |
| [47650](https://www.gutenberg.org/ebooks/47650) | Prosas Profanas Obras Completas Vol. II | Rubén Darío | 1916 | — | 9–11 | `0d0eb4492789` | 67870 |
| [50341](https://www.gutenberg.org/ebooks/50341) | Cantos de Vida y Esperanza, Los Cisnes y otros poemas. Obras Completas Vol. VII | Rubén Darío | 1916 | — | 9–11 | `6e123a4d926e` | 59750 |
| [22899](https://www.gutenberg.org/ebooks/22899) | Ariel | José Enrique Rodó | 1917 | — | 9–11 | `ce4299f6a452` | 126683 |
| [13507](https://www.gutenberg.org/ebooks/13507) | Cuentos de Amor de Locura y de Muerte | Horacio Quiroga | 1937 | — | 9–11 | `bbba722f638b` | 206556 |
| [21282](https://www.gutenberg.org/ebooks/21282) | Tradiciones peruanas | Ricardo Palma | 1919 | — | 8–11 | `4cffa3c744ba` | 205981 |
| [65689](https://www.gutenberg.org/ebooks/65689) | Las Fuerzas Extrañas | Leopoldo Lugones | 1938 | — | 9–11 | `92fa106b05ba` | 252393 |
| [56451](https://www.gutenberg.org/ebooks/56451) | El Payador, Vol. I Hijo de la Pampa | Leopoldo Lugones | 1938 | — | 10–11 | `b5d8602076ba` | 305760 |
| [33267](https://www.gutenberg.org/ebooks/33267) | Facundo | Domingo Faustino Sarmiento | 1888 | — | 10–11 | `194c70049d83` | 295250 |
| [61508](https://www.gutenberg.org/ebooks/61508) | Eneida; v.1 de 2 | Virgilio | -20 | Miguel Antonio Caro (1909) | 9–11 | `b92a15fc4efc` | 241013 |
| [67197](https://www.gutenberg.org/ebooks/67197) | Eneida; v. 2 de 2 | Virgilio | -20 | Miguel Antonio Caro (1909) | 9–11 | `e2bc879fdd19` | 324665 |
| [14329](https://www.gutenberg.org/ebooks/14329) | Viajes de un Colombiano en Europa, primera serie | José María Samper | 1888 | — | 10–11 | `b8ae090b2868` | 540223 |
| [15054](https://www.gutenberg.org/ebooks/15054) | Viajes de un Colombiano en Europa, segunda serie | José María Samper | 1888 | — | 10–11 | `7bd517a43d50` | 417899 |
| [29014](https://www.gutenberg.org/ebooks/29014) | En viaje (1881-1882) | Miguel Cané | 1905 | — | 10–11 | `f6e747746b2b` | 352017 |
| [28281](https://www.gutenberg.org/ebooks/28281) | Cecilia Valdés o la Loma del Ángel | Cirilo Villaverde | 1894 | — | 10–11 | `265f9c69de1c` | 563472 |
| [75126](https://www.gutenberg.org/ebooks/75126) | Sab (novela original) | Gertrudis Gómez de Avellaneda | 1873 | — | 10–11 | `5235e0a35637` | 216665 |
| [49560](https://www.gutenberg.org/ebooks/49560) | Monja y casada, vírgen y mártir | Vicente Riva Palacio | 1896 | — | 10–11 | `9759ebb8ef67` | 437598 |
| [31724](https://www.gutenberg.org/ebooks/31724) | La gran aldea; costumbres bonaerenses | Lucio Vicente López | 1894 | — | 10–11 | `2faa6996677b` | 203327 |
| [62785](https://www.gutenberg.org/ebooks/62785) | Pago Chico | Roberto Jorge Payró | 1928 | — | 8–11 | `55386c00a531` | 260464 |
| [63600](https://www.gutenberg.org/ebooks/63600) | Una Excursión a los Indios Ranqueles - Tomo 1 | Lucio V. Mansilla | 1913 | — | 10–11 | `e69749e63208` | 512779 |
| [63767](https://www.gutenberg.org/ebooks/63767) | Una excursión a los indios ranqueles - Tomo 2 | Lucio V. Mansilla | 1913 | — | 10–11 | `613f26624f62` | 365298 |
| [53798](https://www.gutenberg.org/ebooks/53798) | Ranchos (Costumbres del Campo) | Javier de Viana | 1926 | — | 9–11 | `f54deb0d0c31` | 192045 |
| [60376](https://www.gutenberg.org/ebooks/60376) | Cuentos de poeta | Rufino Blanco-Fombona | 1944 | — | 9–11 | `5e4880d02a27` | 160141 |
| [62564](https://www.gutenberg.org/ebooks/62564) | Oasis en la vida | Juana Manuela Gorriti | 1892 | — | 9–11 | `735c3f3cb3e5` | 148132 |
| [63378](https://www.gutenberg.org/ebooks/63378) | El corazón juglar | Luis G. Urbina | 1934 | — | 9–11 | `58adc46e997a` | 106153 |
| [35407](https://www.gutenberg.org/ebooks/35407) | Rimas | Bartolomé Mitre | 1906 | — | 9–11 | `dc358a0efaa9` | 243636 |
| [75613](https://www.gutenberg.org/ebooks/75613) | Cuentos de Fray Mocho | José S. Álvarez («Fray Mocho») | 1903 | — | 9–11 | `0d15903dd869` | 291745 |
| [64974](https://www.gutenberg.org/ebooks/64974) | El Hombre Mediocre: Ensayo de psicologia y moral | José Ingenieros | 1925 | — | 10–11 | `d57aa2b043d0` | 290207 |
| [73064](https://www.gutenberg.org/ebooks/73064) | Moral social | Eugenio María de Hostos | 1903 | — | 10–11 | `2bec58568f49` | 310580 |
| [44918](https://www.gutenberg.org/ebooks/44918) | Hombres y glorias de América | Enrique Piñeyro | 1911 | — | 8–11 | `bd60c9927214` | 301662 |
| [61739](https://www.gutenberg.org/ebooks/61739) | Los exploradores españoles del siglo XVI | Charles Fletcher Lummis | 1928 | Arturo Cuyás (1925) | 9–11 | `a34d44a4548c` | 279122 |
| [59879](https://www.gutenberg.org/ebooks/59879) | Américo Vespucio | G. Pérez Gomar | 1885 | — | 8–11 | `972d1d8ef06d` | 173620 |
| [73179](https://www.gutenberg.org/ebooks/73179) | Colon en Puerto-Rico | Cayetano Coll y Toste | 1930 | — | 8–11 | `3d49e4100c07` | 302926 |
| [47584](https://www.gutenberg.org/ebooks/47584) | Noli me tángere Novela Tagala, Edición completa con notas de R. Sempau | José Rizal | 1896 | — | 10–11 | `f36cc74c9e94` | 555045 |
| [30903](https://www.gutenberg.org/ebooks/30903) | El Filibusterismo (Continuación del Noli me tángere) | José Rizal | 1896 | — | 10–11 | `9ad42212c5fd` | 389084 |
| [64945](https://www.gutenberg.org/ebooks/64945) | Verdadera historia de los sucesos de la conquista de la Nueva-España (1 de 3) | Bernal Díaz del Castillo | 1584 | — | 9–11 | `7eb3d63cbddd` | 473939 |
| [64946](https://www.gutenberg.org/ebooks/64946) | Verdadera historia de los sucesos de la conquista de la Nueva-España (2 de 3) | Bernal Díaz del Castillo | 1584 | — | 9–11 | `e469faafccda` | 422579 |
| [64947](https://www.gutenberg.org/ebooks/64947) | Verdadera historia de los sucesos de la conquista de la Nueva-España (3 de 3) | Bernal Díaz del Castillo | 1584 | — | 9–11 | `93ee56f5a4c3` | 324793 |
| [49298](https://www.gutenberg.org/ebooks/49298) | Historia de las Indias (vol. 1 de 5) | Bartolomé de las Casas | 1566 | — | 10–11 | `ebdbffc01bff` | 569863 |
| [25255](https://www.gutenberg.org/ebooks/25255) | Segunda parte de la crónica del Perú, que trata del señorio de los Incas Yupanqu | Pedro de Cieza de León | 1554 | — | 10–11 | `2bd21c90c935` | 244787 |
| [25705](https://www.gutenberg.org/ebooks/25705) | Suma y narracion de los Incas, que los indios llamaron Capaccuna, que fueron señ | Juan de Betanzos | 1576 | — | 10–11 | `2897bd6ca949` | 161218 |
| [70219](https://www.gutenberg.org/ebooks/70219) | Historia natural y moral de las Indias (vol. 1 of 2) | José de Acosta | 1600 | — | 10–11 | `79e132e32b53` | 502001 |
| [50430](https://www.gutenberg.org/ebooks/50430) | Historia natural y moral de las Indias (vol. 2 of 2) | José de Acosta | 1600 | — | 10–11 | `5121bdc42c5a` | 356560 |
| [73500](https://www.gutenberg.org/ebooks/73500) | Obras dramáticas de Eurípides (1 de 3) | Eurípides | -407 | Eduardo de Mier (1914) | 10–11 | `365c6b4328f3` | 443269 |
| [74704](https://www.gutenberg.org/ebooks/74704) | Obras dramáticas de Eurípides (2 de 3) | Eurípides | -407 | Eduardo de Mier (1914) | 10–11 | `5e2efc020200` | 407882 |
| [75775](https://www.gutenberg.org/ebooks/75775) | Obras dramáticas de Eurípides (3 de 3) | Eurípides | -407 | Eduardo de Mier (1914) | 10–11 | `e6a8695d2217` | 377102 |
| [72753](https://www.gutenberg.org/ebooks/72753) | Los nueve libros de la Historia (1 de 2) | Heródoto | -421 | Bartomeu Pou i Puigserver (1802) | 10–11 | `e0f27b7ca822` | 537655 |
| [72754](https://www.gutenberg.org/ebooks/72754) | Los nueve libros de la Historia (2 de 2) | Heródoto | -421 | Bartomeu Pou i Puigserver (1802) | 10–11 | `fecdc04798b3` | 502297 |
| [57303](https://www.gutenberg.org/ebooks/57303) | La Divina Comedia | Dante Alighieri | 1321 | Manuel Aranda y Sanjuan (1900) | 10–11 | `a117bb9712f6` | 507609 |
| [46201](https://www.gutenberg.org/ebooks/46201) | Orlando Furioso, Tomo I | Lodovico Ariosto | 1533 | Manuel Aranda y Sanjuan (1900) | 10–11 | `76c4a9fc7c66` | 510021 |
| [49063](https://www.gutenberg.org/ebooks/49063) | Orlando Furioso, Tomo II | Lodovico Ariosto | 1533 | Manuel Aranda y Sanjuan (1900) | 10–11 | `dd14c3bd70ce` | 505409 |
| [68566](https://www.gutenberg.org/ebooks/68566) | Fausto: Primera parte | Johann Wolfgang von Goethe | 1832 | Teodoro Llorente (1911) | 10–11 | `eda1f80ec977` | 509756 |
| [53207](https://www.gutenberg.org/ebooks/53207) | Dramas de Guillermo Shakspeare [vol. 1] | William Shakespeare | 1616 | Marcelino Menéndez y Pelayo (1912) | 9–11 | `de2ce5bf6c7e` | 328378 |
| [67092](https://www.gutenberg.org/ebooks/67092) | El paraíso perdido | John Milton | 1674 | Cayetano Rosell (1883) | 10–11 | `aa251ab6f6cb` | 613140 |
| [49258](https://www.gutenberg.org/ebooks/49258) | Crónica de la conquista de Granada (1 de 2) | Washington Irving | 1859 | G. W. Montgomery (1841) | 9–11 | `849d081bc7ad` | 264969 |
| [49259](https://www.gutenberg.org/ebooks/49259) | Crónica de la conquista de Granada (2 de 2) | Washington Irving | 1859 | G. W. Montgomery (1841) | 9–11 | `4afa5e134b8c` | 261006 |
| [67819](https://www.gutenberg.org/ebooks/67819) | Bug-Jargal | Victor Hugo | 1885 | Dionisio Alcalá-Galiano (1805) | 9–11 | `0731be941081` | 338359 |
| [65486](https://www.gutenberg.org/ebooks/65486) | Dramas (1 de 2): Hernani; El Rey se divierte; Los Burgraves | Victor Hugo | 1885 | Cecilio Navarro (1889) | 10–11 | `88a460b9a39f` | 342302 |
| [65584](https://www.gutenberg.org/ebooks/65584) | Dramas (2 de 2): Lucrecia Borgia; María Tudor; La Esmeralda; Ruy Blas | Victor Hugo | 1885 | A. Blanco Prieto (1892) | 10–11 | `51a02d818718` | 364670 |
| [74908](https://www.gutenberg.org/ebooks/74908) | Cuentos escogidos | Guy de Maupassant | 1893 | Carlos de Batlle (1935) | 10–11 | `44fcbc792e89` | 417624 |
| [57505](https://www.gutenberg.org/ebooks/57505) | El tratado de la pintura | Leonardo da Vinci, Leon Battista Alberti | 1519 | Diego Antonio Rejón de Silva (1796) | 9–11 | `54269bcaa534` | 233728 |
| [51019](https://www.gutenberg.org/ebooks/51019) | La Biblia en España, Tomo I (de 3) O viajes, aventuras y prisiones de un inglés  | George Borrow | 1881 | Manuel Azaña (1940) | 10–11 | `b489448a6efb` | 294852 |
| [5985](https://www.gutenberg.org/ebooks/5985) | Zadig, ó El Destino, Historia Oriental | Voltaire | 1778 | José Marchena (1821) | 9–11 | `abb6244a4a83` | 140152 |
| [10821](https://www.gutenberg.org/ebooks/10821) | Manfredo Drama en tres actos | Lord Byron | 1824 | anónimo, pre-1946 | 10–11 | `8385720ecb7b` | 123924 |
| [18228](https://www.gutenberg.org/ebooks/18228) | El Mandarín | Eça de Queirós | 1900 | anónimo, pre-1946 | 10–11 | `006a398bc5ff` | 138803 |
| [29703](https://www.gutenberg.org/ebooks/29703) | El Abate Constantin | Ludovic Halévy | 1908 | anónimo, pre-1946 | 9–11 | `3430f579bfad` | 171205 |

## Candidatos notables rechazados por derechos

| ID PG | Obra | Motivo |
|---|---|---|
| 9980, 39209 | *Platero y yo*, Juan Ramón Jiménez | Autor †1958 (dominio público en Colombia en 2039) |
| 12848, 13264, 60464 y otros | Pío Baroja (*Zalacaín el aventurero*, *Las inquietudes de Shanti Andía*, *El árbol de la ciencia*…) | Autor †1956 |
| 76410, 67726 y otros | Jacinto Benavente (*La Malquerida*, *Señora ama*, *De sobremesa*) | Autor †1954 |
| 11657, 44529 y otros | Concha Espina (*La niña de Luzmela*…) | Autora †1955 |
| 57448, 57982 | José Ortega y Gasset | Autor †1955 |
| 26545, 67481 | Azorín | Autor †1967 |
| 14318, 57225 y otros | Ramón Pérez de Ayala | Autor †1962 |
| 29920 | *La gloria de don Ramiro*, Enrique Larreta | Autor †1961 |
| 58103 | *20 poemas para ser leídos en el tranvía*, Oliverio Girondo | Autor †1967 |
| 58375 | *La caravana pasa*, Rubén Darío | Prólogo de Alberto Ghiraldo †1946 |
| 47287, 47631… | *El libro de las mil noches y una noche* | Versión francesa de J. C. Mardrus †1949 (además, contenido adulto) |
| 55215 | *Cuando la tierra era niña*, N. Hawthorne | Traductor Gregorio Martínez Sierra †1947 |
| 69552 | *El libro de las tierras vírgenes*, R. Kipling | Traductor Ramón D. Perés †1956 |
| 64058 | *Fábulas y cuentos en verso* (selección) | Compiladora María Goyri †1955? |
| 53837 | *Antología de prosistas castellanos* | Compilador Ramón Menéndez Pidal †1968 |
| 68131 | Garcilaso de la Vega, *Obras* | Editor Tomás Navarro Tomás †1979 |
| 65738 | *El conde Lucanor*, Don Juan Manuel | Notas de F. J. Sánchez Cantón †1971 (detectado al revisar el EPUB) |
| 65815 | *Vidas ejemplares*, Romain Rolland (México, 1923) | Nota preliminar firmada por José Vasconcelos †1959 (detectado al revisar el EPUB) |
| 16082 | *Angelina*, Rafael Delgado | Estudio preliminar de Ventura García Calderón †1959 (detectado en el EPUB) |
| 1619 | *La Celestina* (ed. PG #1619) | Edición y notas de R. S. Rudder con «Copyright 1998»: licencia PG no estándar |
| 18166 | *Amistad funesta*, José Martí | Incluye textos de Miguel Tedín y Román Vélez, fechas de muerte no verificadas (detectado en el EPUB) |
| 41575 | *Juvenilia*, Miguel Cané | Prólogo de Horacio Ramos Mejía (1916), fecha de muerte no verificada (detectado en el EPUB) |
| 25671 | *Bocetos californianos*, Bret Harte | Traductor Ramón Volart, fecha de muerte no verificada (detectado en el EPUB) |
| 11598 | *La montaña*, Élisée Reclus | Traductor A. López Rodrigo, fecha de muerte no verificada (detectado en el EPUB) |
| 52262 | *Cuentos de la Alhambra*, W. Irving | Traductor Luis Lamarca, fecha de muerte desconocida |
| 75739, 78068 | *Los miserables*, V. Hugo | Traductor «J. A. R.», no identificable con fecha |
| 79356 | *Nuestra Señora de París*, V. Hugo | Traductor José Aguado y Menéndez, fecha desconocida |
| 61887, 62201 | Charles Dickens (*Historia de dos ciudades*, *Los ladrones de Londres*) | Traductores sin fecha de muerte conocida |
| 61851 | *El crimen y el castigo*, F. Dostoievski | Traductor Pedro Pedraza y Páez, fecha desconocida |
| 62627 | *El caso extraño del Doctor Jekyll*, R. L. Stevenson | Traductor Emilio A. Soulère, fecha desconocida |
| 36990 | *La letra escarlata*, N. Hawthorne | Traductor sin fechas en el catálogo |
| 63509 | Sófocles, *Edipo rey; Edipo en Colona; Antígona* | Traductor José Pérez Bojart, fecha desconocida |
| 64775 | *Los Lusíadas*, Camões | Traductor Luis Gómez de Tapia, fecha desconocida |
| 29706 | *Cartas de mi molino*, A. Daudet | Traductor F. Cabañas, fecha desconocida |
| 31544 | *La invasión o El loco Yégof*, Erckmann-Chatrian | Autor colectivo y traductor sin fechas |
| 11071 | *Naufragios*, Álvar Núñez Cabeza de Vaca | Catálogo sin año de muerte («active 16th century»); excluido por la regla estricta aunque es obra del siglo XVI — puede reconsiderarse manualmente |
| 60884 | *El Quijote apócrifo*, Alonso Fernández de Avellaneda | Autor seudónimo sin fechas (obra de 1614; excluida por la regla estricta) |
| 39947, 39948 | *Historia de Venezuela*, Pedro de Aguado | Autor sin año de muerte en el catálogo (siglo XVI; excluida por la regla estricta) |
| 66337–66340 | Ovidio, *Metamorfóseos* | Traductor Francisco Crivell e ilustrador sin fechas |

No se encontraron en español en Project Gutenberg: *María* (Jorge Isaacs), Rafael Pombo, José Asunción Silva, Tomás Carrasquilla, *Cuentos de la selva* (Quiroga), Amado Nervo, Manuel Gutiérrez Nájera, Alfonsina Storni. Gabriela Mistral (†1957) y Rómulo Gallegos (†1969) no son de dominio público en Colombia.


## Notas para la bibliotecaria

- Todas las entradas están en `DRAFT`: requieren revisión pedagógica antes de publicarse. `reviewNotes` señala temas sensibles (violencia, suicidio, esclavitud, racismo o visión colonial de época, contenido amoroso adulto) y particularidades de la edición.
- Varias obras son de 1880–1930 y usan ortografía antigua (á, ó, é como palabras; «dixo», «muger»). Algunos datos científicos o geográficos están desactualizados.
- Los EPUB conservan íntegra la cabecera y licencia de Project Gutenberg. Su uso en la biblioteca escolar es gratuito y no comercial; si se distribuyeran comercialmente, revisar la sección 1.E.8 de la licencia PG o retirar las marcas PG.
- Las portadas (`cover: null`) se generarán en otro proceso. Algunos EPUB sin imágenes incluyen una portada escaneada de la edición original (`cover.jpg`); fuera de los tres casos anteriores corresponden a ediciones de autores/ilustradores ≤1945 o a portadas generadas por PG, pero conviene que el proceso de portadas las sustituya.
- Lista completa de IDs descargados: `_tmp/download.log` (se conserva). Herramientas en `_tools/` (ejecutar con `python3 -I`).

## Lote 2

Recuperado el **2026-10-31/11-01**. **120 EPUB** adicionales en `libros/` (87 de Wikisource en español y 33 de Project Gutenberg), manifiesto separado `libros-lote2.manifest.json` (mismo formato, todas `DRAFT`, `cover: null`). Tamaño del lote: **18.7 MB** (18744172 bytes). Ningún título repite los 200 del lote 1 ni los rechazados por derechos.

### Método

- **Mismo criterio legal**: autor, traductor, editor, prologuista y anotador fallecidos ≤1945 (Ley 23 de 1982, vida + 80 años). Se excluyó toda página o edición con un colaborador sin año de muerte verificado.
- **Wikisource** (`_tools/ws_api.py`, `ws_meta.py`, `ws_export.py`): se leyeron 54 páginas de autor y la cabecera (`{{encabezado}}`, autor, traductor, año, edición escaneada) de 126 páginas candidatas mediante la API de es.wikisource.org, de forma secuencial con 3 s de pausa y User-Agent descriptivo. Los EPUB se generaron con WS Export (`https://ws-export.wmcloud.org/?lang=es&format=epub-3&page=<título>&images=false`), **sin imágenes** (se evitan ilustraciones de terceros), uno cada 3 s.
- **Licencia Wikisource**: el texto es de dominio público; la edición digital (formato, índices, notas) se distribuye según la página de créditos del propio EPUB (`OPS/about.xhtml`), que en todos los archivos dice **CC BY-SA 3.0 / GNU FDL** y lista a los colaboradores. Se registró `licenseName` = «Texto en dominio público en Colombia; edición digital de Wikisource (CC BY-SA 3.0 / GNU FDL)» y `licenseUrl` = la página de Wikisource. La página de créditos se conserva intacta.
- **Revisión de paratextos**: en cada EPUB se revisaron portada, prólogos, introducciones, juicios críticos, cartas y notas (`_tools/ws_front.py`, `_tools/sweep_front.py`), y se midió el texto de cada exportación para detectar transcripciones incompletas (`_tools/ws_textsize.py`). Paratextos aceptados: juicio crítico de *María* por J. M. Vergara y Vergara (†1872); cartas a Estanislao del Campo de J. C. Gómez (†1884), R. Gutiérrez (†1896) y C. Guido y Spano (†1918); «Dos palabras al lector» de José M. Samper (†1888); introducción en verso de Teodoro Baró (†1916).
- **Traducciones**: solo se aceptaron Perrault en las traducciones de José Coll y Vehí (1862, †1876) y Teodoro Baró (1883, †1916), y la antigua edición anónima de Esopo (Amberes, 1607). Se descartaron los cuentos de Andersen y algunos de Grimm traducidos por la comunidad de Wikisource (traducción moderna con licencia CC BY-SA, no de dominio público) y los *Cuentos escogidos* de Grimm traducidos por José Sánchez Biedma (1879), cuyo año de muerte no se pudo verificar.
- **Gutenberg**: mismo procedimiento que en el lote 1 (catálogo, edición sin imágenes, descarga secuencial con 2 s de pausa, revisión de paratextos).
- **Verificación**: bytes mágicos, `unzip -t`, `mimetype` como primera entrada, licencia (PG o créditos de Wikisource), tamaño ≤ 8 MB, sha256. **Validación de esquema**: 120/120 entradas válidas con `ResourceInputSchema`.

### Distribución del lote 2

| Banda | Títulos |
|---|---|
| 1.º–5.º | 22 |
| 6.º–8.º | 22 |
| 9.º–11.º | 76 |

Categorías más frecuentes: Literatura latinoamericana (45), Poesía (35), Literatura colombiana (32), Literatura española (31), Cuento (31), Historia (18), Novela (17), Modernismo (12), Clásicos universales (11), Poesía infantil (10), Saber 11 (10), Literatura infantil (7), Siglo de Oro (6), Ensayo (6).

### Títulos del lote 2

| Fuente | Título | Autor | † autor | Traductor (†) | Grados | SHA-256 (prefijo) | Bytes |
|---|---|---|---|---|---|---|---|
| [PG 69578](https://www.gutenberg.org/ebooks/69578) | El equipaje del rey José | Benito Pérez Galdós | 1920 | — | 8–11 | `585df29736b2` | 308009 |
| [PG 70868](https://www.gutenberg.org/ebooks/70868) | Memorias de un cortesano de 1815 | Benito Pérez Galdós | 1920 | — | 9–11 | `52af33e9fbe5` | 286935 |
| [PG 71055](https://www.gutenberg.org/ebooks/71055) | La segunda casaca | Benito Pérez Galdós | 1920 | — | 9–11 | `063eeb820c77` | 322156 |
| [PG 71614](https://www.gutenberg.org/ebooks/71614) | Los cien mil hijos de San Luis | Benito Pérez Galdós | 1920 | — | 9–11 | `ea11cf06c428` | 303796 |
| [PG 71861](https://www.gutenberg.org/ebooks/71861) | El terror de 1824 | Benito Pérez Galdós | 1920 | — | 9–11 | `2588d21c2482` | 323515 |
| [PG 17338](https://www.gutenberg.org/ebooks/17338) | Doña Luz | Juan Valera | 1905 | — | 10–11 | `7297c01e9fce` | 205451 |
| [PG 60284](https://www.gutenberg.org/ebooks/60284) | Clemencia: Novela de costumbres | Fernán Caballero | 1877 | — | 9–11 | `a9bb08abc0eb` | 306575 |
| [PG 74981](https://www.gutenberg.org/ebooks/74981) | Pedro Sánchez | José María de Pereda | 1906 | — | 10–11 | `ff0ed8c22a6d` | 612064 |
| [PG 32364](https://www.gutenberg.org/ebooks/32364) | Marta y María: novela de costumbres | Armando Palacio Valdés | 1938 | — | 10–11 | `e8224eb2598a` | 309143 |
| [PG 53294](https://www.gutenberg.org/ebooks/53294) | Recuerdos Del Tiempo Viejo | José Zorrilla | 1893 | — | 10–11 | `557c4d84628f` | 276086 |
| [PG 55917](https://www.gutenberg.org/ebooks/55917) | Teatro selecto, tomo 2 de 4 | Pedro Calderón de la Barca | 1681 | — | 10–11 | `34d80aee478c` | 376985 |
| [PG 58643](https://www.gutenberg.org/ebooks/58643) | Teatro selecto, tomo 3 de 4 | Pedro Calderón de la Barca | 1681 | — | 10–11 | `459c25e8ca1f` | 273985 |
| [PG 63328](https://www.gutenberg.org/ebooks/63328) | Teatro selecto, tomo 4 de 4 | Pedro Calderón de la Barca | 1681 | — | 10–11 | `faf9680d83cc` | 381178 |
| [PG 66262](https://www.gutenberg.org/ebooks/66262) | Los Sueños, Volume II | Francisco de Quevedo | 1645 | — | 10–11 | `4c5da3697d31` | 313988 |
| [PG 63402](https://www.gutenberg.org/ebooks/63402) | El criticón (tomo 2 de 2) | Baltasar Gracián y Morales | 1658 | — | 10–11 | `057d35520359` | 377559 |
| [PG 67917](https://www.gutenberg.org/ebooks/67917) | La vuelta al mundo de un novelista; vol. 3/3 | Vicente Blasco Ibáñez | 1928 | — | 9–11 | `a246992c37e9` | 367036 |
| [PG 79315](https://www.gutenberg.org/ebooks/79315) | El Caballero de la Virgen | Vicente Blasco Ibáñez | 1928 | — | 9–11 | `aba653d42292` | 277263 |
| [PG 66866](https://www.gutenberg.org/ebooks/66866) | Historia de la guerra del Peloponeso (1 de 2) | Tucídides | -396 | Diego Gracián (1586) | 10–11 | `0d1a3e8bf503` | 465965 |
| [PG 66867](https://www.gutenberg.org/ebooks/66867) | Historia de la guerra del Peloponeso (2 de 2) | Tucídides | -396 | Diego Gracián (1586) | 10–11 | `c97b6623f26e` | 409669 |
| [PG 66949](https://www.gutenberg.org/ebooks/66949) | Las Helénicas; ó, Historia griega desde el año 411 hasta el 362 antes de Jesucri | Xenophon | -351 | Enrique Soms y Castelín (1913) | 10–11 | `3dee6b05f84f` | 365873 |
| [PG 59686](https://www.gutenberg.org/ebooks/59686) | Dramas de Guillermo Shakspeare [vol. 4] | William Shakespeare | 1616 | José Arnaldo Márquez (1904) | 10–11 | `688e0f12ee67` | 321011 |
| [PG 51020](https://www.gutenberg.org/ebooks/51020) | La Biblia en España, Tomo II (de 3) O viajes, aventuras y prisiones de un inglés | George Borrow | 1881 | Manuel Azaña (1940) | 10–11 | `fb6b49dce1bc` | 255436 |
| [PG 51689](https://www.gutenberg.org/ebooks/51689) | La Biblia en España, Tomo III (de 3) O viajes, aventuras y prisiones de un inglé | George Borrow | 1881 | Manuel Azaña (1940) | 10–11 | `9fe26576e753` | 291150 |
| [PG 57828](https://www.gutenberg.org/ebooks/57828) | Cosas de España; tomo 1 (El país de lo imprevisto) | Richard Ford | 1858 | Enrique de Mesa y Rosales (1929) | 10–11 | `16a9cfe893d4` | 231527 |
| [PG 19543](https://www.gutenberg.org/ebooks/19543) | Memorias de un vigilante | José S. Álvarez («Fray Mocho») | 1903 | — | 9–11 | `86651751612f` | 136854 |
| [PG 71131](https://www.gutenberg.org/ebooks/71131) | El Gíbaro | Manuel A. Alonso | 1889 | — | 9–11 | `d8adef06fd7d` | 234516 |
| [PG 45180](https://www.gutenberg.org/ebooks/45180) | Poetas de color | Francisco Calcagno | 1903 | — | 10–11 | `d9cbd0c2198f` | 104879 |
| [PG 54386](https://www.gutenberg.org/ebooks/54386) | Paris en América | Édouard Laboulaye | 1883 | Lucio V. Mansilla, Domingo Faustino Sarmiento (1913) | 10–11 | `68fa503d3f28` | 346428 |
| [PG 73255](https://www.gutenberg.org/ebooks/73255) | Historia de la lengua y literatura castellana, Tomo 1 | Julio Cejador y Frauca | 1927 | — | 10–11 | `16f8fdc250ee` | 809067 |
| [PG 43950](https://www.gutenberg.org/ebooks/43950) | Cincuenta y cuatro Canciones Españolas del siglo XVI: Cancionero de Uppsala | Anónimo | Antigüedad | — | 9–11 | `a50900916110` | 88780 |
| [PG 65034](https://www.gutenberg.org/ebooks/65034) | Velázquez en el museo del Prado | A. de Beruete y Moret | 1922 | — | 9–11 | `cc3d3f6a6e0e` | 87916 |
| [PG 20401](https://www.gutenberg.org/ebooks/20401) | Viage al Rio de La Plata y Paraguay | Ulrich Schmidel | 1581 | — | 10–11 | `8e30ae26da9d` | 150653 |
| [PG 67631](https://www.gutenberg.org/ebooks/67631) | Guerras civiles de Granada: Tomo I | Ginés Pérez de Hita | 1619 | — | 10–11 | `16ef493af2f2` | 361505 |
| [WS](https://es.wikisource.org/wiki/Simón_el_bobito) | Simón el bobito | Rafael Pombo | 1912 | — | 1–4 | `5d34a1d54989` | 7824 |
| [WS](https://es.wikisource.org/wiki/Mirringa_Mirronga) | Mirringa Mirronga | Rafael Pombo | 1912 | — | 1–4 | `fbd4a2cce11c` | 7861 |
| [WS](https://es.wikisource.org/wiki/El_gato_bandido) | El gato bandido | Rafael Pombo | 1912 | — | 1–4 | `e2e5362e8623` | 7620 |
| [WS](https://es.wikisource.org/wiki/Cutufato_y_su_gato) | Cutufato y su gato | Rafael Pombo | 1912 | — | 1–4 | `2880076937c9` | 7008 |
| [WS](https://es.wikisource.org/wiki/Pastorcita) | Pastorcita | Rafael Pombo | 1912 | — | 1–4 | `52918e816968` | 6989 |
| [WS](https://es.wikisource.org/wiki/El_niño_y_la_mariposa) | El niño y la mariposa | Rafael Pombo | 1912 | — | 1–4 | `c3a8e0f79c61` | 7160 |
| [WS](https://es.wikisource.org/wiki/El_coche) | El coche | Rafael Pombo | 1912 | — | 2–5 | `6607e4c13866` | 6834 |
| [WS](https://es.wikisource.org/wiki/Cuentos_de_la_selva) | Cuentos de la selva | Horacio Quiroga | 1937 | — | 2–6 | `c61d124ba070` | 66371 |
| [WS](https://es.wikisource.org/wiki/Juan_Darién) | Juan Darién | Horacio Quiroga | 1937 | — | 6–9 | `99a88310fb4a` | 16614 |
| [WS](https://es.wikisource.org/wiki/Anaconda) | Anaconda | Horacio Quiroga | 1937 | — | 7–11 | `615952e67e2b` | 51412 |
| [WS](https://es.wikisource.org/wiki/Los_desterrados) | Los desterrados | Horacio Quiroga | 1937 | — | 9–11 | `7f7744758671` | 96820 |
| [WS](https://es.wikisource.org/wiki/Decálogo_del_perfecto_cuentista) | Decálogo del perfecto cuentista | Horacio Quiroga | 1937 | — | 8–11 | `b3dbfaccc6fb` | 7595 |
| [WS](https://es.wikisource.org/wiki/Ismaelillo) | Ismaelillo | José Martí | 1895 | — | 3–7 | `f00cf5c95f05` | 28128 |
| [WS](https://es.wikisource.org/wiki/Versos_sencillos) | Versos sencillos | José Martí | 1895 | — | 5–11 | `71203954e620` | 78047 |
| [WS](https://es.wikisource.org/wiki/Nuestra_América) | Nuestra América | José Martí | 1895 | — | 9–11 | `336efb017871` | 15762 |
| [WS](https://es.wikisource.org/wiki/A_Margarita_Debayle) | A Margarita Debayle | Rubén Darío | 1916 | — | 2–6 | `51ef1e8f315a` | 7569 |
| [WS](https://es.wikisource.org/wiki/Los_motivos_del_lobo) | Los motivos del lobo | Rubén Darío | 1916 | — | 5–9 | `9803e8ca3c34` | 9385 |
| [WS](https://es.wikisource.org/wiki/Abrojos) | Abrojos | Rubén Darío | 1916 | — | 10–11 | `165290b20308` | 87444 |
| [WS](https://es.wikisource.org/wiki/Lira_póstuma) | Lira póstuma | Rubén Darío | 1916 | — | 9–11 | `750cfc8a986d` | 107017 |
| [WS](https://es.wikisource.org/wiki/Cuentos_y_crónicas) | Cuentos y crónicas | Rubén Darío | 1916 | — | 9–11 | `10a4142e2097` | 97794 |
| [WS](https://es.wikisource.org/wiki/Los_maderos_de_San_Juan) | Los maderos de San Juan | José Asunción Silva | 1896 | — | 4–8 | `02900a83850b` | 7232 |
| [WS](https://es.wikisource.org/wiki/Infancia_(Silva)) | Infancia | José Asunción Silva | 1896 | — | 6–9 | `8768ef42a5e8` | 7689 |
| [WS](https://es.wikisource.org/wiki/Crisálidas) | Crisálidas | José Asunción Silva | 1896 | — | 7–10 | `53aca966136c` | 6999 |
| [WS](https://es.wikisource.org/wiki/Nocturno_(Silva)) | Nocturno | José Asunción Silva | 1896 | — | 9–11 | `9c587359f95a` | 7306 |
| [WS](https://es.wikisource.org/wiki/Día_de_difuntos) | Día de difuntos | José Asunción Silva | 1896 | — | 9–11 | `e3f2789b82c2` | 8620 |
| [WS](https://es.wikisource.org/wiki/De_sobremesa) | De sobremesa | José Asunción Silva | 1896 | — | 10–11 | `5c99860b8b6b` | 167329 |
| [WS](https://es.wikisource.org/wiki/Cuentos_de_hadas_(Coll_i_Vehí_tr.)) | Cuentos de hadas (traducción de José Coll y Vehí) | Charles Perrault | 1703 | Josep Coll i Vehí (1876) | 2–6 | `34c4f26c8d09` | 132724 |
| [WS](https://es.wikisource.org/wiki/Cuentos_de_hadas_(Baró_tr.)) | Cuentos de hadas (traducción de Teodoro Baró) | Charles Perrault | 1703 | Teodoro Baró (1916) | 2–6 | `86682f4fe18d` | 104930 |
| [WS](https://es.wikisource.org/wiki/La_vida_y_fábulas_del_Esopo) | La vida y fábulas de Esopo | Esopo | Antigüedad | — | 7–11 | `93f76ff26099` | 558413 |
| [WS](https://es.wikisource.org/wiki/Cuentos,_adivinanzas_y_refranes_populares) | Cuentos, adivinanzas y refranes populares | Fernán Caballero | 1877 | — | 2–6 | `4f7a8e5906f3` | 202552 |
| [WS](https://es.wikisource.org/wiki/La_hormiguita) | La hormiguita | Fernán Caballero | 1877 | — | 1–4 | `f091c95befd3` | 7767 |
| [WS](https://es.wikisource.org/wiki/El_lobo_bobo_y_la_zorra_astuta) | El lobo bobo y la zorra astuta | Fernán Caballero | 1877 | — | 1–4 | `ca9a890e8285` | 9126 |
| [WS](https://es.wikisource.org/wiki/El_pájaro_de_la_verdad) | El pájaro de la verdad | Fernán Caballero | 1877 | — | 3–6 | `1d37751db784` | 15855 |
| [WS](https://es.wikisource.org/wiki/Cuentos_de_color_de_rosa) | Cuentos de color de rosa | Antonio de Trueba | 1889 | — | 6–9 | `2b5d682f03ef` | 251792 |
| [WS](https://es.wikisource.org/wiki/Cuentos_del_hogar_(Antonio_Trueba)) | Cuentos del hogar | Antonio de Trueba | 1889 | — | 6–9 | `ba4df2235d88` | 217492 |
| [WS](https://es.wikisource.org/wiki/Historia_de_una_mariposa_y_una_araña) | Historia de una mariposa y una araña | Gustavo Adolfo Bécquer | 1870 | — | 5–9 | `df6f7a239805` | 10905 |
| [WS](https://es.wikisource.org/wiki/Memorias_de_un_pavo) | Memorias de un pavo | Gustavo Adolfo Bécquer | 1870 | — | 6–9 | `a131d48c906e` | 12914 |
| [WS](https://es.wikisource.org/wiki/Canción_del_pirata) | Canción del pirata | José de Espronceda | 1842 | — | 5–9 | `94767620546c` | 8626 |
| [WS](https://es.wikisource.org/wiki/El_estudiante_de_Salamanca) | El estudiante de Salamanca | José de Espronceda | 1842 | — | 9–11 | `8d496809462a` | 43023 |
| [WS](https://es.wikisource.org/wiki/El_hornero) | El hornero | Leopoldo Lugones | 1938 | — | 2–6 | `e1425096a5ce` | 7179 |
| [WS](https://es.wikisource.org/wiki/La_guerra_gaucha) | La guerra gaucha | Leopoldo Lugones | 1938 | — | 10–11 | `f3234e657c6e` | 236555 |
| [WS](https://es.wikisource.org/wiki/Odas_seculares) | Odas seculares | Leopoldo Lugones | 1938 | — | 10–11 | `f47fef4cd20a` | 61363 |
| [WS](https://es.wikisource.org/wiki/Cuentos_fatales) | Cuentos fatales | Leopoldo Lugones | 1938 | — | 9–11 | `a48f66f9d6ab` | 86633 |
| [WS](https://es.wikisource.org/wiki/Perlas_negras) | Perlas negras | Amado Nervo | 1919 | — | 9–11 | `f61492c731cd` | 79289 |
| [WS](https://es.wikisource.org/wiki/Místicas) | Místicas | Amado Nervo | 1919 | — | 9–11 | `529aeecb574a` | 75396 |
| [WS](https://es.wikisource.org/wiki/Los_jardines_interiores) | Los jardines interiores | Amado Nervo | 1919 | — | 9–11 | `44a9348daef7` | 66836 |
| [WS](https://es.wikisource.org/wiki/La_duquesa_job) | La duquesa Job | Manuel Gutiérrez Nájera | 1895 | — | 9–11 | `72dfefada3a0` | 8456 |
| [WS](https://es.wikisource.org/wiki/Para_Entonces) | Para entonces | Manuel Gutiérrez Nájera | 1895 | — | 9–11 | `d544d3f55880` | 6749 |
| [WS](https://es.wikisource.org/wiki/Non_omnis_Moriar) | Non omnis moriar | Manuel Gutiérrez Nájera | 1895 | — | 9–11 | `903902801d63` | 7152 |
| [WS](https://es.wikisource.org/wiki/El_dulce_daño_(libro)) | El dulce daño | Alfonsina Storni | 1938 | — | 10–11 | `76399c6747c5` | 102373 |
| [WS](https://es.wikisource.org/wiki/Irremediablemente...) | Irremediablemente... | Alfonsina Storni | 1938 | — | 10–11 | `2a3197c2250c` | 177156 |
| [WS](https://es.wikisource.org/wiki/Ocre) | Ocre | Alfonsina Storni | 1938 | — | 10–11 | `ee77124f859f` | 203138 |
| [WS](https://es.wikisource.org/wiki/Mundo_de_siete_pozos) | Mundo de siete pozos | Alfonsina Storni | 1938 | — | 10–11 | `2056ed18d724` | 126747 |
| [WS](https://es.wikisource.org/wiki/Cardos_y_lirios) | Cardos y lirios | Julio Flórez | 1923 | — | 9–11 | `394f5b68d68e` | 49366 |
| [WS](https://es.wikisource.org/wiki/Cesta_de_lotos) | Cesta de lotos | Julio Flórez | 1923 | — | 9–11 | `ae416ff16554` | 64528 |
| [WS](https://es.wikisource.org/wiki/Manojo_de_zarsas) | Manojo de zarzas | Julio Flórez | 1923 | — | 9–11 | `3f6c43a5435f` | 63357 |
| [WS](https://es.wikisource.org/wiki/Gotas_de_ajenjo) | Gotas de ajenjo | Julio Flórez | 1923 | — | 10–11 | `96cf2ed77a2f` | 212541 |
| [WS](https://es.wikisource.org/wiki/Oro_y_ébano) | Oro y ébano | Julio Flórez | 1923 | — | 9–11 | `a0b6615ab422` | 88014 |
| [WS](https://es.wikisource.org/wiki/Los_camellos) | Los camellos | Guillermo Valencia | 1943 | — | 9–11 | `63b95c01a3b5` | 8642 |
| [WS](https://es.wikisource.org/wiki/Santos_Vega_(Obligado,_1920)) | Santos Vega | Rafael Obligado | 1920 | — | 7–11 | `666b0cf2aa3c` | 14009 |
| [WS](https://es.wikisource.org/wiki/Fausto_(Estanislao_del_Campo)) | Fausto: impresiones del gaucho Anastasio el Pollo | Estanislao del Campo | 1880 | — | 8–11 | `4611e6d0b0a7` | 55562 |
| [WS](https://es.wikisource.org/wiki/La_leyenda_patria) | La leyenda patria | Juan Zorrilla de San Martín | 1931 | — | 8–11 | `2c9d7e55054c` | 13309 |
| [WS](https://es.wikisource.org/wiki/María_(Isaacs)) | María | Jorge Isaacs | 1895 | — | 8–11 | `1d0e8183c754` | 343274 |
| [WS](https://es.wikisource.org/wiki/La_vorágine) | La vorágine | José Eustasio Rivera | 1928 | — | 10–11 | `2ba60af96bb1` | 231924 |
| [WS](https://es.wikisource.org/wiki/Dimitas_Arias) | Dimitas Arias | Tomás Carrasquilla | 1940 | — | 8–11 | `afecc99862c2` | 45167 |
| [WS](https://es.wikisource.org/wiki/En_la_diestra_de_Dios_Padre) | En la diestra de Dios Padre | Tomás Carrasquilla | 1940 | — | 7–11 | `7a989c71bc5e` | 26401 |
| [WS](https://es.wikisource.org/wiki/San_Antoñito) | San Antoñito | Tomás Carrasquilla | 1940 | — | 8–11 | `87a8efd68902` | 18115 |
| [WS](https://es.wikisource.org/wiki/El_rifle) | El rifle | Tomás Carrasquilla | 1940 | — | 6–9 | `df7ffaabeed3` | 16805 |
| [WS](https://es.wikisource.org/wiki/Simón_el_Mago) | Simón el Mago | Tomás Carrasquilla | 1940 | — | 6–10 | `c8851cba6e09` | 24141 |
| [WS](https://es.wikisource.org/wiki/Blanca_(Carrasquilla_Naranjo)) | Blanca | Tomás Carrasquilla | 1940 | — | 8–11 | `0bcf96dd579b` | 29227 |
| [WS](https://es.wikisource.org/wiki/A_la_plata) | A la plata | Tomás Carrasquilla | 1940 | — | 9–11 | `d0db7badfdd9` | 14581 |
| [WS](https://es.wikisource.org/wiki/Rogelio) | Rogelio | Tomás Carrasquilla | 1940 | — | 9–11 | `09fa4cdf30cf` | 24109 |
| [WS](https://es.wikisource.org/wiki/El_ánima_sola) | El ánima sola | Tomás Carrasquilla | 1940 | — | 9–11 | `44e1ca90be1f` | 21300 |
| [WS](https://es.wikisource.org/wiki/El_prefacio_de_Francisco_Vera) | El prefacio de Francisco Vera | Tomás Carrasquilla | 1940 | — | 9–11 | `e6bafa0b82da` | 14230 |
| [WS](https://es.wikisource.org/wiki/Novelas_y_cuadros_de_la_vida_sur-americana) | Novelas y cuadros de la vida sur-americana | Soledad Acosta de Samper | 1913 | — | 9–11 | `909f1bd9f81c` | 347868 |
| [WS](https://es.wikisource.org/wiki/El_Matadero) | El Matadero | Esteban Echeverría | 1851 | — | 10–11 | `7cd4e2c9f35d` | 21837 |
| [WS](https://es.wikisource.org/wiki/La_cautiva_(Echeverría)) | La cautiva | Esteban Echeverría | 1851 | — | 9–11 | `0af77b866603` | 53112 |
| [WS](https://es.wikisource.org/wiki/Amalia) | Amalia | José Mármol | 1871 | — | 10–11 | `acdcd88a3ea1` | 692671 |
| [WS](https://es.wikisource.org/wiki/Sub_terra_(1904)) | Sub terra | Baldomero Lillo | 1923 | — | 9–11 | `046ff7b69f32` | 107605 |
| [WS](https://es.wikisource.org/wiki/Sub_sole_(1907)) | Sub sole | Baldomero Lillo | 1923 | — | 9–11 | `f8674b0a1e45` | 123372 |
| [WS](https://es.wikisource.org/wiki/Capítulos_que_se_le_olvidaron_a_Cervantes) | Capítulos que se le olvidaron a Cervantes | Juan Montalvo | 1889 | — | 10–11 | `ae7543cd4409` | 471930 |
| [WS](https://es.wikisource.org/wiki/Tradiciones_peruanas_-_Segunda_serie) | Tradiciones peruanas - Segunda serie | Ricardo Palma | 1919 | — | 7–11 | `51cbc1829e02` | 342756 |
| [WS](https://es.wikisource.org/wiki/Tradiciones_peruanas_-_Tercera_serie) | Tradiciones peruanas - Tercera serie | Ricardo Palma | 1919 | — | 7–11 | `dd740be0136f` | 264257 |
| [WS](https://es.wikisource.org/wiki/Don_Segundo_Sombra) | Don Segundo Sombra | Ricardo Güiraldes | 1927 | — | 9–11 | `8b40aedd24de` | 212212 |
| [WS](https://es.wikisource.org/wiki/Motivos_de_Proteo) | Motivos de Proteo | José Enrique Rodó | 1917 | — | 10–11 | `1811ecc401bb` | 528900 |
| [WS](https://es.wikisource.org/wiki/Pájinas_libres) | Pájinas libres | Manuel González Prada | 1918 | — | 10–11 | `a5eec457b667` | 140948 |
| [WS](https://es.wikisource.org/wiki/La_educación_de_la_mujer) | La educación de la mujer | Concepción Arenal | 1893 | — | 10–11 | `055cfe9a9c15` | 27579 |

### Descartados en el lote 2 tras revisar el archivo

| Obra | Motivo |
|---|---|
| PG 16484 *Juanita la Larga*, Juan Valera | Prólogo de Paulino Garagorri (†2007) |
| WS *El desierto* (Quiroga) | Transcripción incompleta en Wikisource |
| WS *Los bandidos de Río Frío* I–II (Payno) | Transcripción incompleta |
| WS *Tabaré* (Zorrilla de San Martín) | Transcripción incompleta |
| WS *Languidez* (Storni) | Transcripción incompleta |
| WS *La amada inmóvil* (Nervo) | Presentación del editor de la edición póstuma (Alfonso Reyes, †1959) y transcripción incompleta |
| WS *Tierra de promisión* (Rivera) | Introducción moderna de la colección «Libro al viento» (Bogotá), protegida |
| WS *Tradiciones peruanas*, primera serie | «Juicios literarios» con un texto de autor no identificado |
| WS *La inquietud del rosal* (Storni) | La página indica un colaborador fallecido en 1948 |
| WS Andersen (*Cuentos clásicos para niños* y cuentos sueltos), Grimm (*Hansel y Gretel*, *El lobo y los siete cabritillos*) | Traducción de Wikisource (moderna, CC BY-SA) o traductor no indicado |
| WS Grimm, *Cuentos escogidos* (trad. José Sánchez Biedma, 1879) | Año de muerte del traductor no verificado |
| WS *Aves sin nido*, *Album del corazón*, *Fronda lírica*, *Las horas doradas* | Marcadas como incompletas o en desarrollo en Wikisource |
| WS *El renacuajo paseador*, *La pobre viejecita* (Pombo); *Fábulas* de Samaniego; *La Edad de Oro*, *Azul...*, *Prosas profanas*, *Cantos de vida y esperanza* | Ya están en `demo-content` o en el lote 1 |

No hay en Wikisource páginas de autor de Candelario Obeso, Epifanio Mejía (solo el *Himno de Antioquia*, cuya música es de 1962), Gregorio Gutiérrez González, José Manuel Marroquín ni Eugenio Díaz.

### Notas para la bibliotecaria (lote 2)

- Los poemas de Pombo en Wikisource no indican la edición impresa de origen: conviene cotejarlos con una edición de los *Cuentos pintados* / *Cuentos morales para niños formales*. Son textos muy breves (un poema por EPUB).
- *Don Segundo Sombra* (3.ª ed., 1927) lleva el aviso «Copyright by Editorial Proa 1927». Güiraldes murió en 1927, así que la obra está en dominio público en Colombia; entendemos que el aviso editorial de 1927 no mantiene derechos vigentes sobre el texto, pero conviene que lo confirme una persona. Se marcó en `reviewNotes`.
- Algunas ediciones escaneadas de origen tienen ilustraciones (p. ej., *Cuentos de la selva*, 1918); todos los EPUB de Wikisource se exportaron **sin imágenes** (se comprobó que no contienen archivos de imagen).
- Herramientas: `_tools/selection2_pg.py`, `_tools/selection2_ws.py`, `_tools/build_manifest2.py`, `_tools/build_fuentes2.py`; registros en `_tmp/ws/export.log` y `_tmp/download.log`.
