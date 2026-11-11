# Fire HD 10 — SIMULACIÓN (no es validación física)

> **Esto es una SIMULACIÓN en Chromium de escritorio.** No sustituye la prueba en una Fire HD 10 real.
> Todas las pruebas del §7 siguen **pendientes de validación física** hasta ejecutar el protocolo del final
> de este documento en una tablet real y registrar la evidencia en `docs/TESTING.md`.

Fecha: 2026-11-01 · Stack: Docker local (`http://localhost:3100`), datos reales (570 recursos publicados, 100 retos activos).
Script versionado: `apps/web/e2e-real/fire-hd10.sim.mjs` (`npm run sim:firehd10 -w @macondo/web`).
Resultados crudos: `docs/evidencia/fire-hd10-sim/resultados.json` · Capturas: `docs/evidencia/fire-hd10-sim/*.jpg`.

## Método y perfil

| Parámetro | Valor simulado |
|---|---|
| Motor | Chromium 156 de Playwright 1.64 (no es Silk ni el WebView de Fire OS) |
| Pantalla | 1280×800 CSS, `deviceScaleFactor` 1,5 (= 1920×1200 físicos), `isMobile`, `hasTouch` |
| User agent | `Mozilla/5.0 (Linux; Android 11; KFTRWI) AppleWebKit/537.36 (KHTML, like Gecko) Silk/120.4.1 like Chrome/120.0.0.0 Safari/537.36` |
| CPU | ×4 más lenta (`Emulation.setCPUThrottlingRate`, CDP) |
| Red «Wi-Fi» | 20 Mb/s bajada, 10 Mb/s subida, 20 ms (`Network.emulateNetworkConditions`) |
| Red «3G lento» | 400 kb/s, 2 000 ms de latencia (similar al preset de DevTools) |
| Sin red | `context.setOffline(true)` / `launchPersistentContext({ offline: true })` |
| «Reinicio» | `launchPersistentContext` con un perfil en disco: cerrar el navegador y relanzarlo con el mismo perfil, ya sin red |
| Audio | `--disable-audio-output` (sin tarjeta de sonido el reloj de `<audio>` no avanza) |

Recursos usados: EPUB «A Margarita Debayle» (7 KB), PDF «El renacuajo paseador y La pobre viejecita» (11 KB), MP3 «A los niños que lean La Edad de Oro» (2,4 MB, 318 s), galería «Alicia en el país de las maravillas» (7 imágenes, 3,8 MB).

## Resultados de las 7 pruebas del §7

| # | Prueba | Resultado simulado | Evidencia | Estado oficial |
|---|---|---|---|---|
| 1 | Abrir sin Google Play (web/PWA) | **PASA en `localhost`**: manifest válido (`standalone`, iconos 192/256/512 + maskable), service worker activo, `Page.getInstallabilityErrors` = 0. **FALLA desde la IP de la red local** (`http://192.168.31.240:3100`): `isSecureContext=false`, sin `serviceWorker`, sin `caches`, sin `crypto.subtle`; la ficha muestra «Este navegador no permite guardar recursos para uso sin conexión». | `1-inicio.jpg`, `1-lan-sin-contexto-seguro.jpg` | pendiente de validación física |
| 2 | Abrir EPUB y PDF | **PASA**: EPUB con texto en 1 123 ms, PDF página 1 en 1 044 ms (CPU ×4, Wi-Fi, con SW); el PDF pasa a «página 2 de 8» | `2-epub.jpg`, `2-pdf.jpg` | pendiente de validación física |
| 3 | MP3 con audífonos | **PASA parcial**: reproduce, salta a 159 s (Range 206), pausa en 160 s y al recargar reanuda en 157 s (retroceso intencional de 3 s). **Audífonos: no simulables.** | `3-mp3-reanudado.jpg` | pendiente de validación física |
| 4 | Descargar y abrir sin Wi-Fi | **PASA** (tras la corrección de esta iteración): «Descargar para uso sin conexión» en libro (4,4 s), audiolibro (4,4 s) y galería (4,9 s, 7 imágenes verificadas con SHA-256); sin red abren el EPUB, el MP3 (reproduce) y la galería; `/offline` lista los 3 y «Abrir» lleva a la galería. Antes de la corrección la galería **fallaba** sin red (ver «Hallazgos»). | `4-*.jpg` | pendiente de validación física |
| 5 | Reiniciar y confirmar persistencia | **PASA** (simulado: cierre y relanzamiento del navegador con el mismo perfil, sin red): `/offline` sigue listando 3 recursos, se conservan 4/4 claves de progreso (`macondo.reading.*`, `macondo.audio.*`, `macondo.offline.index`), el EPUB y la galería abren y el audio retoma en 148 s. **No simula** un reinicio de Fire OS ni su limpieza automática de almacenamiento. | `5-reinicio-*.jpg` | pendiente de validación física |
| 6 | Almacenamiento y batería | **PARCIAL**: `navigator.storage.estimate()` = 11,04 MB usados (Cache Storage) de una cuota de 10 251 MB (cuota del Mac, no de la tablet); archivos descargados 2,44 MB + galería; 13 entradas en `macondo-offline-v1`. `navigator.storage.persist()` = **false** (Chromium no lo concede sin instalación/interacción). **Batería: no simulable.** | `resultados.json` | pendiente de validación física |
| 7 | Uso compartido y restricciones de salida | **PARCIAL**: el kiosco (`?inactividad=5&aviso=3`) muestra «¿Sigues ahí?» a los 5,4 s y luego vuelve al inicio con búsqueda vacía, `localStorage` de la app y `sessionStorage` limpios. **Restringir la salida de la app no es simulable**: lo hace Fire OS (perfiles infantiles / fijación de pantalla) o un MDM (p. ej. Amazon Fire for Business / MDM compatible). | `7-kiosco-aviso.jpg` | pendiente de validación física |

## Tiempos de carga (contexto limpio, sin caché ni SW, CPU ×4)

| Página (criterio «listo») | Wi-Fi: DCL / listo | 3G lento: DCL / listo | Transferido |
|---|---|---|---|
| `/` (título visible) | 122 ms / 411 ms | 4 807 ms / 10 651 ms | 262 KB |
| `/catalogo` (lista + portadas visibles cargadas) | 76 ms / 1 052 ms | 4 758 ms / >120 s (agotó el tiempo)¹ | 1 901 KB |
| `/leer` EPUB (texto en el iframe) | 76 ms / 974 ms | 4 848 ms / 23 724 ms | 426 KB |
| `/leer` PDF (canvas de la página 1) | 76 ms / 1 449 ms | 4 853 ms / 30 386 ms | 846 KB |
| `/leer` MP3 (metadatos del audio) | 79 ms / 418 ms | 4 865 ms / 22 644 ms | 306 KB |

¹ Medición aparte en 3G lento: el texto del catálogo («570 recursos · página 1 de 24») aparece a los **13,7 s**, pero las portadas visibles tardan **≈ 290 s**: cada portada pesa ~250 KB (PNG; mediana 258 KB, máximo 1,5 MB) y las 24 de una página suman ~1,5–1,9 MB. En el Wi-Fi de la biblioteca no es un problema (≈1 s), y desde esta iteración las visitas repetidas responden **304** sin volver a descargar (ETag + `If-None-Match`). Pendiente: miniaturas JPG/WebP de ~30 KB (ver «Limitaciones»).

Las cifras de 3G variaron entre ejecuciones (p. ej. `/` 10,7 s y 69 s en dos corridas) porque la máquina anfitriona estaba cargada; se reportan las de la corrida final.

## Hallazgos de la simulación

1. **Corregido — la galería descargada no abría sin red** si su visor (`/galeria/:id`) no se había visitado antes en línea, y `/offline` enlazaba todo a `/leer/:id` (también las galerías). Causa: el SW solo guarda páginas visitadas; los módulos JS de lectores y visor se cargan bajo demanda. Corrección: tras una descarga verificada, `warmOfflinePage()` (`apps/web/src/lib/offline.ts`) carga la página del lector en un iframe oculto para que el SW guarde HTML + módulos; `offlinePagePath()` envía las galerías a `/galeria/:id`; `/offline` usa `<a>` (navegación completa, servida por el SW). Prueba unitaria en `src/lib/offlineGallery.test.ts`.
2. **Bloqueante para tablets reales — HTTP en la IP local no es contexto seguro.** Desde `http://192.168.31.240:3100` el navegador no expone Service Worker, Cache Storage ni `crypto.subtle`: la descarga offline queda deshabilitada (la app lo dice con un mensaje claro). Para las tablets hace falta **HTTPS en el servidor local** (p. ej. un proxy con certificado de una CA local instalada en las tablets, o un nombre de dominio con certificado válido) **o** el contenedor nativo (ADR-005). Decisión pendiente; no se cambió infraestructura.
3. `navigator.storage.persist()` devolvió `false`: sin almacenamiento persistente el navegador puede borrar las descargas si falta espacio. Debe comprobarse en Silk (prueba 6 del protocolo).

## Limitaciones de la simulación

- Chromium de escritorio ≠ Silk / WebView de Fire OS (versiones, políticas de almacenamiento, instalación de PWA, códecs).
- El «reinicio» es cerrar y abrir el navegador con el mismo perfil; no reproduce el apagado de la tablet, la limpieza de caché de Fire OS ni el modo de ahorro de energía.
- CPU ×4 sobre un Mac no equivale exactamente a la CPU MediaTek de la Fire HD 10; la GPU, la memoria (3–4 GB) y el almacenamiento eMMC no se simulan.
- Audífonos, altavoz, batería, temperatura, táctil real y bloqueo de salida no son simulables.
- La cuota de almacenamiento medida es la del equipo anfitrión.
- Las portadas no se redimensionan en el servidor (no hay canal de imágenes); queda como mejora.

## Nueva vía (2026-11-01): HTTPS local + app Android

El hallazgo 2 (sin contexto seguro desde `http://IP:3100`) se aborda con dos piezas (ADR-014, `docs/APP-ANDROID.md`):

1. **HTTPS en la LAN**: `sh scripts/make-local-certs.sh` crea una CA local y un certificado para la IP del servidor; `docker compose --profile https up -d macondo-https` publica `https://192.168.31.240:3443` (Caddy → web). Verificado: `curl --cacert infra/certs/ca.crt https://192.168.31.240:3443/api/health` → ok; con Playwright/Chromium en esa URL `isSecureContext=true`, `serviceWorker`, `caches` y `crypto.subtle` presentes y el SW `macondo-shell-v3` activado (el control `http://IP:3100` sigue dando `isSecureContext=false`).
2. **APK** `apps/android/` (`co.com.comfasucre.macondo`, Fire OS 7+): WebView que confía en esa CA (`network_security_config.xml`), abre `https://IP:3443` y por tanto tiene contexto seguro **sin instalar certificados en la tablet**. Modos Tablet/Kiosco/TV, kiosco con pantalla fija si es *device owner*, PIN para salir. Instalación: página `/instalar` (QR + pasos).

Qué cambia en la matriz: la prueba 1 pasa a «instalar el APK por sideload»; las pruebas 4 y 5 deben repetirse **dentro de la app**; la 7 añade `adb shell dpm set-device-owner co.com.comfasucre.macondo/.MacondoDeviceAdminReceiver`. Lo que sigue sin poder simularse: persistencia del WebView tras reinicio de Fire OS, `storage.persist()`, batería, audífonos y el bloqueo de salida real. **Todo pendiente de validación física**; el APK está compilado y verificado estáticamente pero no se ha ejecutado en ninguna tablet.

Protocolo adicional para el bibliotecario (añadir al del final): (a) instalar el APK siguiendo `/instalar`; (b) en Configuración escribir `https://192.168.31.240:3443` y modo Tablet; (c) repetir los pasos 4 y 5 dentro de la app; (d) en una tablet sin cuentas, aplicar el comando `dpm` y activar el modo kiosco; intentar salir con Inicio/Atrás/Recientes; salir con el PIN.

## Pendiente de validación física (protocolo para el bibliotecario)

Antes de empezar: anotar modelo y generación (Ajustes → Opciones del dispositivo → Acerca de), versión de Fire OS, versión de Silk, fecha y responsable. Tomar foto o captura de cada paso. Cargar la tablet al 100 %.

1. **Abrir sin Google Play.** Conectar la tablet al Wi-Fi de la biblioteca. Abrir Silk y escribir la dirección del servidor (la HTTPS que se defina; con `http://IP:3100` la descarga offline no funcionará, ver hallazgo 2). Menú de Silk → «Añadir a la pantalla de inicio». Cerrar Silk y abrir Macondo Digital desde el icono. ✔ si abre la pantalla «¿En qué grado estás?» a pantalla completa.
2. **EPUB y PDF.** Catálogo → «A Margarita Debayle» → Leer: pasar 3 páginas con las flechas, subir la letra con «+A». Luego «El renacuajo paseador y La pobre viejecita» → Leer: pasar a la página 2 y ampliar. Cronometrar con el reloj del teléfono cuánto tarda cada uno en mostrar texto. ✔ si ambos se leen sin errores en menos de 5 s.
3. **MP3 con audífonos.** Conectar audífonos. Abrir «A los niños que lean La Edad de Oro» → Escuchar. Comprobar que el sonido sale SOLO por los audífonos; pausar, adelantar 15 s, cambiar velocidad a 1,25×. Salir, volver a entrar: debe retomar donde quedó (unos 3 s antes). Desconectar los audífonos con el audio sonando: anotar si se pausa o sigue por el altavoz.
4. **Descargar y abrir sin Wi-Fi.** En las fichas de un libro, un audiolibro y una galería pulsar «Descargar para uso sin conexión» y esperar «Disponible sin conexión». Activar **modo avión**. Abrir el menú «Sin conexión» → «Abrir» en cada uno: el libro se lee, el audio suena, la galería muestra sus imágenes. ✔ si los 3 abren.
5. **Reinicio.** Con el modo avión aún activo, apagar la tablet por completo (mantener el botón de encendido → Apagar) y encenderla. Abrir Macondo Digital desde el icono → «Sin conexión»: deben seguir los 3 recursos, el libro debe abrir en la página donde se dejó y el audio retomar su posición.
6. **Almacenamiento y batería.** Ajustes → Almacenamiento: anotar el espacio usado por Silk antes y después de las descargas. Con brillo al 50 % y Wi-Fi activo, escuchar 1 h de audio y leer 30 min; anotar el % de batería al inicio y al final (=% por hora). Repetir el paso 5 al día siguiente para ver si Fire OS borró las descargas.
7. **Uso compartido y salida.** Abrir `/kiosco` (o la app), no tocar durante 90 s: debe aparecer «¿Sigues ahí?» y volver al inicio sin rastros de la búsqueda anterior. Configurar el bloqueo de salida del sistema (perfil infantil de Amazon Kids con la app como única permitida, o fijación de pantalla / MDM) e intentar salir con los botones Inicio y Atrás: ✔ si no sale sin el PIN del bibliotecario.

Registrar cada resultado en la matriz «Matriz física Fire HD 10» de `docs/TESTING.md` sustituyendo «pendiente de validación física» por «✅/❌ + fecha + responsable + evidencia».
