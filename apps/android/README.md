# Macondo Digital — app Android (tablets Fire HD 10 y kiosco táctil de 32")

Contenedor nativo (Kotlin + WebView) que abre la web de Macondo Digital. Servidor por defecto:
**`https://macondo.comfasucre.co`** (dominio público con certificado válido: no necesita ninguna CA
propia). Como respaldo, cuando la biblioteca no tiene internet, la app también confía en la CA local y
puede usar **`https://192.168.31.240:3443`** dentro del Wi-Fi de la biblioteca.
Es el **respaldo nativo** de ADR-005 y la pieza que resuelve el hallazgo 2 de `docs/FIRE-HD10-SIMULACION.md`:
en las tablets, `http://IP:3100` no es un *contexto seguro* (sin service worker ni descargas offline).
La app confía en la **CA local de la biblioteca** y abre `https://IP:3443`, con lo que la web obtiene
service worker, Cache Storage, IndexedDB y `storage.persist()` dentro de la app.

| Dato | Valor |
|---|---|
| Paquete | `co.com.comfasucre.macondo` |
| Versión | 1.1.0 (versionCode 2) |
| Android mínimo | 9 (API 28) = Fire OS 7 · objetivo API 34 |
| Permisos | `INTERNET`, `ACCESS_NETWORK_STATE`, `WAKE_LOCK`, `RECEIVE_BOOT_COMPLETED` |
| Herramientas | Gradle 8.7 (wrapper), AGP 8.5.2, Kotlin 1.9.24, JDK 17, compileSdk 34, build-tools 34.0.0 |
| Tamaño del APK | 1 096 283 bytes (release, minificado); SHA-256 en `apps/web/public/descargas/SHA256SUMS.txt` |

> **Estado**: el APK está compilado, firmado y verificado estáticamente (`apksigner`, `aapt`), pero
> **NO se ha ejecutado en una Fire HD 10 ni en un emulador** en este entorno. Toda la matriz física del §7
> sigue *pendiente de validación física* (`docs/TESTING.md`).

## Qué hace la app

- **Pantalla de arranque** con el logotipo Comfasucre; pulsación larga sobre el logotipo → *Configuración*.
- **WebView** con JavaScript, DOM storage, base de datos, reproducción de audio sin gesto previo, zoom
  desactivado (la web trae sus controles de letra), contenido mixto bloqueado, acceso a archivos
  desactivado, sin ventanas múltiples; `User-Agent` del sistema + ` MacondoDigitalApp/1.0.0`.
- **Navegación confinada** al origen configurado; cualquier enlace a otro sitio abre el navegador del
  sistema (en pantalla fija se ignora). Botón **Atrás** = historial de la web.
- **Pantalla completa** para video/galerías (`WebChromeClient`) y **denegación** de cámara/micrófono.
- **Página de error propia** (`assets/error.html`, paleta kiosco) cuando falla la carga principal o el
  certificado no es de confianza: botones «Reintentar» y «Configuración».
- **Configuración** (español): dirección del servidor (`http://` o `https://`, validada) con dos
  preselecciones («Servidor principal: macondo.comfasucre.co» y «Red local de la biblioteca:
  192.168.31.240:3443») más campo libre; modo de uso (**Tablet** → `/`, **Kiosco** → `/kiosco`,
  **TV** → `/tv`); **orientación** (automática / horizontal / vertical); **escala de pantalla**
  (100/125/150/175 %, aplicada como `textZoom` del WebView y enviada a la web como `?escala=1.25`);
  **mantener pantalla encendida**; **iniciar al encender**; **usar como pantalla de inicio**;
  interruptor de **modo kiosco**; cambio de **PIN** (4–6 dígitos; inicial **2026**). Valores por defecto
  según el modo: Kiosco → kiosco ON, autoarranque ON, pantalla encendida ON; TV → autoarranque ON,
  pantalla encendida ON, horizontal; Tablet → todo OFF, orientación automática.
- **Modo kiosco**: oculta barras del sistema (inmersivo), fuera de «Recientes», visible sobre la pantalla
  de bloqueo, sin menú contextual/selección de texto, Atrás nunca abandona la app y, si la app es
  *device owner*, fija la pantalla con `startLockTask()`. Para abrir Configuración: **pulsación de 3 s en
  la esquina superior izquierda** (o pulsación larga en el logotipo al arrancar) → PIN. Si no es device
  owner, el kiosco solo oculta las barras (Inicio/Recientes siguen funcionando) salvo que la app sea la
  pantalla de inicio.
- **Arranque automático** (`BootReceiver`): al encender (`BOOT_COMPLETED`) y tras actualizar
  (`MY_PACKAGE_REPLACED`) abre la app si «Iniciar al encender» está activo. En Android 10+ el sistema
  solo lo permite si la app es device owner o launcher; por eso en el kiosco se activa también «Usar
  como pantalla de inicio» (alias `HomeActivity` con categoría HOME, desactivado por defecto).

Fuentes: `app/src/main/java/co/com/comfasucre/macondo/` — `MainActivity.kt` (WebView, kiosco),
`SettingsActivity.kt`, `Prefs.kt`, `UrlUtils.kt` (validación/origen, probado con JUnit),
`MacondoDeviceAdminReceiver.kt`, `BootReceiver.kt`, `HomeLauncher.kt`. Recursos clave: `res/xml/network_security_config.xml`,
`res/raw/macondo_ca.crt`, `assets/error.html`.

## Seguridad TLS: por qué una CA propia y no «ignorar errores»

Con el dominio público `https://macondo.comfasucre.co` (EasyPanel, certificado válido) **no hace falta
ninguna CA personalizada**: el WebView valida con las CAs del sistema. La CA local solo entra en juego
con la dirección de red local `https://192.168.31.240:3443`, pensada para cuando la biblioteca se queda
sin internet y el servidor local sigue encendido.

`res/xml/network_security_config.xml` confía en las CAs del sistema **más** `res/raw/macondo_ca.crt`
(copia de `infra/certs/ca.crt`, generada por `scripts/make-local-certs.sh`). No hay ningún
`onReceivedSslError → proceed()`: un certificado que no esté firmado por esas CAs se rechaza y se muestra
la página de error con el motivo. Consecuencias:

- `https://192.168.31.240:3443` (Caddy con `infra/certs/server.crt`) funciona dentro de la app sin
  instalar nada en la tablet.
- Si se **regenera la CA** (`infra/certs/ca.crt`), hay que volver a ejecutar
  `sh scripts/make-local-certs.sh` (copia la CA al proyecto) y **recompilar e instalar el APK**.
- `DEFAULT_SERVER_URL` (dominio público) y `LAN_SERVER_URL` (red local) se definen en
  `app/build.gradle.kts`; cambiarlos requiere recompilar, pero el bibliotecario puede escribir cualquier
  otra dirección en Configuración.
- Se admite `http://` (sin contexto seguro: la web funciona pero sin descargas offline).

## Compilar

Requisitos: Docker (recomendado) o JDK 17 + Android SDK con `platforms;android-34` y `build-tools;34.0.0`.
El Java local de desarrollo (25) es demasiado nuevo para AGP 8.5, por eso se compila en un contenedor
`eclipse-temurin:17-jdk` montando el SDK local en solo lectura.

```sh
# Desde la raíz del repo. En Mac Apple Silicon hace falta linux/amd64 (el aapt2 de Maven es x86_64):
export DOCKER_PLATFORM=linux/amd64
sh apps/android/build-in-docker.sh test lint assembleRelease
# APK: apps/android/app/build/outputs/apk/release/app-release.apk
```

Sin Docker (con JDK 17 en `JAVA_HOME` y `ANDROID_HOME` definidos):

```sh
cd apps/android && ./gradlew test lint assembleRelease
```

Pruebas unitarias: `app/src/test/java/.../UrlUtilsTest.kt` (normalización de URL, mismo origen, URL de
inicio por modo, PIN). Lint: `./gradlew lint` (informe en `app/build/reports/lint-results-debug.html`).

### Firma

La clave de firma vive **fuera del repositorio**: `entregables/android-firma/macondo-release.jks`
(alias `macondo`), contraseñas en `entregables/android-firma/LEEME.txt`. `entregables/`,
`apps/android/keystore.properties` y `*.jks` están en `.gitignore`.

Dos formas de pasarla al build:

1. Variables de entorno (las usa `build-in-docker.sh`):
   `MACONDO_STORE_FILE`, `MACONDO_STORE_PASSWORD`, `MACONDO_KEY_ALIAS`, `MACONDO_KEY_PASSWORD`.
2. Archivo `apps/android/keystore.properties` (copiar de `keystore.properties.example`).

Toda actualización debe firmarse con la **misma** clave; si se pierde, las tablets no aceptarán la nueva
versión sin desinstalar (y se pierden las descargas offline). Para crear otra clave:
`keytool -genkeypair -keystore macondo-release.jks -storetype PKCS12 -alias macondo -keyalg RSA -keysize 2048 -validity 10958`.

### Verificar el APK

```sh
BT=~/Library/Android/sdk/build-tools/34.0.0
$BT/apksigner verify --print-certs app/build/outputs/apk/release/app-release.apk
$BT/aapt dump badging app/build/outputs/apk/release/app-release.apk | grep -E "package|sdkVersion|uses-permission|application-label"
```

### Publicar en el servidor (para que las tablets lo descarguen)

```sh
cp apps/android/app/build/outputs/apk/release/app-release.apk entregables/macondo-digital-1.0.0.apk
cp apps/android/app/build/outputs/apk/release/app-release.apk apps/web/public/descargas/macondo-digital.apk
( cd apps/web/public/descargas && shasum -a 256 macondo-digital.apk > SHA256SUMS.txt )
# Actualizar apps/web/public/descargas/macondo-digital.json (version, sha256, sizeBytes, builtAt)
docker compose up -d --build macondo-web
```

La página pública `/instalar` muestra el QR al APK, los pasos de instalación, la versión y el SHA-256.

## Kiosco táctil Android de 32 pulgadas (tótem «tipo K»)

El kiosco de la biblioteca es un tótem de pie, blanco, con pantalla táctil de 32" y un Android de marca
no identificada. **Requisito: Android 9 (API 28) o superior.** Cómo comprobarlo en el equipo:
*Ajustes → Acerca del dispositivo/tablet → Versión de Android* (o `adb shell getprop ro.build.version.release`).
Si trae Android 8 o anterior, el APK no se instala («aplicación no compatible»); habría que bajar
`minSdk` y recompilar (no probado). Anotar también resolución (`adb shell wm size`, esperable 1080×1920
en vertical) y densidad (`adb shell wm density`).

1. **Instalar.** Por USB: activar *Opciones de desarrollador → Depuración USB* y
   `adb install -r entregables/macondo-digital-1.1.0.apk`. Sin PC: en el navegador del kiosco abrir
   `https://macondo.comfasucre.co/instalar` (o `http://192.168.31.240:3100/instalar`) → Descargar APK →
   permitir «instalar apps desconocidas» para ese navegador → Instalar. Hace falta un teclado/ratón USB o el
   teclado en pantalla.
2. **Device owner (bloqueo total).** Con el kiosco recién restablecido y **sin cuentas** añadidas:
   `adb shell dpm set-device-owner co.com.comfasucre.macondo/.MacondoDeviceAdminReceiver`.
   Si el firmware trae su propia app de kiosco/launcher como device owner, el comando falla
   («already has a device owner»): ver el último punto.
3. **Configurar** (esquina superior izquierda 3 s → PIN 2026 → Configuración): dirección (servidor principal,
   o red local si el kiosco no tendrá internet), modo **Kiosco**, orientación **Vertical** (u Horizontal si el
   tótem está apaisado), **escala 125–150 %** (recomendado para 32" a 1080p; 175 % si se ve pequeño desde
   de pie), pantalla encendida ON, **Iniciar al encender** ON, **Usar como pantalla de inicio** ON, modo
   kiosco ON. Cambiar el PIN. Guardar.
4. **Pantalla de inicio.** Si es device owner, la app queda fijada como launcher automáticamente. Si no,
   al pulsar Inicio Android pregunta qué launcher usar: elegir **Macondo Digital → Siempre**. Para
   deshacerlo: Configuración → desactivar «Usar como pantalla de inicio» (o *Ajustes → Apps → Apps
   predeterminadas → Aplicación de inicio*).
5. **Comprobar el arranque automático**: apagar y encender el tótem; debe abrir Macondo Digital solo.
   Tras una actualización del APK también se relanza.
6. **Salir / mantenimiento**: esquina superior izquierda 3 s → PIN → «Salir del modo kiosco» (libera la
   pantalla fija) o desactivar «Usar como pantalla de inicio». Para desinstalar siendo device owner, antes
   «Dejar de ser propietaria del dispositivo».
7. **Si el firmware ya trae su propio kiosco/launcher**: lo más sencillo es usarlo para fijar Macondo Digital
   como única app (añadir el APK a su lista blanca, apagar su barra). Si ese software es device owner no se
   puede instalar el nuestro como tal sin restablecer de fábrica; el modo kiosco de nuestra app seguirá
   ocultando barras y arrancando al encender si el launcher del fabricante lo permite. Si el fabricante
   ofrece un «modo single app» de Android (lock task) para apps de terceros, usarlo con nuestro paquete.

Pendiente de validación física en el tótem: versión de Android, instalación, táctil, orientación,
escala legible, autoarranque y bloqueo de salida.

## Instalar en una Fire HD 10 (sideload, sin Google Play)

1. Conectar la tablet al Wi-Fi de la biblioteca.
2. **Ajustes → Seguridad y privacidad → Aplicaciones de origen desconocido → Silk Browser → Permitir**
   (en Fire OS 5/6: *Ajustes → Seguridad → Aplicaciones de origen desconocido*).
3. Abrir Silk → `http://192.168.31.240:3100/instalar` (o `https://…:3443/instalar`) → escanear el QR o
   pulsar **Descargar APK**. Aceptar el aviso de descarga.
4. Notificación «macondo-digital.apk» → **Instalar** → **Abrir**. Si Fire OS pide confirmar «¿Instalar
   esta aplicación?», aceptar.
5. Alternativa con cable: activar *Opciones de desarrollador → Depuración ADB* y ejecutar
   `adb install -r entregables/macondo-digital-1.1.0.apk`.
6. Comprobar en la primera apertura: pantalla de arranque → inicio de Macondo Digital. Si aparece «No se
   pudo conectar», revisar Wi-Fi/servidor y la dirección en Configuración.

### Configurar la dirección y el modo

Mantener pulsado el logotipo en la pantalla de arranque (o «Configuración» en la página de error) →
pulsar «Servidor principal» (o «Red local» si no hay internet) → elegir **Tablet**, **Kiosco** o **TV** →
**Guardar y abrir**. Con modo kiosco activo se pide el PIN antes de entrar (también con la esquina superior
izquierda 3 s).

## Modo kiosco y *device owner* (restringir la salida)

La web no puede impedir que el público salga de la app; eso lo hace el sistema (§7 del pliego). La app
soporta la **pantalla fija** de Android (lock task), que exige ser *device owner*:

```sh
# Tablet recién restablecida o SIN cuentas (Amazon/Google) añadidas, con depuración ADB activa:
adb shell dpm set-device-owner co.com.comfasucre.macondo/.MacondoDeviceAdminReceiver
# Debe responder: Success: Device owner set to package co.com.comfasucre.macondo
```

Después, en Configuración activar **Modo kiosco**: la app oculta las barras, mantiene la pantalla
encendida y fija la pantalla; Inicio/Atrás/Recientes no salen de la app. Para salir: pulsación larga en
el logotipo (al arrancar) o botón «Configuración» de la página de error → PIN → **Salir del modo kiosco**.

Notas:
- `set-device-owner` falla si la tablet ya tiene cuentas (`Not allowed to set the device owner because
  there are already some accounts on the device`): restablecer de fábrica, saltar el inicio de sesión de
  Amazon (o eliminar la cuenta) y ejecutar el comando antes de añadir cuentas.
- Para dejar de ser device owner: Configuración → PIN → **Dejar de ser propietaria del dispositivo**
  (la app llama a `clearDeviceOwnerApp`; es la única vía sin restablecer de fábrica, porque
  `adb shell dpm remove-active-admin` no funciona con un device owner de un APK de release). Mientras
  sea device owner, la app no se puede desinstalar. Planificar antes de aplicarlo en 30 unidades.
- **Alternativas** sin ADB: perfil infantil de **Amazon Kids** con Macondo Digital como única app
  permitida, o un **MDM** (Amazon Fire for Business / cualquier MDM compatible con Fire OS) que fije la
  app. Si no es device owner, la app solo oculta las barras.
- Fire OS 8 (Android 11) y Fire OS 7 (Android 9) admiten `dpm set-device-owner`; se ha comprobado en la
  documentación, **no en hardware** (pendiente de validación física).

## Actualizar

Compilar la nueva versión (subir `versionCode`/`versionName` en `app/build.gradle.kts`), firmar con la misma
clave, publicar en `/descargas/` y, en cada tablet, abrir `/instalar` → descargar → instalar encima (no hace
falta desinstalar; se conservan descargas y configuración). Con `adb install -r …` también se actualiza.

## Solución de problemas

| Síntoma | Causa probable | Qué hacer |
|---|---|---|
| «No se pudo conectar con la biblioteca» | Sin Wi-Fi, servidor apagado o IP cambiada | Revisar red; Configuración → corregir dirección; «Reintentar» |
| «Certificado no emitido por una entidad de confianza» | El servidor usa una CA distinta a la del APK | Ejecutar `scripts/make-local-certs.sh`, recompilar e instalar el APK; o usar dominio público HTTPS |
| «El certificado no corresponde a esta dirección» | La IP no está en los SAN del certificado | `sh scripts/make-local-certs.sh <IP-nueva>` y reiniciar `macondo-https` |
| «Certificado aún no válido» | Fecha/hora de la tablet incorrecta | Ajustes → Fecha y hora → automática |
| Descargas offline «no disponibles en este navegador» | Dirección `http://` | Usar `https://macondo.comfasucre.co` o `https://IP:3443` en Configuración |
| No arranca al encender | Android 10+ sin device owner ni launcher | Activar «Usar como pantalla de inicio» o hacer device owner |
| Texto pequeño en el kiosco de 32" | Escala 100 % | Configuración → Escala 125–150 % |
| «Aplicación no instalada» al actualizar | APK firmado con otra clave | Desinstalar la anterior e instalar (se pierden descargas) |
| El kiosco no bloquea Inicio | La app no es device owner | Ver sección anterior (adb dpm / Amazon Kids / MDM) |
| Pantalla negra tras video a pantalla completa | Vista personalizada no cerrada | Botón Atrás; reiniciar la app |

## Pendiente de validación física

Instalación real en Fire HD 10 (Fire OS 7 y 8), confianza del WebView en la CA propia, descarga offline y
persistencia tras reinicio, `storage.persist()` dentro del WebView, consumo de batería y almacenamiento,
`dpm set-device-owner` en Fire OS, comportamiento con audífonos. Registrar en `docs/TESTING.md`.
