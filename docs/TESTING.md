# Pruebas

## Estrategia
- **Unitarias** (Vitest): reglas puras del contrato (`packages/shared`), servicios de la API con dependencias simuladas, componentes de la web (Testing Library + jsdom).
- **Integración** (Vitest + supertest contra Postgres real en 5544, base de datos de pruebas aislada): rutas REST, autorización, subida de archivos, streaming con `Range`.
- **E2E** (Playwright, Chromium y perfil móvil): flujos de estudiante, kiosco, TV y administración contra API + web locales con datos de `demo-content/`.
- **Físicas** (Fire HD 10): manuales, con evidencia (fotos/vídeo, versión de Fire OS, capturas de almacenamiento y batería).
- Regla: nada se marca como pasado sin ejecutarse; registrar comando, fecha y salida.

## Matriz: criterios del §9 de la especificación

| Criterio §9 | Unitaria | Integración | E2E | Estado |
|---|---|---|---|---|
| Alta de recurso y búsqueda en catálogo | `ResourceInputSchema`, `CatalogQuerySchema` | `POST /admin/resources` → `GET /resources?q=` | Admin crea → aparece en `/catalogo` | API ✅ 36/36 · flujo real vía proxy ✅ |
| Apertura de EPUB/PDF de demostración con licencia válida | `isResourceAccessible` | `GET /resources/:id/file` 200/206; 403 con licencia vencida | Abrir *Fábulas* (EPUB) y Pombo (PDF) | API ✅ · Chromium con API real ✅ · E2E licencia vencida ✅ (simulada) |
| Reproducción MP3 y reanudación | lógica de posición guardada | `Range` → 206 | Reproducir, recargar, reanudar en la misma posición | Range 206 ✅ · reproducción real ✅ · reanudación: solo unitaria |
| Filtros por grado y tipo | `gradeBand`, query schema | `?grade=2&type=AUDIOBOOK` | Filtros en `/catalogo` | API ✅ · proxy ✅ |
| Autorización administrativa | guardas de rol | 401 sin token, 403 LIBRARIAN en `/admin/audit` | Login/logout `/admin` | API ✅ (401/403) · proxy 401 ✅ |
| Programación y reproducción de Macondo TV | filtro por vigencia | `GET /tv/schedule` respeta fechas/orden/activo | `/tv` rota diapositivas | API ✅ · unitaria rotación/respaldo ✅ · E2E respaldo ✅ |
| Reinicio de sesión en kiosco | temporizador de inactividad | — | Reloj simulado → vuelve a inicio y limpia estado | unitaria ✅ · E2E ✅ |
| Descarga, persistencia y sincronización offline | `canDownloadOffline`, verificación SHA-256, fusión de progreso | `GET /offline/manifest` solo descargables | Descargar, cortar red, abrir; reconectar y sincronizar | manifest API ✅ · SHA-256 unitaria ✅ · navegador: pendiente · Fire HD 10: pendiente de validación física |
| Archivos dañados, red caída, almacenamiento insuficiente | validación de bytes mágicos; hash no coincide | Subida con extensión falsa → 400 | Red cortada → mensaje claro; cuota llena → aviso | bytes mágicos ✅ (415) · red caída E2E ✅ · cuota llena: pendiente |
| Reglas de licencia del contrato | **8 pruebas en `packages/shared/src/index.test.ts`** | — | — | **8/8 pasan (2026-10-31)** |

## Evidencia

| Fecha | Comando | Resultado |
|---|---|---|
| 2026-10-31 | `cd packages/shared && npx vitest run` | `Test Files 1 passed (1) · Tests 8 passed (8)` |
| 2026-10-31 | Validación de `demo-content/manifest.json` con `ResourceInputSchema` (node + `@macondo/shared`) | 8/8 registros válidos |
| 2026-10-31 | Verificación de archivos demo (bytes mágicos, `unzip -t`, PDFKit, ffprobe) | 3 EPUB (`mimetype` primero y sin comprimir), PDF de 8 páginas legible, 4 MP3 con cabecera ID3 |
| _por completar_ | `npm test`, `npm run e2e -w @macondo/web` | _a completar por el agente líder_ |

## Matriz física Fire HD 10 (obligatoria antes de desplegar en 30 unidades)

Registrar: modelo/generación, versión de Fire OS, navegador o APK y versión, fecha, responsable, evidencia.

| # | Prueba | Procedimiento | Criterio de aceptación | Simulación 2026-11-01 (Chromium, ver `docs/FIRE-HD10-SIMULACION.md`) | Estado |
|---|---|---|---|---|---|
| 1 | Instalar/abrir sin Google Play | PWA desde Silk o APK por *sideload* | Abre `/` desde el icono de inicio | SIMULACIÓN: PASA en `localhost` (manifest, SW activo, 0 errores de instalabilidad); **FALLA desde `http://IP:3100`** (no es contexto seguro: sin SW ni caché → requiere HTTPS local o APK) | pendiente de validación física |
| 2 | Abrir EPUB y PDF | *Fábulas* (EPUB) y Pombo (PDF) | Pasan páginas, tipografía ajustable en EPUB | SIMULACIÓN: PASA: EPUB 1,1 s · PDF 1,0 s (CPU ×4, Wi-Fi) | pendiente de validación física |
| 3 | MP3 con audífonos | *Las medias de los flamencos* | Audio por audífonos, pausa/avance/velocidad, reanuda | SIMULACIÓN: PASA parcial: reproduce, salta (206), reanuda (160 s → 157 s); audífonos no simulables | pendiente de validación física |
| 4 | Descargar y abrir sin Wi-Fi | Descargar paquete, activar modo avión | Los 3 formatos abren; hash verificado | SIMULACIÓN: PASA tras corregir la galería offline (libro, audio y galería abren sin red) | pendiente de validación física |
| 5 | Reiniciar y confirmar persistencia | Apagar/encender en modo avión | Contenido y progreso siguen disponibles | SIMULACIÓN: PASA (cierre/relanzamiento del navegador con el mismo perfil, sin red); no simula el apagado de Fire OS | pendiente de validación física |
| 6 | Consumo de almacenamiento y batería | Configuración → Almacenamiento; 1 h de audio + 30 min de lectura | Registrar MB usados y % batería/hora | SIMULACIÓN: PARCIAL: 11 MB en Cache Storage; `storage.persist()` = false; batería no simulable | pendiente de validación física |
| 7 | Uso compartido y restricciones de salida | Perfiles infantiles/Amazon Kids o fijación de pantalla / MDM | El estudiante no sale de la app sin PIN | SIMULACIÓN: PARCIAL: reinicio del kiosco limpia estado; restricción de salida no simulable (Fire OS / MDM) | pendiente de validación física |

## Identidad Comfasucre — lado público (2026-10-31)

- `npm run typecheck -w @macondo/web`: OK. `npm test -w @macondo/web`: 9 archivos y 49 pruebas OK. `npm run build -w @macondo/web`: OK.
- E2E (`next start` en 3100, chromium + tablet) de `home-catalog`, `kiosk` y `tv`: **18/18 OK**. No hubo que cambiar selectores.
- Stack real (API 4100 + web 3100), Playwright: 26 capturas (12 rutas a 1280×800 y 390×844; `/kiosco` y `/tv` también a 1920×1080). Sin desbordamiento horizontal, sin errores de consola ni HTTP ≥400. `document.fonts` confirma que Outfit carga en el portal y que Inter carga en `/tv`. El kiosco usa system-ui.
- Contraste: `node apps/web/scripts/brand-contrast.mjs` da 57 parejas y 0 fallos (detalle en `docs/BRANDING-PUBLICO.md`).
- Fire HD 10: pendiente de validación física.

## QA de diseño y pruebas completas contra el stack real (2026-11-01)

Stack Docker reconstruido con los cambios; datos: 300 libros, 100 audiolibros, 50 audiobiografías, 20 audioresúmenes, 100 galerías (570 publicados, 60 retirados) y 100 retos activos.

| Verificación | Comando | Resultado |
|---|---|---|
| Typecheck | `npm run typecheck` | OK (shared, api, web) |
| Lint | `npm run lint` | OK (web = `tsc`) |
| Unitarias/integración | `npm test` | shared 14/14 · api 49/49 · web 70/70 (una corrida previa de api dio 48/49 por *timeout* de `throttle.test.ts` con la máquina cargada; al repetir, 49/49) |
| Builds | `npm run build -w @macondo/api` · `-w @macondo/web` | OK |
| E2E simulada (API interceptada) | `cd apps/web && E2E_PORT=3101 npx playwright test` | 28/28 en una corrida; en las siguientes 26–27/28: fallan de forma intermitente pruebas de tiempo de kiosco/TV cuya duración real llegó a 3–4 min (anfitrión suspendido/cargado). Aisladas, kiosco+TV 12/12. |
| **E2E stack real (nueva)** | `npm run e2e:real -w @macondo/web` (`E2E_BASE_URL`, por defecto `http://localhost:3100`) | **13/13**: health, conteos (300/100/50/20/100 = 570) y paginación, filtros tipo/grado, EPUB, PDF, MP3 con Range 206 y salto, galería (7/7 imágenes + zoom), retos trivia/secuencia/relacionar, kiosco (inactividad → reinicio), TV (6 bloques en 120 s con reloj simulado; QR en libro, autor y reto), admin (login, KPIs = conteos públicos, búsqueda en las 630 filas) |
| Simulación Fire HD 10 | `npm run sim:firehd10 -w @macondo/web` | ver `docs/FIRE-HD10-SIMULACION.md` (SIMULACIÓN, no validación física) |
| Contraste en navegador | script de QA sobre todas las rutas y pestañas admin | 0 parejas < AA tras ajustar `macondo-admin.css` |

## Pase funcional final: miniaturas, pestaña Retos, acciones en lote y barrido (2026-11-01)

Stack Docker reconstruido con `docker compose up -d --build` (API con `sharp` 0.35.5, binarios `@img/sharp-linux-arm64` del lockfile; sin script de instalación). Datos intactos: 300/100/50/20/100 publicados y 100 retos activos (102 importados).

| Verificación | Comando | Resultado |
|---|---|---|
| Typecheck / lint | `npm run typecheck` · `npm run lint` | OK (shared, api, web; incluye `e2e/` y `e2e-real/`) |
| Unitarias/integración | `npm test` | shared 14/14 · **api 53/53** (nuevas: miniatura real con `sharp` 240×360 WebP < ¼ del PNG, w=480, caché `thumbs/`, ETag distinto + 304, 400 en `100/241/4800/abc/240.0/-240`, vista previa admin con `?w`, limpieza de miniaturas al reemplazar portada, portada no decodificable → original; `parseThumbWidth`/`thumbKeyFor`) · **web 76/76** (nuevas: `Cover.test.tsx` 3; `filterChallenges`, `parseChallengeImport`, `runSequential`) |
| Builds | `npm run build -w @macondo/api` · `-w @macondo/web` | OK |
| E2E simulada (API interceptada) | `cd apps/web && E2E_PORT=3101 npx playwright test` | 28/28 previas + nueva `admin.spec` «pestaña Retos y acciones en lote» en chromium y tablet: **30/30** (la primera corrida de la nueva prueba falló 2/2 por *strict mode* al coexistir tabla y tarjetas móviles; corregido con selectores `:visible` y `aria-label` en las casillas móviles; re-ejecutado 6/6) |
| **E2E stack real** | `npm run e2e:real -w @macondo/web` | **16/16** en 19,8 s (13 previas, incluida la inactividad del kiosco sin repetición, + 3 nuevas): pestaña Retos (102 retos, 100 activos, filtros por tipo/banda/estado = API, alternar un reto inactivo y restaurarlo, validación local del JSON sin tocar la BD); acciones en lote (2 borradores «Prueba QA lote» publicados y retirados uno a uno, conteo público restaurado); miniaturas (`?w=240` WebP, 304, 400, catálogo solo pide `?w=240`, ficha `?w=480`) |
| Medición de portadas | script `fetch` sobre la página 1 del catálogo (24 portadas) | **8 939 728 B → 162 976 B** con `w=240` (−98,2 %); `w=480` 448 514 B (−95,0 %); segunda petición de una miniatura 4 ms |
| Contraste | `node apps/web/scripts/brand-contrast.mjs` | 57 parejas, 0 fallos |
| Barrido funcional (script Playwright ad hoc, 390/1280/1920) | 29 rutas × 3 anchos + bandas, galería (visor + trivia), kiosco (búsqueda, categoría, detalle con QR, inactividad), offline (libro + galería, red cortada, abrir), admin (5 pestañas, alta + PDF + publicar + retirar «Prueba QA sweep», diapositiva TV crear/editar/eliminar, auditoría), 404, API (health, Range 206, CORS, miniatura) | **Pasa**: 29 rutas × 3 anchos con 200 y `scrollWidth = innerWidth` (0 px de desbordamiento) y 0 errores de consola propios; 404 propia en español a los 3 anchos; 4 bandas fijan `data-band` y cambian el saludo; galería: visor abre/cierra con Escape y trivia «Acertaste 4 de 4»; kiosco: búsqueda, categoría «Audiolibro», detalle con QR, Escape; offline: libro EPUB + galería (12/12) descargados, sin red el libro abre desde `/offline` → «Abrir» (texto renderizado) y la portada `?w=240` se sirve desde la caché (200); admin: 5 pestañas sin desbordamiento, alta → subir PDF («Subir archivo», SHA-256 y 10 889 B registrados) → publicar (archivo público 206) → retirar; diapositiva TV creada, editada y eliminada con `/api/tv/schedule` 6→6; auditoría muestra RESOURCE_CREATE/TV/RETIRE; API: health, Range 206, CORS (`allow-origin` reflejado, *preflight* 204), 404 JSON, miniatura 5 312 B. Falsos positivos del script corregidos sobre la marcha (ninguno del producto): `isVisible` sin espera en la inactividad del kiosco (cubierta por la E2E real 11/16), red cortada antes del estado «Listo» (el botón espera `warmOfflinePage`), subida sin pulsar «Subir archivo», y un clic de «Retirar» que coincidió con la recarga del listado (retirado por API en la limpieza; la primera corrida sí retiró desde la interfaz). Hallazgo de **contenido**: el recurso publicado `cmvx802p10025oc01deejrfby` («Audiobiografía: Rafael Pombo», la versión nueva) tiene `coverPath` `covers/81f610c3-….png` que **no existe en `storage/`** → `/cover` 404 (la tarjeta muestra el respaldo por tipo). Las otras 569 portadas responden 200. Requiere volver a subir la portada desde el panel (no se tocó contenido publicado). Ruido descartado: *prefetch* `?_rsc=` abortados al cerrar la página y `ERR_ABORTED` del `<audio>` al pedir metadatos. |

Datos: el único cambio de estado sobre un recurso real fue **volver a retirar** `cmvx3vpru0008l72xr6fwp91h` (audiobiografía antigua con voz sintética), que apareció PUBLICADO a las 11:52 UTC por una llamada ajena a esta sesión; conteos verificados antes y después.

Correcciones de esta iteración (con regresión): listado admin limitado a 100 de 630 recursos (búsqueda y conteos incompletos) → `fetchAllPages` (unitaria + e2e real); 404 por defecto de Next en inglés → 404 propio en español (e2e); filtros del catálogo que se pisaban al cambiar dos seguidos (e2e); portadas sin 304 → ETag + `If-None-Match` (API e2e + unitaria); galería descargada que no abría sin red y enlace `/offline` a `/leer` → `warmOfflinePage`/`offlinePagePath` (unitaria + simulación); contraste AA de textos secundarios del panel; contador del visor que se partía en teléfono; alineación de la columna izquierda en «Relaciona».

### Evidencia adicional — app Android y HTTPS local (2026-11-01)

| Elemento | Unitaria | Verificación estática / integración | Pendiente | Fecha |
|---|---|---|---|---|
| App Android (APK) para Fire HD 10 | `apps/android` JUnit 6/6, lint 0 errores | `apksigner verify` OK (v2), `aapt` paquete/permisos OK; HTTPS local con CA propia: curl OK, contexto seguro + SW activo en Chromium | **No ejecutado en dispositivo** (sin emulador): instalación, confianza de la CA en WebView de Fire OS, offline y `dpm` → pendiente de validación física | 2026-11-01 |

### Evidencia — cambio de contraseña y auditoría (2026-11-01)

- API: prueba de integración `cambio de contraseña` (sin token 401, actual incorrecta 401, nueva débil 400, cambio 200, login con la nueva, auditoría `USER_PASSWORD_CHANGE` sin contraseñas, reversión). Suites tras el cambio: shared 15/15 · api 54/54 · web 76/76.
- Web: `normalizeAudit` acepta `actor` como objeto («Nombre (correo)») y «Sistema» para entradas automáticas (corrige «[object Object]» en Auditoría).
- En vivo (Docker reconstruido): cambio y reversión reales con la cuenta de bibliotecaria; diálogo con errores inline; suite real 16/16; conteos 300/100/50/20/100.

## Hardware real: kiosco 32" (escala/orientación) y TV en mini PC Windows (2026-11-01, ADR-015)

Stack Docker: solo `macondo-web` reconstruido (`docker compose up -d --build macondo-web`); API y datos sin cambios. Conteos públicos antes y después: 300/100/50/20/100 y 100 retos activos.

| Verificación | Comando | Resultado |
|---|---|---|
| Typecheck / lint | `npm run typecheck` · `npm run lint` | OK (shared, api, web; incluye `e2e/` y `e2e-real/`) |
| Unitarias web | `npm test -w @macondo/web` | **81/81** (nuevas en `kioskTimer.test.ts`: `parseKioskScale`, URL ← guardado (`resolveKioskConfig`), `kioskLayout` vertical/horizontal con y sin escala, `kioskScaleStyle` zoom/transform; `tvRotation.test.ts`: `animationsDisabled`) |
| Build web | `npm run build -w @macondo/web` | OK |
| E2E simulada (API interceptada) | `cd apps/web && E2E_PORT=3101 npx playwright test` | **36/36** (30 previas + 3 nuevas × 2 proyectos: kiosco vertical 1080×1920 con `?escala=1.5` (zoom en raíz, persistencia, 2 columnas, categorías ≥72 px, detalle con QR ≥400 px dentro de la ventana, pulsación larga 3 s → panel → guardar ×1.25/120 s), kiosco horizontal 1920×1080 (5 categorías en fila, escala 1), TV `?animaciones=0` (sin animación/transición, cursor oculto)) |
| **E2E stack real** | `npm run e2e:real -w @macondo/web` | **17/17** en 19,9 s (16 previas + nueva: kiosco vertical 1080×1920 `?escala=1.5` contra datos reales: zoom 1.5, 2 columnas, sin desbordamiento, portada `?w=480` cargada en el detalle, QR ≥400 px, config guardada). La prueba de TV ahora abre con `&animaciones=0` y comprueba `data-animaciones="0"`. |
| Barrido kiosco 32"/TV (script Playwright ad hoc, build local 3101 con API real y luego stack real 3100) | `scratchpad/kiosk32-shots.mjs` | **78/78** en ambos: kiosco a 1080×1920 (DPR 1; DPR 2 + escala 1.5; escala 1.25), 1200×1920 (1.25), 1920×1080 (1 y 1.5): `data-escala`/`zoom` correctos, `scrollWidth = innerWidth` (0 px), 0 textos recortados, todos los botones ≥56 px y categorías ≥72 px, detalle dentro de la ventana y QR 320–480 px de dispositivo, aviso de inactividad centrado (≥640 px de ancho, botón 72 px), panel de configuración sin desbordamiento y persistencia de la escala; TV a 1280×720, 1920×1080 y 3840×2160 sin scroll, fuente `live`, cursor `none`; `?animaciones=0` → `animation: none`, `transition 0s`; `prefers-reduced-motion` → 1e-6 s. Capturas: `scratchpad/kiosk32-*.png` y `scratchpad/live/kiosk32-live-*.png` (revisadas a ojo). |
| Hallazgo corregido en TV | capturas 4K/1080p | la portada del «Libro de la semana» quedaba al tamaño intrínseco del `srcset` (~280 px) y, con el primer arreglo, con franjas; ahora caja 3:4 con unidades de contenedor (`cqw/cqh`) que llena el panel: 420×560 a 1080p, 842×1122 a 4K |
| Scripts Windows (`infra/tv-windows/*.ps1`) | `docker run mcr.microsoft.com/powershell pwsh` → `Parser::ParseFile` + `[scriptblock]::Create` | **0 errores de sintaxis** en `Instalar-Macondo-TV.ps1` (1377 tokens) y `Desinstalar-Macondo-TV.ps1` (494 tokens) con PowerShell 7.4.2. **No ejecutados en Windows** (sin equipo): tarea programada, `powercfg`, registro HKCU e instalación de la CA quedan pendientes de la primera instalación del técnico. |
| Página `/instalar` en vivo | Playwright sobre `http://localhost:3100/instalar` | título «…Fire HD 10 y en el kiosco», dominio `macondo.comfasucre.co` como dirección principal y `192.168.31.240:3443` como respaldo, versión del APK leída: 1.1.0 (código 2) |

Pendiente de validación física (hardware no disponible): tótem (orientación, Android/WebView, táctil, *device owner*), mini PC con el televisor real (1080p/4K, arranque automático, 30 min sin apagado), tablets. Ver `docs/HARDWARE.md`.

## Narración sintética en el servidor (2026-11-05, ADR-017)

| Verificación | Comando | Resultado |
|---|---|---|
| Typecheck / lint | `npm run typecheck` · `npm run lint` | OK (shared, api, web) |
| Unitarias shared | `npm test -w @macondo/shared` | **17/17** (nuevas: rutas `adminResourceNarrate`/`adminTtsStatus`, `TTS_VOICE_CREDIT`, `NarrateInputSchema` límites y claves desconocidas) |
| Unitarias + e2e API | `npm test -w @macondo/api` | **71/71 + 1 omitida** (antes 53). `test/tts.test.ts`: normalización y troceo (frases, corte duro, >40 000 → error), duración WAV por cabecera, `updateLicenseVoiceCredit` (carlfm → davefx, macOS → davefx, «CC BY 4.0» intacta), `TtsService` con *runner* simulado: estados (desactivado / sin binario / sin voz / sin codificador / ok), 503 sin motor, argumentos de piper y lame/ffmpeg, limpieza del temporal, fallo y tiempo agotado → 500, cola de 2 simultáneas. `test/tts.e2e.test.ts` con binarios simulados (`piper` y `lame` en scripts): 401 sin sesión, estado para LIBRARIAN, 400 sin texto / galería / recurso con EPUB / texto > 40 000 / clave desconocida, narración de `extra.text` que reemplaza y borra el MP3 anterior, `narrator` = crédito, `licenseName` carlfm → davefx con titular intacto, auditoría `RESOURCE_NARRATE`, Range 206 público, «CC BY 4.0» intacta con `text` en el cuerpo, y app sin motor → `ok:false` + 503 «Narración no disponible». |
| Integración real (omitida por defecto) | `TTS_PIPER_BIN=catalogo-dp/_tmp/tts/venv/bin/piper TTS_VOICE=catalogo-dp/_tmp/tts-muestras/piper-voices/es_ES-davefx-medium.onnx npx vitest run test/tts.test.ts -t integración` (en `apps/api`) | **1/1**: 78 caracteres → 4,1 s de audio en 1,4 s; MP3 con cabecera válida; duración `ffprobe` coincide (±0,6 s) |
| Unitarias web | `npm test -w @macondo/web` | **85/85** (nuevas en `narration.test.ts`: `canNarrate`, `narrationText`, `ttsStatusLabel`, `formatDuration`) |
| Builds locales | `npm run build -w @macondo/api` · `npm run build -w @macondo/web` | OK |
| Imagen API | `docker build -f apps/api/Dockerfile -t macondo-api:tts .` | OK. Voz descargada en el build y **SHA-256 verificado** (`.onnx` `6658b03b…`, `.onnx.json` `0e0dda87…`, `MODEL_CARD` `420703b5…`, iguales a las copias de `catalogo-dp/_tmp/tts-muestras/piper-voices/`); paso de humo (piper + lame como `node`) superado. Capas: 810 → 1 068 MB (**+258 MB**: Python mínimo + lame 39 MB, venv 156 MB, voz 63 MB); `docker images` 1,04 → 1,44 GB; `inspect.Size` 224 → 359 MB |
| Imagen todo en uno | `docker build -t macondo-digital:todo-en-uno .` | OK. Capas 1 539 → 1 797 MB (**+258 MB**); `docker images` 1,98 → 2,38 GB; `inspect.Size` 419 → 554 MB |
| Arranque en vivo (3201, BD de desarrollo, `SEED_ON_START=false`) | `docker run -p 127.0.0.1:3201:3100 … macondo-digital:todo-en-uno` | health `{"status":"ok","db":"ok"}` a los 3 s; migraciones → API → web |
| Estado del motor | `GET /api/admin/tts/estado` (admin) | `{"enabled":true,"engine":"piper","voice":"es_ES-davefx-medium","ok":true,"detail":null}` |
| Narración real | `POST /api/admin/resources/:id/narrar` sobre un audioresumen temporal con `extra.text` (296 caracteres, 2 párrafos) | **200 en 2,85 s**; MP3 147 675 B, `durationSeconds` 18, `narrator` = «Voz sintética Piper es_ES-davefx-medium (datos CC0)», `licenseName` «…voz sintética Piper es_ES-carlfm-x_low (…)» → «…voz sintética Piper es_ES-davefx-medium (datos CC0)», titular intacto; auditoría `RESOURCE_NARRATE` |
| Reproducción por Range | `GET /api/resources/:id/file` con `Range: bytes=0-99` tras publicar | **206**, `content-range: bytes 0-99/147675`, `audio/mpeg`; descarga completa 200 con el mismo SHA-256 que informó la API; `ffprobe`: mp3, 44 100 Hz, mono, 64 kb/s, **18,35 s**; vista previa admin con Range 206 |
| Cierre | `DELETE /api/admin/resources/:id` | `RETIRED` (el público responde 404); contenedor y volumen de prueba eliminados. El registro de prueba `cmw3m45250000r02or1r1y7bh` queda retirado en la BD de desarrollo (su MP3 vivía en el volumen eliminado). |

No se tocó la pila `docker compose` en ejecución (otro agente cargaba archivos): el líder debe reconstruirla para que la narración esté disponible en `:3100`. Nadie ha validado todavía la calidad de voz de esta integración en tablets: **pendiente de validación física**.


## Taller de cuentos «Construye tu cuento» (2026-11-05, ADR-018)

| Verificación | Comando | Resultado |
|---|---|---|
| Typecheck / lint | `npm run typecheck` · `npm run lint` | OK (shared, api, web) |
| Unitarias shared | `npm test -w @macondo/shared` | **23/23** (nuevas: ids 4×4×4 y textos, rutas `cuentos*`, `CuentoNombreSchema`, `CuentoOpcionesSchema` strict (rechaza `ip`), `CuentoGeneradoSchema` (3×3, glosario 2–4), `CuentoRevisarSchema`, `cuentoGrades`, `extra.cuentoId`, portada SVG escapada) |
| Unitarias + e2e API | `npm test -w @macondo/api` | **99/99 + 1 omitida** (antes 71). `test/cuentos.test.ts` (17): plantilla **128 combinaciones** (4×4×4×2 bandas) válidas y que pasan los controles, determinismo y longitud; lista de bloqueo (palabra completa, sin tildes), nombres, heurística de español, `validarCuento` (corto, protagonista ausente, expresión vetada, opciones repetidas, inglés), `extraerJson`; prompts sin nombre de autor; EPUB (mimetype primero y STORE, archivos, determinista, sin portada); `DeepSeekProvider` con fetch simulado (JSON mode, clave solo en `Authorization`, red/401/tiempo agotado → `LlmUnavailableError`); `generarTexto`: IA válida, inválida → reintento estricto (temperatura 0,5, tokens sumados) → válida, dos inválidas → plantilla, proveedor caído → plantilla. `test/cuentos.e2e.test.ts` (11) con `LLM_PROVIDER` falso y TTS simulado: `disponible` (ia/plantilla), creación 202 + sondeo, prompt **sin** nombre de autor, audio con Range 206, `deviceHash` SHA-256 nunca expuesto, latencia/tokens guardados, reintento → plantilla, proveedor caído → plantilla, 400 (grosería, caracteres, banda 6-8, clave extra, tipo inválido), **429** al cuarto cuento del mismo dispositivo (otro sigue), 404, 401 admin, LIBRARIAN lista/detalle, aprobar → libro EPUB + audiolibro PUBLISHED en el catálogo (licencia, categorías, grados 1–3, `extra.cuentoId`, EPUB con mimetype), auditoría `CUENTO_REVIEW`, 409 doble revisión, retirar recursos; rechazar sin recursos + 400 decisión inválida + `stats.cuentos`; sin motor de voz → sin audio y solo libro. |
| Unitarias web | `npm test -w @macondo/web` | **96/96** (antes 85). `cuentos.test.ts`: máquina de estados del asistente (validaciones por paso, lugar avanza solo, atrás, enviado/listo/fallo/reiniciar conserva autor), `opcionesParaEnviar`, textos 4×4×4, `cuentoListo`/`seguirConsultando`, `bandaHabilitada`, `deviceId` (persistente, repara valores corruptos), «Mis cuentos» (orden, actualización, tope 12, basura en localStorage). `gradeBand.test.ts` actualizado a 7 módulos. |
| E2E simulada | `E2E_PORT=3105 npx playwright test` (en `apps/web`, contra `next start` local) | **42/42** (antes 36). `cuentos.spec.ts` ×2 proyectos: asistente completo (validación inline, 3 pasos, generando, sondeo GENERATING→GENERATED→PENDING_REVIEW, resultado con portada, audio, trivia 3/3, guardar en tablet, «Hacer otro» conserva autor, `/offline` → Mis cuentos), modo plantilla + 429 con mensaje del servidor, bandas 9-11 sin módulo y «próximamente», 1-3 con módulo «Inventar un cuento». |
| Builds | `npm run build -w @macondo/api` · `npm run build -w @macondo/web` · `docker compose up -d --build macondo-api macondo-web` | OK; ruta `/construye-tu-cuento` 8,6 kB; migración `20261105143547_generated_story` aplicada al arrancar; `fonts-dejavu-core` en la imagen API para la portada |
| Generación REAL (DeepSeek) | `POST /api/cuentos` en `:3100` (banda 1-3, protagonista «Tití», animal/Mojana/cuidado, autor «Prueba QA», deviceId de prueba) | **202 → GENERATED a los 9 s → PENDING_REVIEW con audio a los 12 s**. `modo: ia`, proveedor `deepseek-flash` (alias de `deepseek-chat`), **latencia 710 ms, tokens 917 entrada / 855 salida, 1 intento**; título «Tití y la ciénaga feliz», 213 palabras, 6 párrafos, 3 preguntas, 3 palabras de glosario; narración 1 221 caracteres → **81,1 s de MP3 en 4,5 s**. Registro del servidor sin prompt ni clave. |
| Modo plantilla forzado | `DEEPSEEK_API_KEY= docker compose up -d macondo-api` → `POST` (banda 4-5, «Robi», robot/espacio/curiosidad, sin autor) → restaurar | `disponible.modo = plantilla`; cuento listo en 3 s (322 palabras), audio 118 s; registro «sin DEEPSEEK_API_KEY → modo plantilla». Tras restaurar: `modo: ia`. |
| Revisión y catálogo | `POST /api/admin/cuentos/:id/revisar {APROBAR}` (admin) | `APPROVED`, 2 recursos: BOOK EPUB (100 032 B, portada PNG 800×1200 con texto legible, `extra.cuentoId`, grados 1–3, titular «Comfasucre – Biblioteca Macondo (Taller de cuentos)», creator «Prueba QA (Taller de cuentos)») y AUDIOBOOK MP3 (649 803 B, 81 s). Catálogo público: BOOK 301, AUDIOBOOK 101; búsqueda «Tití» los devuelve; EPUB descargado: `zipfile.testzip()` OK, `mimetype` primero y sin comprimir, 11 entradas, `cover-image`; miniatura `?w=480` WebP 12 250 B; audio Range 206. Cuento plantilla → `RECHAZAR` (sin recursos). |
| Limpieza | `DELETE /api/admin/resources/:id` ×2 → `RETIRED` (público 404); filas `GeneratedStory` de prueba y sus 2 MP3 eliminados (`psql`/`rm` en los contenedores) | Conteos públicos finales **300/100/50/20/100**; `GeneratedStory` = 0; auditoría conserva `CUENTO_REVIEW` ×2, `RESOURCE_CREATE` ×2, `RESOURCE_RETIRE` ×2 |
| E2E real | `E2E_BASE_URL=http://localhost:3100 npm run e2e:real -w @macondo/web` | **19/19** (antes 17): nuevas `disponible` (bandas, modo), 404, 401 admin, lista pendientes; página 1-3 con asistente (sin enviar) y «próximamente» en 9-11, sin errores JS ni 5xx |

Sin validar: tablets Fire HD 10 (pendiente de validación física); calidad pedagógica de los cuentos de IA (muestra de 1); comportamiento con la red de la biblioteca (DNS) en el servidor real.
