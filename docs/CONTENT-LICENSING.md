# Licenciamiento de contenidos

## Reglas
1. **Sin licencia verificada, no se publica.** Un recurso sin todos los campos de licencia queda en `DRAFT`.
2. **No se elimina DRM** ni se eluden controles de acceso, bajo ningún motivo.
3. **Comprar un ebook o audiolibro para Kindle/Audible no otorga derecho** a extraerlo, copiarlo, alojarlo ni redistribuirlo en 30 tablets, kiosco o TV. Se requiere una licencia institucional explícita.
4. La autorización debe cubrir expresamente: alojar en el servidor, copiar/descargar a dispositivos, número de dispositivos, uso offline, uso en kiosco/TV, duración y territorio.
5. **Licencia de software ≠ licencia de contenidos.** Una licencia vitalicia de la plataforma no hace perpetuos los contenidos.
6. **Dominio público en Colombia**: vida del autor + 80 años (Ley 23 de 1982, art. 21). Revisar también traductores, ilustradores, anotadores y, en audio, la grabación y los intérpretes (derechos conexos).
7. **Adaptaciones** (audioresúmenes, dramatizaciones): requieren derecho de transformación, salvo obras en dominio público.
8. Al vencer una licencia el recurso deja de ser `accessible` automáticamente (403 y fuera del manifest offline); retirar con `RETIRED`, no borrar, salvo obligación contractual de destrucción.

## Campos obligatorios por recurso (`LicenseSchema`)

| Campo | Significado |
|---|---|
| `rightsHolder` | Titular de derechos o "Dominio público (autor, año de fallecimiento)" |
| `licenseName` | Nombre o referencia del contrato (p. ej. "CC BY 4.0", "Contrato #123") |
| `licenseUrl` | Enlace al texto de la licencia o a la fuente (opcional) |
| `authorizedDevices` | Número de dispositivos autorizados (0 = no descargable) |
| `offlineAllowed` | Si se permite copia local en tablets |
| `validFrom` / `validUntil` | Vigencia (`null` = sin fecha declarada) |
| `territory` | Territorio (por defecto `CO`) |

Conservar el soporte documental (contrato, factura con cláusulas, captura de la licencia) fuera del repositorio, referenciado en `licenseName`.

## Recursos de demostración (`demo-content/`)

Detalle completo, URL, fecha y SHA-256: `demo-content/SOURCES.md`.

| Recurso | Tipo / formato | Autor (†) | Base legal | Offline / dispositivos | SHA-256 (prefijo) |
|---|---|---|---|---|---|
| El renacuajo paseador y La pobre viejecita | BOOK / PDF (generado) | Rafael Pombo (1912) | Dominio público CO; texto de Wikisource | Sí / 30 | `7120209474ad` |
| Fábulas | BOOK / EPUB | F. M. Samaniego (1801); notas M. de Toro Gómez (1922) | Dominio público CO; ed. Project Gutenberg #55206 | Sí / 30 | `3f1d91729e13` |
| La Edad de Oro | BOOK / EPUB | José Martí (1895) | Dominio público CO; ed. Project Gutenberg #19898 | Sí / 30 | `1c9f48905335` |
| Azul... | BOOK / EPUB | Rubén Darío (1916); prólogo J. Valera (1905) | Dominio público CO; PG #52894 sin ilustraciones de E. Ochoa (†1978) | Sí / 30 | `553c72dcb23d` |
| Las medias de los flamencos | AUDIOBOOK / MP3 | Horacio Quiroga (1937) | Texto dominio público CO; grabación LibriVox, Public Domain Mark 1.0 | Sí / 30 | `d1e1b4c8ae04` |
| Los zapaticos de rosa | AUDIOBOOK / MP3 | José Martí (1895) | Texto dominio público CO; grabación LibriVox dedicada al dominio público | Sí / 30 | `633a659c147a` |
| Audiobiografía: Rafael Pombo | AUDIOBIOGRAPHY / MP3 | Texto propio del proyecto | Contenido propio; voz sintética macOS solo para demo | Sí / 30 | `f099f4343918` |
| Audioresumen: Las medias de los flamencos | AUDIOSUMMARY / MP3 | Resumen propio de obra en dominio público | Contenido propio; voz sintética macOS solo para demo | Sí / 30 | `5ea1ec1644dc` |

Portadas: 8 diseños propios (`demo-content/covers/*.png`), sin imágenes de terceros. Las portadas escaneadas de las ediciones Gutenberg de *Fábulas* y *Azul...* se retiraron por no poder verificar los derechos de sus ilustradores.

**Portadas del catálogo (2026-11-11, ADR-019):** 254 recursos llevan una portada original de dominio público: escaneo de la edición de época incluido en el EPUB de Gutenberg (140), arte del proyecto LibriVox (100) o página del escaneo de Commons del que se transcribió el texto de Wikisource (14). Cada manifiesto registra la procedencia en `coverCredit`; `catalogo-dp/portadas-originales/exclusiones.json` lista las 39 descartadas y el motivo (diseñador con derechos vigentes, cubierta moderna del transcriptor, página sin portada). El resto conserva las portadas tipográficas propias.

## Voz sintética de la biblioteca (ADR-017)

- Las narraciones regrabadas desde el panel («Regrabar con la voz de la biblioteca») usan **Piper `es_ES-davefx-medium`**: motor Piper 1.8.0 (GPL-3, ejecutado como proceso aparte) y voz entrenada con datos **CC0** (`MODEL_CARD`: dataset OHF-Voice, afinada a partir de la voz inglesa *lessac*). El crédito se escribe automáticamente en `narrator`: **«Voz sintética Piper es_ES-davefx-medium (datos CC0)»** (`TTS_VOICE_CREDIT`).
- `licenseName` solo se reescribe cuando ya mencionaba una voz sintética (p. ej. «…; voz sintética Piper es_ES-carlfm-x_low (modelo MIT, dataset de dominio público)» → «…; voz sintética Piper es_ES-davefx-medium (datos CC0)»). El **titular de derechos y la licencia del texto no cambian**: narrar con voz sintética no otorga derechos sobre el guion; el texto debe ser propio, de dominio público o con derecho de transformación (regla 7).
- La voz sintética sigue siendo provisional para producción: la narración humana con cesión de derechos de voz continúa en «Pendientes».

## Cuentos del Taller de cuentos (ADR-018)

- **Titularidad**: los cuentos generados en el taller son **contenido de la biblioteca** (`rightsHolder` «Comfasucre – Biblioteca Macondo (Taller de cuentos)», `licenseName` «Contenido creado en el Taller de cuentos de la biblioteca»). El texto lo produce un modelo de lenguaje (DeepSeek) o nuestras plantillas a partir de opciones cerradas; no hay autoría de terceros que licenciar. El estudiante aporta elecciones y un nombre de protagonista; su nombre de autor (opcional) se muestra como crédito («<nombre> (Taller de cuentos)») solo si la bibliotecaria aprueba.
- **Sin datos personales en los archivos**: el EPUB y el MP3 contienen el cuento y, si existe, el nombre de autor elegido por el niño (puede ser inventado); nunca grado, dispositivo ni fechas de uso. Retirar un recurso = `RETIRED`, como el resto del catálogo.
- **Voz**: narración sintética Piper `es_ES-davefx-medium` (datos CC0), crédito en `narrator` (ADR-017).
- **Términos del proveedor**: DeepSeek recibe solo las opciones y el nombre del protagonista; conviene revisar periódicamente sus términos de uso de datos (documentado como pendiente de la biblioteca).

## Pendientes
- Los **570 recursos** de producción (metas del 2026-10-31; antes 229) no están adquiridos: cada uno requerirá su fila con soporte de licencia antes de publicarse.
- Narraciones definitivas con cesión de derechos de voz (sustituir la voz sintética; mientras tanto, la voz de la biblioteca es Piper `es_ES-davefx-medium`, datos CC0).
- Galería interactiva de demostración con imágenes de dominio público o CC0/CC BY verificadas.
