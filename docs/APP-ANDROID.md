# App Android (APK) para Fire HD 10

Fecha: 2026-11-01 · Versión actual: **1.1.0 (versionCode 2)** · Código: `apps/android/` · Guía operativa: `apps/android/README.md` · Decisión: ADR-014.

Servidor por defecto: **`https://macondo.comfasucre.co`** (dominio público, certificado válido, sin CA propia).
Respaldo sin internet: `https://192.168.31.240:3443` (CA local empaquetada). Destinos: tablets Fire HD 10 y el
**kiosco táctil Android de 32"** de la biblioteca (Android ≥ 9 requerido; marca/versión por confirmar).

> El APK está **compilado, firmado y verificado estáticamente**; **no se ha ejecutado en una Fire HD 10 ni
> en un emulador** (no disponibles en este entorno). Todo lo que depende del dispositivo sigue *pendiente
> de validación física*.

## Por qué existe

La simulación (`docs/FIRE-HD10-SIMULACION.md`, hallazgo 2) demostró que desde `http://192.168.31.240:3100`
el navegador no tiene *contexto seguro*: sin service worker, sin Cache Storage, sin `crypto.subtle` y, por
tanto, sin descargas offline (pruebas 1, 4 y 5 del §7). ADR-005 preveía un contenedor nativo como respaldo
si fallaban justo esas pruebas. Este APK es ese respaldo, pero el problema de fondo (HTTPS en la LAN) se
resuelve en la infraestructura y la app lo aprovecha:

```
Tablet (APK)  ──https://192.168.31.240:3443──▶  macondo-https (Caddy, perfil `https`)
   │ confía en infra/certs/ca.crt                       │ TLS con infra/certs/server.crt
   │ (res/raw/macondo_ca.crt)                            ▼
   │                                              macondo-web:3100 (Next) ──▶ macondo-api:4100
   └── http://IP:3100 sigue disponible para PCs/TV (sin contexto seguro)
```

## Novedades 1.1.0 (kiosco de 32")

| Función | Implementación |
|---|---|
| Arranque al encender | `BootReceiver` (`BOOT_COMPLETED`, `LOCKED_BOOT_COMPLETED`, `QUICKBOOT_POWERON`, `MY_PACKAGE_REPLACED`) + permiso `RECEIVE_BOOT_COMPLETED`; preferencia «Iniciar al encender» (ON por defecto en Kiosco/TV). En Android 10+ requiere device owner o ser launcher |
| Pantalla de inicio | `activity-alias .HomeActivity` (categoría HOME, desactivado) que `HomeLauncher` activa con `setComponentEnabledSetting`; si es device owner, `addPersistentPreferredActivity` lo fija sin preguntar |
| Orientación / escala / pantalla encendida | `Prefs.orientation` (auto/horizontal/vertical; TV → horizontal por defecto), `Prefs.scalePercent` (100/125/150/175 → `WebSettings.textZoom` + `?escala=1.25` en la URL de inicio), `Prefs.keepScreenOn` |
| Endurecimiento kiosco | `setExcludeFromRecents`, `setShowWhenLocked`, `setTurnScreenOn`, sin pulsación larga/selección en el WebView, Atrás no abandona la app; lock task por defecto en modo Kiosco cuando es device owner |
| Acceso a Configuración | Pulsación de 3 s en la esquina superior izquierda (120 dp) detectada en `dispatchTouchEvent` sin robar el toque a la web; además la pulsación larga del logotipo al arrancar |
| Preselecciones de servidor | Botones «Servidor principal» / «Red local» que rellenan el campo (BuildConfig `DEFAULT_SERVER_URL`, `LAN_SERVER_URL`) |

## Arquitectura de la app

| Pieza | Archivo | Función |
|---|---|---|
| `MainActivity` | `app/src/main/java/.../MainActivity.kt` | WebView, confinamiento de origen, pantalla completa, página de error, kiosco (barras ocultas + lock task), botón Atrás |
| `SettingsActivity` | `SettingsActivity.kt` | URL del servidor, modo Tablet/Kiosco/TV, interruptor kiosco, PIN, salir de kiosco |
| `Prefs` | `Prefs.kt` | SharedPreferences (`server_url`, `mode`, `kiosk_enabled`, `pin`) con valores por defecto de `BuildConfig` |
| `UrlUtils` | `UrlUtils.kt` | `normalizeServerUrl`, `isSameOrigin`, `startUrl`, `isValidPin` — Kotlin puro, probado con JUnit |
| `BootReceiver` / `HomeLauncher` | `BootReceiver.kt`, `HomeLauncher.kt` | Autoarranque y alias HOME (ver «Novedades 1.1.0») |
| `MacondoDeviceAdminReceiver` | `MacondoDeviceAdminReceiver.kt` | Receptor de administración (sin políticas) para poder ser *device owner* y usar `setLockTaskPackages` |
| Página de error | `app/src/main/assets/error.html` | HTML local con paleta kiosco; enlaces `macondo://reintentar` y `macondo://configuracion` |
| Confianza TLS | `res/xml/network_security_config.xml` + `res/raw/macondo_ca.crt` | CAs del sistema + CA de la biblioteca; `cleartextTrafficPermitted=true` para admitir `http://` |
| Icono / splash | `res/mipmap-*/`, `res/drawable/splash.xml` | Icono adaptativo generado con `sips` desde `apps/web/public/icons/comfasucre-512.png` sobre fondo blanco |

Flujo de arranque: tema `Theme.Macondo.Splash` (fondo con logotipo) → `MainActivity` carga
`serverUrl + ruta del modo` → `onPageFinished` oculta la capa de arranque (mínimo 900 ms para permitir
la pulsación larga que abre Configuración).

Ajustes del WebView: JavaScript, DOM storage, base de datos, `mediaPlaybackRequiresUserGesture=false`,
`MIXED_CONTENT_NEVER_ALLOW`, `allowFileAccess=false`, `allowContentAccess=false`, zoom desactivado,
`setSupportMultipleWindows(false)`, `User-Agent + " MacondoDigitalApp/1.0.0"` (la web puede detectar la app
con ese sufijo si algún día necesita comportarse distinto).

## Decisiones de seguridad

1. **CA propia empaquetada, nunca ignorar errores SSL.** La alternativa habitual
   (`onReceivedSslError → handler.proceed()`) haría que *cualquier* certificado fuera aceptado, lo que
   anula TLS y es motivo de rechazo en revisiones de seguridad. Con la CA en `network_security_config`
   el WebView valida la cadena normalmente; el único cambio respecto a un dispositivo estándar es un
   ancla de confianza adicional, limitada a esta app. Coste: si se regenera la CA, hay que recompilar
   el APK (la CA dura 10 años; el certificado de servidor 825 días y se reemite sin tocar el APK).
2. **Origen confinado.** Solo se navega dentro del origen configurado; todo lo demás va al navegador
   del sistema (o se ignora en pantalla fija). Evita que un enlace externo convierta la tablet en un
   navegador abierto.
3. **Permisos mínimos.** `INTERNET`, `ACCESS_NETWORK_STATE`, `WAKE_LOCK`, `RECEIVE_BOOT_COMPLETED` (1.1.0, autoarranque). Cámara/micrófono se deniegan
   en `onPermissionRequest`. Sin `allowBackup`.
4. **Device owner opcional.** El bloqueo real de salida (§7.7) exige que el sistema lo imponga. La app
   implementa lock task cuando es *device owner* (`adb shell dpm set-device-owner …`); si no, el modo
   kiosco solo oculta las barras y se documenta la alternativa (Amazon Kids / MDM). Un `DeviceAdminReceiver`
   sin políticas no otorga capacidades extra fuera de lock task.
5. **PIN local.** Protege Configuración y la salida del kiosco frente al público; no es un mecanismo
   criptográfico (se guarda en SharedPreferences de la app, inaccesibles a otras apps sin root). PIN
   inicial 2026; cambiarlo en la primera configuración.
6. **`http://` permitido.** Facilita la transición y el diagnóstico; la propia web avisa de que sin
   contexto seguro no hay descargas offline.

## HTTPS local (infraestructura)

- `scripts/make-local-certs.sh [IP…]` → `infra/certs/ca.crt|ca.key` (10 años) y `server.crt|server.key`
  (825 días, SAN: IPs dadas o detectadas, `localhost`, `127.0.0.1`, `macondo.local`). Idempotente; copia
  la CA a `apps/android/app/src/main/res/raw/macondo_ca.crt`. Claves en `.gitignore`.
- `docker-compose.yml` → servicio `macondo-https` (`caddy:2-alpine`, perfil `https`, puerto `3443`,
  `infra/docker/Caddyfile`). `docker compose up -d` no cambia; se activa con
  `docker compose --profile https up -d macondo-https`.
- Verificado 2026-11-01: `curl --cacert infra/certs/ca.crt https://192.168.31.240:3443/api/health` →
  `{"status":"ok"…}`; sin `--cacert` falla (60), como debe. Con Playwright (Chromium) en
  `https://192.168.31.240:3443`: `isSecureContext=true`, `serviceWorker`/`caches`/`crypto.subtle`
  presentes y el SW `macondo-shell-v3` **activado** (con la clave del servidor fijada mediante
  `--ignore-certificate-errors-spki-list`, porque Chromium no lee CAs externas en macOS y, si solo se
  ignoran los errores, rechaza registrar el SW). El control con `http://192.168.31.240:3100` dio
  `isSecureContext=false` y sin `serviceWorker`.

## Compilación y verificación (2026-11-01)

- Método: `apps/android/build-in-docker.sh` → contenedor `eclipse-temurin:17-jdk` (`linux/amd64`, porque
  el `aapt2` de Maven solo existe para x86_64) con el SDK local montado en solo lectura
  (`platforms;android-34`, `build-tools;34.0.0`) y caché Gradle en un volumen.
- `./gradlew test lint assembleRelease` — resultados en la sección «Evidencia» de abajo.
- Firma: `entregables/android-firma/macondo-release.jks` (PKCS12, RSA 2048, 30 años, alias `macondo`),
  contraseñas en `entregables/android-firma/LEEME.txt` (carpeta fuera del repo y del ZIP).
- Salidas: `entregables/macondo-digital-1.0.0.apk` y `apps/web/public/descargas/macondo-digital.apk`
  (+ `SHA256SUMS.txt`, `macondo-digital.json` que lee la página `/instalar`).

### Evidencia

Ver el bloque «Evidencia de compilación» al final de este documento (rellenado con la salida real de
`gradle`, `apksigner verify --print-certs` y `aapt dump badging`).

## Qué resuelve y qué no

| | PWA en Silk (`http://IP:3100`) | PWA en Silk (`https://IP:3443`) | APK (`https://IP:3443`) |
|---|---|---|---|
| Contexto seguro / SW / offline | ❌ | ✅ solo si se instala la CA en la tablet (Ajustes → Seguridad → Instalar certificado) | ✅ sin tocar la tablet |
| Icono en inicio sin Google Play | «Añadir a inicio» de Silk | igual | ✅ app nativa |
| Bloqueo de salida (§7.7) | perfil Amazon Kids / MDM | igual | ✅ lock task si es device owner (+ Amazon Kids / MDM) |
| Pantalla encendida en TV/kiosco | no controlable | no controlable | ✅ |
| Persistencia garantizada (`storage.persist`) | ❌ | depende de Silk | **pendiente de validación física** |
| Batería, audífonos, reinicio real | pendiente físico | pendiente físico | pendiente físico |

## Pendiente de validación física (añadir a la matriz de `docs/TESTING.md`)

1. Instalar el APK por sideload en Fire OS 7 y 8 y abrirlo (prueba 1).
2. Confirmar que el WebView acepta `https://192.168.31.240:3443` sin aviso (CA empaquetada).
3. Descargar libro/audio/galería dentro de la app, modo avión, abrir (prueba 4) y reiniciar (prueba 5).
4. `navigator.storage.persist()` dentro del WebView (prueba 6) y consumo de batería/almacenamiento.
5. `adb shell dpm set-device-owner` en una tablet sin cuentas; comprobar que Inicio/Recientes no salen
   y que el PIN permite salir (prueba 7).
6. Versión del WebView del sistema en Fire OS (sin Play no se actualiza por Play; Amazon lo actualiza con
   Fire OS): anotar `chrome://version` desde la app en depuración.

## Evidencia de compilación 1.1.0 (2026-11-01)

| Comprobación | Resultado |
|---|---|
| `./gradlew test lint assembleRelease` (mismo método Docker) | **BUILD SUCCESSFUL in 2m 49s** (un intento previo falló por lint `StringFormatInvalid` en «125–150 %»: corregido con `formatted="false"`) |
| Pruebas unitarias `UrlUtilsTest` | 7 tests, 0 fallos (nuevo: URL de inicio con `?escala=`) |
| Lint | 0 errores, 29 avisos (icono, dependencias más nuevas, textos «100 %» fijos en el layout) |
| `apksigner verify --print-certs` | v2 OK; mismo firmante, certificado SHA-256 `6f09061c9c1913d2f16185e262547d6b828ead84f09d8458579110eee7178ae0` |
| `aapt dump badging` | `versionCode='2' versionName='1.1.0'`, `sdkVersion:'28'`, `targetSdkVersion:'34'`, permisos `INTERNET`, `ACCESS_NETWORK_STATE`, `WAKE_LOCK`, **`RECEIVE_BOOT_COMPLETED`**; manifiesto con `activity-alias HomeActivity` (HOME) y `receiver BootReceiver` (BOOT_COMPLETED…) |
| APK | 1 096 283 bytes · SHA-256 `06d1b1a1f4ebd4e04bd67aaecb3d5019c3448597dad7b14d3d9bf0370a6f4514` → `entregables/macondo-digital-1.1.0.apk` (el 1.0.0 se retiró) y `apps/web/public/descargas/` (+ JSON y SHA256SUMS) |
| Ejecución en Fire HD 10 / kiosco 32" / emulador | **NO realizada** — pendiente de validación física (incl. versión de Android del tótem, autoarranque en Android 10+, lock task, escala legible) |

## Evidencia de compilación 1.0.0 (2026-11-01)

| Comprobación | Resultado |
|---|---|
| `./gradlew clean test lint assembleRelease` (Docker `eclipse-temurin:17-jdk`, linux/amd64, SDK local ro) | **BUILD SUCCESSFUL in 2m 51s** (intento 1 en arm64 falló: `aapt2` x86_64 «rosetta error»; resuelto con `DOCKER_PLATFORM=linux/amd64`) |
| Pruebas unitarias `UrlUtilsTest` | 6 tests, 0 fallos, 0 errores |
| Lint (`lintDebug`) | 0 errores, 25 avisos (forma del icono/duplicados, versiones de dependencias más nuevas, overdraw, sin icono monocromo, targetSdk 34 no es el último) |
| `apksigner verify --print-certs` | Verificado (APK Signature Scheme v2); 1 firmante `CN=Macondo Digital, OU=Biblioteca Macondo, O=Comfasucre, L=Sincelejo, ST=Sucre, C=CO`; SHA-256 del certificado `6f09061c9c1913d2f16185e262547d6b828ead84f09d8458579110eee7178ae0` |
| `aapt dump badging` | `package: name='co.com.comfasucre.macondo' versionCode='1' versionName='1.0.0'` · `sdkVersion:'28'` · `targetSdkVersion:'34'` · permisos `INTERNET`, `ACCESS_NETWORK_STATE`, `WAKE_LOCK` (+ `…DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION`, permiso propio que añade AndroidX, no es de usuario) · `application-label:'Macondo Digital'` |
| APK | `app-release.apk` 1 080 259 bytes (1,03 MiB) · SHA-256 `cbc4721b4ca3f216b73fe24122c6cd4a92d8d5522696cbd9ba7cbea617aa89e1` |
| Copias | `entregables/macondo-digital-1.0.0.apk` · `apps/web/public/descargas/macondo-digital.apk` + `SHA256SUMS.txt` + `macondo-digital.json` |
| `curl --cacert infra/certs/ca.crt https://192.168.31.240:3443/api/health` | `{"status":"ok","db":"ok",…}`; sin `--cacert` → error 60 (esperado) |
| Playwright/Chromium en `https://192.168.31.240:3443` | `isSecureContext=true`, `serviceWorker`/`caches`/`crypto.subtle` presentes, SW `activated` (scope `/`), caché `macondo-shell-v3` creada; control `http://…:3100` → `isSecureContext=false`, sin `serviceWorker` |
| Página `/instalar` | `tsc --noEmit` sin errores; **no renderizada** (la imagen Docker de la web se reconstruye en la QA final) |
| Ejecución en Fire HD 10 / emulador | **NO realizada** — pendiente de validación física |
