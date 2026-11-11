# Retos lectores: notas

Archivo: `retos/retos.json`, con 80 retos en el formato de `FORMATO.md` («Retos lectores»). Se generó el 2026-10-31.
Validador: `node catalogo-dp/_tools/retos-validate.mjs [ruta]`. Comprueba ids únicos (slug), tipos y sus campos exclusivos, `answer` dentro del rango, al menos 3 opciones sin repetir, entre 3 y 6 `pairs` sin repetir, bandas válidas, `text` de 150 palabras o menos (si se pasa, solo advierte) y que `resource.title` + `resource.creator` existan en `demo-content/manifest.json`, `libros.manifest.json` o en los manifiestos de audio, si están.
Resultado de la última ejecución: **OK, 0 errores y 0 advertencias** (se cargaron el manifiesto demo, con 8 entradas, y `libros.manifest.json`, con 200).

## Conteo (banda principal = primera banda de `bands`)

| Banda | trivia | sequence | match | Total |
|---|---|---|---|---|
| 1-3 | 10 | 5 | 5 | 20 |
| 4-5 | 10 | 5 | 5 | 20 |
| 6-8 | 10 | 5 | 5 | 20 |
| 9-11 | 10 | 5 | 5 | 20 |
| **Total** | **40** | **20** | **20** | **80** |

Muchos retos también sirven para la banda vecina, que se indica como segunda banda en `bands`. Las trivias de 1-3 y 4-5 tienen 3 opciones; las de 6-8 y 9-11 tienen 4, al estilo de la prueba Saber 11 (inferencia, intención del autor, figuras literarias y contexto). La respuesta correcta cambia de posición de una pregunta a otra.

Convención de ids: `b13-`, `b45-`, `b68-` y `b911-` según la banda principal, seguido del tema y del tipo.

## Recursos usados (29)

| Recurso (ver título exacto en retos.json) | Creador | N.º | Retos |
|---|---|---|---|
| El renacuajo paseador y La pobre viejecita | Rafael Pombo | 5 | `b13-renacuajo-trivia`, `b13-renacuajo-secuencia`, `b13-renacuajo-personajes`, `b13-viejecita-trivia`, `b13-viejecita-tenia` |
| Fábulas | Félix María Samaniego | 12 | `b13-cigarra-hormiga-trivia`, `b13-cuervo-zorro-trivia`, `b13-gallina-huevos-trivia`, `b13-leon-raton-trivia`, `b13-zorra-ciguena-secuencia`, `b13-fabulas-animales`, `b45-congreso-ratones-trivia`, `b45-raton-corte-campo-trivia`, `b45-dos-amigos-oso-trivia`, `b45-zorra-uvas-trivia`, `b45-lechera-secuencia`, `b45-samaniego-moralejas` |
| Los zapaticos de rosa (audio) | José Martí | 1 | `b13-zapaticos-trivia` |
| La Edad de Oro | José Martí | 17 | `b13-zapaticos-secuencia`, `b13-zapaticos-personajes`, `b45-cada-uno-oficio-trivia`, `b45-bebe-pomposo-trivia`, `b45-menique-secuencia`, `b45-bolivar-secuencia`, `b45-tres-heroes`, `b45-menique-objetos`, `b45-bebe-personajes`, `b68-iliada-marti-trivia`, `b68-iliada-secuencia`, `b68-iliada-personajes`, `b68-zapaticos-poesia-trivia`, `b68-tres-heroes-trivia`, `b68-edad-de-oro-secciones`, `b911-edad-de-oro-prologo-trivia`, `b911-hidalgo-secuencia` |
| Audioresumen: Las medias de los flamencos | Macondo Digital (resumen original de demostración) | 1 | `b13-flamencos-trivia` |
| Las medias de los flamencos (audiolibro) | Horacio Quiroga | 2 | `b13-flamencos-secuencia`, `b13-flamencos-personajes` |
| Ratón Pérez: cuento infantil | Luis Coloma | 2 | `b13-raton-perez-trivia`, `b13-raton-perez-secuencia` |
| Cuentos chilenos de nunca acabar | Ramón A. Laval | 1 | `b13-nunca-acabar-trivia` |
| Fábulas literarias | Tomás de Iriarte | 5 | `b45-burro-flautista-trivia`, `b45-oso-mona-cerdo-trivia`, `b45-dos-conejos-secuencia`, `b45-iriarte-fabulas`, `b68-ardilla-caballo-trivia` |
| Corazón | Edmondo De Amicis | 2 | `b45-escribiente-florentino-trivia`, `b45-escribiente-secuencia` |
| La isla del tesoro | Robert Louis Stevenson | 1 | `b45-isla-tesoro-trivia` |
| Azul... | Rubén Darío | 2 | `b68-rey-burgues-trivia`, `b68-rey-burgues-secuencia` |
| La Ilíada | Homero | 1 | `b68-iliada-proemio-trivia` |
| La Odisea | Homero | 2 | `b68-polifemo-trivia`, `b68-polifemo-secuencia` |
| Vida De Lazarillo De Tormes Y De Sus Fortunas Y Adversidades | Anónimo | 4 | `b68-lazarillo-toro-trivia`, `b68-lazarillo-amos-secuencia`, `b68-lazarillo-voces`, `b911-lazarillo-escudero-secuencia` |
| Trafalgar | Benito Pérez Galdós | 1 | `b68-trafalgar-trivia` |
| Marianela | Benito Pérez Galdós | 2 | `b68-marianela-trivia`, `b68-marianela-personajes` |
| Don Quijote | Miguel de Cervantes Saavedra | 3 | `b68-quijote-molinos-secuencia`, `b68-quijote-personajes`, `b911-quijote-cap1-secuencia` |
| Las cien mejores poesías (líricas) de la lengua castellana | Selección de Marcelino Menéndez y Pelayo | 2 | `b911-manrique-coplas-trivia`, `b911-coplas-alegoria` |
| Obras selectas de la celebre monja de Mejico, sor Juana Ines de la Cruz | Sor Juana Inés de la Cruz | 1 | `b911-sor-juana-trivia` |
| Fígaro (Artículos selectos) | Mariano José de Larra | 2 | `b911-larra-trivia`, `b911-larra-secuencia` |
| La Vuelta de Martín Fierro | José Hernández | 1 | `b911-martin-fierro-trivia` |
| El sí de las niñas | Leandro Fernández de Moratín | 2 | `b911-si-ninas-trivia`, `b911-si-ninas-personajes` |
| Ariel | José Enrique Rodó | 1 | `b911-ariel-trivia` |
| Cuentos de Amor de Locura y de Muerte | Horacio Quiroga | 2 | `b911-a-la-deriva-trivia`, `b911-a-la-deriva-secuencia` |
| Romancero gitano | Federico García Lorca | 1 | `b911-lorca-romance-trivia` |
| Poesías completas | Antonio Machado | 2 | `b911-machado-caminante-trivia`, `b911-machado-retrato` |
| Reglas y consejos sobre investigación científica (Los tónicos de la voluntad) | Santiago Ramón y Cajal | 1 | `b911-cajal-voluntad` |
| Obras escogidas | Gustavo Adolfo Bécquer | 1 | `b911-becquer-figuras` |

## Método

- Cada reto se escribió después de leer el pasaje en el archivo del catálogo: el texto se extrajo de los EPUB y del PDF de Pombo. Los fragmentos de `text` son citas literales de obras de dominio público y conservan la ortografía de cada edición (por ejemplo, «á», «acusais», «educacion»). Cuando el fragmento es un **resumen** y no una cita, se indica entre corchetes o con «(Resumen del cuento.)».
- El título y el creador de `resource` se copiaron por programa desde los manifiestos, así que coinciden exactamente con ellos.
- Las opciones incorrectas son plausibles, pero el texto las descarta. Las explicaciones enseñan algo en una sola frase.
- No hay rankings ni datos personales. El progreso y las insignias siguen el modelo actual de `challenges.ts`, que funciona solo en el dispositivo.

## Para revisión docente

1. **`b911-edad-de-oro-prologo-trivia`**: el fragmento de Martí (1889) incluye roles de género de su época («la niña nace para madre»). Se eligió **a propósito** para una lectura crítica en contexto, y las preguntas 3 y 4 lo tratan así. Conviene que el docente guíe la conversación.
2. **`b911-a-la-deriva-trivia` y `-secuencia`** (Quiroga): narran la agonía y la muerte del protagonista por la mordedura de una víbora. Es un texto canónico para 9-11, sin detalles gráficos en el fragmento citado.
3. **`b68-polifemo-secuencia`**: un paso menciona que los griegos ciegan al Cíclope con una estaca encendida. Se omitieron los detalles crudos del canto IX.
4. **`b68-lazarillo-*` y `b911-lazarillo-escudero-secuencia`**: hay violencia física (la «calabazada» contra el toro de piedra) y hambre. Es una sátira social propia de la obra.
5. **Clásicos infantiles con finales duros**: en `b13-renacuajo-*` los gatos se comen a los ratones y un pato se traga a Rinrín, tal como en el poema de Pombo. En `b13-gallina-huevos-trivia` el dueño mata a la gallina. Ambas cosas están en el texto original y se mencionan sin detalles.
6. **Bandas por debajo del `gradeMin` del manifiesto**: La Ilíada y La Odisea (7-11), y el Lazarillo, Trafalgar, Marianela y Don Quijote (8-11) se usan en retos de banda 6-8. Se recomienda aplicarlos en 7.º y 8.º, o bien quitar la banda 6-8 si el colegio prefiere respetar estrictamente el rango del catálogo.
7. **Las medias de los flamencos**: los tres retos se basan en el texto del audioresumen de Macondo, que fue cotejado con Wikisource según `demo-content/SOURCES.md`. Dos de ellos enlazan al audiolibro LibriVox. Conviene que un docente confirme, escuchando el audio, que la secuencia y los personajes coinciden.
8. **`b13-raton-perez-trivia` y `b45-escribiente-florentino-trivia`**: el `text` es un resumen propio y no una cita, para que sea breve. El cuento de Coloma tiene un trasfondo religioso (el padrenuestro) que el reto deja de lado a propósito, por neutralidad.
9. **Lenguaje actualizado**: en `b45-tres-heroes` y `b911-hidalgo-secuencia`, el original de Martí dice «los negros» e «indios». En los enunciados se escribió «personas esclavizadas» e «indígenas». Si se prefiere la cita literal, conviene añadir una nota de contexto.
10. **Preguntas que piden saberes literarios o históricos además del fragmento** (estilo Saber 11, la explicación enseña el concepto): `b911-manrique-coplas-trivia` p1 («recordar» = despertar) y p4 (copla de pie quebrado), `b911-si-ninas-trivia` p4 (Ilustración), `b911-sor-juana-trivia` p4 (contexto novohispano), `b911-lorca-romance-trivia` p4 (métrica del romance), `b68-zapaticos-poesia-trivia` p1 y p3 (redondilla y metonimia) y `b911-machado-caminante-trivia` p4 (quiasmo).
11. **Interpretaciones**: `b911-coplas-alegoria` (los «ríos medianos y más chicos» como vidas con menos poder) y `b68-rey-burgues-trivia` p3 (crítica al arte tratado como lujo) son lecturas estándar, pero interpretativas.
12. **Sor Juana**: las redondillas incluyen el término «liviana» o «liviandad», con connotación moral y sexual en su época. Las preguntas no lo abordan.
13. **El título del recurso** «Las cien mejores poesías (lí­ricas)…» contiene en el manifiesto un guion suave invisible (U+00AD), y se copió tal cual para que coincida. Si se corrige el manifiesto, hay que corregir también `retos.json`; el validador avisará.
14. **Machado**: en esta edición de las Poesías completas, «Caminante, son tus huellas…» aparece con el número XXVIII de «Proverbios y cantares», no con el XXIX de otras ediciones.

## Notas para integrar en la app

- `challenges.ts` todavía no define el tipo `match`. Para mostrar esos 20 retos hace falta agregar `{ kind: 'match'; pairs: {left,right}[] }`, una puntuación por pares acertados y, quizá, una insignia propia («Relacionador/a»).
- `steps` está en el orden correcto, y la app debe mezclarlo (ya existe `shuffled`). `pairs` también está en orden correcto: hay que mezclar la columna derecha al mostrarla.
- El campo `resource` permite enlazar «Leer el libro» o «Escuchar» con la ficha del catálogo, buscando por título y creador.

---

# Lote 2 (`retos/retos-lote2.json`)

Son 22 retos nuevos, con ids que empiezan por `l2-`. Siguen el mismo formato y el mismo método que el lote 1: leí cada pasaje en el EPUB del catálogo o, para los cuentos originales, en el campo `text` de `cuentos.manifest.json`. El título y el creador de `resource` se copiaron por programa desde `libros-lote2.manifest.json` y `cuentos.manifest.json`.

En los cuentos originales, las trivias usan preguntas **distintas** de las que ya trae el manifiesto (campo `questions`), para que no se repitan.

Ningún reto nuevo usa los libros retirados. En el lote 1, los únicos retos que dependían de un libro retirado (*Corazón*) son **`b45-escribiente-florentino-trivia`** y **`b45-escribiente-secuencia`**, que deben desactivarse. Con los 80 del lote 1, menos esos 2, más estos 22, la plataforma queda en **100 retos activos**.

## Conteo (banda principal)

| Banda | trivia | sequence | match | Total |
|---|---|---|---|---|
| 1-3 | 3 | 2 | 3 | 8 |
| 4-5 | 3 | 1 | 2 | 6 |
| 6-8 | 2 | 1 | 1 | 4 |
| 9-11 | 2 | 1 | 1 | 4 |
| **Total** | **10** | **5** | **7** | **22** |

## Recursos

| Banda | Retos | Recurso |
|---|---|---|
| 1-3 | `l2-b13-semilla-sara-secuencia` | La semilla de Sara (cuento original) |
| 1-3 | `l2-b13-gotita-secuencia` | El viaje de Gotita por La Mojana (cuento original) |
| 1-3 | `l2-b13-valentina-trivia` | Valentina habla con las manos (cuento original) |
| 1-3 | `l2-b13-agua-para-todos-trivia` | Agua para todos (cuento original) |
| 1-3 | `l2-b13-tortugas-personajes` | Las tortugas de Rincón del Mar (cuento original) |
| 1-3 | `l2-b13-canoa-abuela-palabras` | La canoa de la abuela Mercedes (cuento original) |
| 1-3 | `l2-b13-simon-bobito` | Simón el bobito, Rafael Pombo |
| 1-3 | `l2-b13-mirringa-trivia` | Mirringa Mirronga, Rafael Pombo |
| 4-5 | `l2-b45-tortuga-gigante-secuencia`, `l2-b45-abeja-haragana-trivia`, `l2-b45-abeja-haragana-personajes` | Cuentos de la selva, Horacio Quiroga |
| 4-5 | `l2-b45-margarita-debayle-trivia` | A Margarita Debayle, Rubén Darío |
| 4-5 | `l2-b45-hornero-trivia` | El hornero, Leopoldo Lugones |
| 4-5 | `l2-b45-cancion-pirata` | Canción del pirata, José de Espronceda |
| 6-8 | `l2-b68-versos-sencillos-trivia` | Versos sencillos, José Martí |
| 6-8 | `l2-b68-motivos-lobo-secuencia`, `l2-b68-motivos-lobo-trivia` | Los motivos del lobo, Rubén Darío |
| 6-8 | `l2-b68-maderos-san-juan` | Los maderos de San Juan, José Asunción Silva |
| 9-11 | `l2-b911-nocturno-trivia` | Nocturno, José Asunción Silva |
| 9-11 | `l2-b911-voragine-trivia` | La vorágine, José Eustasio Rivera |
| 9-11 | `l2-b911-maria-secuencia` | María, Jorge Isaacs |
| 9-11 | `l2-b911-carrasquilla-habla` | En la diestra de Dios Padre, Tomás Carrasquilla |

La banda 9-11 usa solo autores colombianos (Silva, Rivera, Isaacs y Carrasquilla), pensando en Saber 11.

## Validación

`node catalogo-dp/_tools/retos-validate.mjs catalogo-dp/retos/retos-lote2.json` da **OK, 0 errores y 0 advertencias**. El validador ahora también carga `libros-lote2`, `cuentos`, `audiolibros`, `audioresumenes` y `audiobiografias`, y da error si un id ya existe en otro `retos*.json` de esta carpeta. Probé esta comprobación con una copia que tenía ids repetidos y la detectó. `retos.json` sigue validando con 0 errores.

## Para revisión docente (lote 2)

1. **`l2-b911-nocturno-trivia`**: es un poema de duelo por la muerte de la amada, con imágenes de la alcoba mortuoria y el sepulcro.
2. **`l2-b68-motivos-lobo-*`**: el poema menciona que el lobo devoró ganado y pastores, y que la gente lo apaleó. Los retos tratan el contraste moral sin detenerse en la violencia. El poema también nombra vicios como envidia, ira, odio y lujuria; el reto solo cita envidia, ira y mentira.
3. **`l2-b911-voragine-trivia`**: la primera página alude a una relación amorosa («Alicia fue un amorío fácil»), pero ese pasaje quedó fuera del fragmento citado. La pregunta 4 requiere contexto histórico (la explotación cauchera).
4. **`l2-b911-carrasquilla-habla`**: el cuento es una narración popular de tema religioso; el reto trata solo de los rasgos del habla. Las etiquetas lingüísticas (voseo, apócope, pérdida de la d entre vocales) son descripciones estándar, pero conviene que el docente las presente.
5. **`l2-b45-tortuga-gigante-secuencia`**: en el cuento original el cazador mata un tigre. Ese episodio no aparece en los pasos.
6. **`l2-b68-maderos-san-juan`**: el poema anuncia la muerte de la abuela, con un tono melancólico.
7. **`l2-b68-versos-sencillos-trivia`**, pregunta 1: identificar la «tierra de la palma» con Cuba es un dato de contexto que no está en el fragmento.
8. **`l2-b45-cancion-pirata`**: el poema idealiza a un pirata, como era típico del Romanticismo. El reto trabaja solo los símbolos del estribillo. El pasaje sobre botines y presas quedó fuera.
