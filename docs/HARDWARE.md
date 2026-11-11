# Hardware de la biblioteca y qué corre en cada equipo

Fecha: 2026-11-01. Equipos especificados por la Biblioteca Macondo (Comfasucre). Decisión: ADR-015.
Dirección principal del servicio: **`https://macondo.comfasucre.co`** (EasyPanel, certificado público).
Respaldo sin internet con el servidor en la red local: `https://192.168.31.240:3443` (CA propia,
`infra/certs/`) o `http://192.168.31.240:3100` (sin contexto seguro: sin descargas offline).

> Nada de esta página se ha ejecutado todavía sobre el hardware real (no está disponible en el entorno de
> desarrollo). Lo verificado es la web en Chromium a las resoluciones de cada equipo y la compilación del
> APK y de los scripts. Cada equipo lleva su lista de **pendiente de validación física**.

## Inventario

| Equipo | Cantidad | Especificación conocida | Desconocido (preguntar a la biblioteca) | Qué corre | Pantalla de la web |
|---|---|---|---|---|---|
| Tablets Amazon Fire HD 10 | 30 | Fire OS (7/8), 10,1" 1920×1200, sin Google Play | Generación exacta (2019/2021/2023) y versión de Fire OS | App Android `macondo-digital.apk` (modo **Tablet**) | `/` portal estudiantes, lectores, `/retos`, `/offline` |
| Tótem táctil 32" «tipo K» | 1 | De pie, blanco, Android, táctil; viewing 0,6–1 m; uso infantil | **Marca/modelo, versión de Android, orientación** (lo más probable: vertical 1080×1920; posible horizontal 1920×1080), DPR, WebView actualizable, acceso a *device owner* (ADB) | App Android en modo **Kiosco** (o Chrome `--kiosk`) | `/kiosco?escala=1.25–1.5` |
| Mini PC de sala Dell OptiPlex 3000 Thin Client | 1 | Intel Pentium Silver N6005, 16 GB RAM, SSD 512 GB, Windows 11 Pro, HDMI al televisor | Resolución del televisor (1080p o 4K), si el televisor apaga la señal por inactividad | Microsoft Edge en modo kiosco (paquete `infra/tv-windows/`) | `/tv` (sin sonido, sin cursor) |
| PCs de bibliotecarios | — | Windows/macOS con navegador actual | — | Navegador | `/admin` |
| Televisor | 1 | HDMI | Tamaño/resolución, HDR | — | — |

## Tablets Fire HD 10 → app Android (modo Tablet)

- Instalación por *sideload* desde `/instalar` (QR + SHA-256). Guía: `docs/APP-ANDROID.md`, `apps/android/README.md`.
- La app 1.1.0 trae `https://macondo.comfasucre.co` por defecto; sin internet, cambiar en Configuración a `https://192.168.31.240:3443` (la CA propia ya viene empaquetada).
- Descargas sin conexión solo con contexto seguro (`https://`). Matriz física obligatoria: `docs/TESTING.md` §Fire HD 10.

## Tótem táctil Android 32" → app Android (modo Kiosco)

### Qué hace la web (`/kiosco`)
- **Escala** `?escala=1|1.25|1.5|1.75` → CSS `zoom` en la raíz del kiosco (Chromium/WebView; respaldo `transform: scale` si el motor no admite `zoom`). Se guarda en `localStorage` (`macondo.kiosk.config.scale`), así que basta pasarla una vez por URL; la URL siempre pisa lo guardado.
- **Orientación**: se detecta con el tamaño efectivo (ventana ÷ escala). Vertical (1080×1920, 1200×1920): buscador a todo lo ancho, categorías en 2 columnas con la quinta a toda la fila (≥132 px de alto), recursos en 2–3 columnas, ficha apilada con QR de 320 px (×escala). Horizontal (1920×1080): 5 categorías, 3–5 columnas, QR 240 px.
- **Objetivos táctiles**: botones ≥ 56 px (≥ 64 en buscador, volver y diálogos), categorías ≥ 72 px, según `branding.md` §3.4.
- **Inactividad**: 90 s + aviso de 10 s (grande, centrado, botón de 72 px). Ajustable por URL `?inactividad=120&aviso=15` o en el panel.
- **Panel oculto «Configuración del kiosco»**: pulsación larga de 3 s sobre el logotipo de la cabecera → escala, orientación detectada (ventana, DPR, efectivo), inactividad. Sin PIN: el bloqueo lo hace la app/OS; el panel solo cambia presentación.

### Configuración del dispositivo (técnico)
1. Instalar `macondo-digital.apk` (1.1.0) desde `/instalar` (si el tótem tiene navegador) o por ADB/USB.
2. Abrir la app → pulsación larga en el logotipo → **Configuración**: modo **Kiosco**, dirección `https://macondo.comfasucre.co`, escala **125 %** (texto grande) o **150 %** (niños pequeños / vertical), PIN nuevo.
3. Arranque automático y bloqueo de salida: la app ofrece lock task si es *device owner* (`adb shell dpm set-device-owner co.com.comfasucre.macondo/.MacondoDeviceAdminReceiver` en un dispositivo sin cuentas). Si el fabricante trae su propio «modo kiosco»/launcher, usarlo con la app como única permitida. Sin ninguna de las dos, Android «Fijar pantalla».
4. Pantalla siempre encendida mientras la app está abierta (`WAKE_LOCK`); desactivar además el apagado de pantalla y las actualizaciones automáticas fuera de horario en Ajustes.
5. Alternativa sin app: Chrome/WebView del sistema con `https://macondo.comfasucre.co/kiosco?escala=1.5` en modo kiosco del fabricante.

### Pendiente de validación física
- Orientación y resolución reales; si el panel es horizontal, revisar `?escala=1.25` (ya probado en Chromium a 1920×1080).
- Versión de Android/WebView: `zoom` funciona en WebView ≥ Chromium 30; si el WebView fuera muy antiguo, la página usa `transform: scale` automáticamente.
- Latencia táctil y respuesta de la pulsación larga de 3 s con el panel táctil real.
- Acceso ADB para *device owner*; si no, modo kiosco del fabricante.

## Mini PC de sala (Windows 11 Pro) → Edge kiosco con `/tv`

Paquete `infra/tv-windows/` (`LEEME-TV-Windows.md` con la lista de pasos para el técnico):

| Pieza | Función |
|---|---|
| `Instalar-Macondo-TV.ps1` | Una vez, como administrador, en la sesión `macondotv`: pide la URL (por defecto `https://macondo.comfasucre.co/tv`), instala la CA local **solo** si la URL es una IP privada con `https://`, crea la tarea programada «Macondo TV» al iniciar sesión (Edge `--kiosk --edge-kiosk-type=fullscreen --no-first-run --autoplay-policy=no-user-gesture-required --disable-features=TranslateUI --kiosk-idle-timeout-minutes=0`; Chrome como respaldo), energía sin apagado ni suspensión, hibernación fuera, sin protector/bloqueo ni notificaciones, registro en `%ProgramData%\MacondoTV\`. |
| `Iniciar-Macondo-TV.cmd` | Arranque manual con la URL guardada. |
| `Desinstalar-Macondo-TV.ps1` | Quita la tarea, restaura energía (plan Equilibrado), protector, bloqueo y notificaciones; `-QuitarCA` retira la CA. |

- `/tv` escala con `--u = min(1vw, 1.7778vh)`: verificado a 1280×720, 1920×1080 y 3840×2160 sin scroll. En 4K la portada ahora llena su panel (antes quedaba al tamaño intrínseco de la miniatura).
- CPU modesta (N6005): una animación de entrada por diapositiva (0,7 s) y una barra de avance con transición de 200 ms. `?animaciones=0` las desactiva (igual que `prefers-reduced-motion`); recomendable en 4K si se notan tirones.
- `?origin=` fija el origen de los QR cuando la TV abre el servidor por otra dirección (IP local). Con el dominio público no hace falta.
- Cursor oculto por CSS (`.modo-tv`), sonido: silenciar HDMI en Windows (la TV no reproduce audio).
- Los scripts no se han ejecutado en Windows en esta sesión (sin equipo ni `pwsh` disponibles): revisados a mano para Windows PowerShell 5.1; primera instalación con el registro a la vista.

## PCs de bibliotecarios → `/admin`

Navegador actualizado (Edge/Chrome/Firefox/Safari), `https://macondo.comfasucre.co/admin`. Sin instalación. Cambiar las claves de demostración en el primer acceso (`docs/SECURITY.md`).

## Preguntas abiertas para la biblioteca

1. Tótem 32": marca y modelo, versión de Android, orientación de montaje (vertical u horizontal), ¿permite ADB/*device owner* o trae modo kiosco propio?
2. Televisor de la sala: tamaño y resolución (1080p o 4K), ¿tiene apagado automático sin señal?
3. ¿La red de la biblioteca tendrá internet estable para usar el dominio público, o conviene dejar el servidor local (`192.168.31.240`) como principal?
4. Fire HD 10: generación y versión de Fire OS de las 30 unidades.
