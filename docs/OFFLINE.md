# Offline-first

## Modos
- **Online local**: la tablet alcanza el servidor por el Wi-Fi de la biblioteca (sin internet). Streaming con `Range`.
- **Offline absoluto**: sin red. Solo funciona lo descargado antes, si la licencia lo permite.

## Paquete y manifest
`GET /api/offline/manifest` → `OfflineManifest` (contrato en `packages/shared`):

```json
{
  "generatedAt": "2026-10-31T12:00:00.000Z",
  "version": "<hash o marca del conjunto>",
  "entries": [{
    "id": "…", "title": "Fábulas", "type": "BOOK", "format": "EPUB",
    "sha256": "3f1d9172…", "sizeBytes": 188293, "version": "<updatedAt del recurso>",
    "fileUrl": "/api/resources/…/file", "coverUrl": "/api/resources/…/cover?w=240",
    "licenseValidUntil": null
  }]
}
```

- Solo entran recursos con `canDownloadOffline`: publicados, licencia vigente, con archivo, `offlineAllowed = true` y `authorizedDevices > 0`.
- El cliente descarga solo entradas nuevas o con `version`/`sha256` distintos y elimina las que desaparecen del manifest (retiradas o con licencia vencida).

## Almacenamiento y límites
- Destino: Cache Storage/IndexedDB (PWA) o almacenamiento de la app (contenedor nativo, ADR-005). Solicitar `navigator.storage.persist()` y registrar si se concede.
- Antes de descargar: `navigator.storage.estimate()`; no superar el **80 %** de la cuota disponible y dejar **≥ 1 GB** libre en la tablet. Si no cabe: avisar y permitir elegir qué descargar.
- Presupuesto orientativo por tablet (a medir en la prueba física 6): EPUB 0,1–5 MB, PDF 1–50 MB, MP3 64 kbps ≈ 0,5 MB/min.

## Integridad
- Calcular SHA-256 del archivo descargado (Web Crypto `crypto.subtle.digest`) y compararlo con el manifest; si no coincide, descartar y reintentar (máx. 3) y mostrar error claro.
- Archivos parciales nunca se marcan como disponibles. Verificación también tras reiniciar si el índice local está incompleto.

## Sincronización idempotente
- El progreso (posición de lectura/audio, marcadores, favoritos) vive en el dispositivo; los eventos pendientes se encolan con un `eventId` único (UUID) por dispositivo anónimo.
- Al reconectar, se envían en lote; el servidor ignora `eventId` ya recibidos (reenvíos seguros). Los contadores de uso se guardan agregados por recurso y día, sin identidad.

## Política de conflictos
- **Progreso**: posición = **máxima** alcanzada; si se reinicia explícitamente, gana la **última escritura por dispositivo** (marca de tiempo local + `eventId`).
- **Marcadores/favoritos**: unión por dispositivo; borrados como lápidas con marca de tiempo (última escritura gana).
- **Catálogo y licencias**: el servidor siempre gana.

## Licencias sin conexión
- `licenseValidUntil` se guarda con cada entrada; el cliente oculta el recurso al vencer según el reloj local y lo borra en la siguiente sincronización. El reloj local puede manipularse: riesgo aceptado y mitigado con revalidación al reconectar.

## Advertencias Fire OS
- Silk/WebView pueden desalojar el almacenamiento con poco espacio o borrar datos al limpiar el navegador; la persistencia no está garantizada para PWA.
- Sin Google Play: no hay Play Services ni actualizaciones automáticas de WebView vía Play; verificar la versión de WebView del sistema.
- Todo lo anterior está **pendiente de validación física** (`docs/TESTING.md`).

## Contexto seguro en la red local (2026-11-01)
- Todo lo anterior (service worker, Cache Storage, `crypto.subtle` para el SHA-256, `storage.persist`) exige **contexto seguro**: `localhost` o `https://`. Desde `http://192.168.31.240:3100` las tablets no lo tienen y la descarga offline queda deshabilitada (la ficha lo indica).
- Solución adoptada (ADR-014): HTTPS local con CA propia (`sh scripts/make-local-certs.sh` + `docker compose --profile https up -d macondo-https` → `https://IP:3443`) y **app Android** (`apps/android/`, `docs/APP-ANDROID.md`) que confía en esa CA, por lo que dentro de la app la web obtiene contexto seguro y las descargas funcionan sin instalar nada en la tablet. Verificado en Chromium: `isSecureContext=true` y SW activo en `https://192.168.31.240:3443`.
- Lo que el APK **no** resuelve por sí solo: la persistencia real del almacenamiento del WebView en Fire OS (`storage.persist()`), el consumo de batería y la limpieza de caché del sistema; siguen **pendientes de validación física**. Si Fire OS desaloja el almacenamiento del WebView, la alternativa sería guardar los paquetes en el sistema de archivos de la app (fuera del WebView), opción no implementada.

## Taller de cuentos sin conexión (ADR-018)

- Generar un cuento requiere el servidor local (y, para el modo IA, internet en el servidor; sin internet funciona el modo plantilla).
- «Guardar en esta tablet» guarda el cuento completo (texto, preguntas, glosario) en localStorage (`macondo.cuentos.mios`, máximo 12); `/offline` → «Mis cuentos» y la portada del taller lo abren sin red (`/construye-tu-cuento?cuento=<id>`, ruta precacheada por el SW v5). El audio no se guarda localmente (se escucha en línea si existe).
