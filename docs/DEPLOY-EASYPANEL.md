# Despliegue en EasyPanel

Estado: imágenes Docker **construidas y probadas localmente** (2026-10-31) con `docker compose up -d --build`.
No se ha desplegado todavía en un servidor EasyPanel real.

## Piezas

| Servicio | Origen | Puerto interno | Público | Persistencia |
|---|---|---|---|---|
| `macondo-db` | Postgres 16 (servicio Postgres de EasyPanel o imagen `postgres:16-alpine`) | 5432 | **No** | volumen de datos |
| `macondo-api` | `apps/api/Dockerfile` (contexto: raíz del repo) | 4100 | **No** (solo red interna) | volumen en `/app/storage` |
| `macondo-web` | `apps/web/Dockerfile` (contexto: raíz del repo) | 3100 | **Sí** (dominio/IP) | — |

El navegador solo habla con `macondo-web`; Next reenvía `/api/*` a `macondo-api` por la red interna.
Por eso la API y la base de datos no necesitan exponerse.

Al arrancar, la API ejecuta `prisma migrate deploy` y, si `SEED_ON_START=true`, el seed idempotente
(admin, bibliotecaria demo y los 8 recursos de `demo-content/`, incluidos en la imagen).

## Dominio de producción: `macondo.comfasucre.co`

El dominio ya está registrado (confirmado por el usuario el 2026-11-01). Pasos:

1. **DNS:** crear un registro `A` de `macondo.comfasucre.co` apuntando a la IP pública del servidor EasyPanel
   (y, si se desea, `AAAA` para IPv6). Esperar la propagación (minutos a horas).
2. **EasyPanel → servicio `macondo-web` → Domains:** añadir `macondo.comfasucre.co`, puerto `3100`, HTTPS activado
   (certificado Let's Encrypt automático). No exponer dominio para `macondo-api` ni la base de datos.
3. **Variables:** en `macondo-api` poner `CORS_ORIGIN=https://macondo.comfasucre.co`; en `macondo-web`, opcionalmente
   `PUBLIC_ORIGIN=https://macondo.comfasucre.co` como *build arg* (`NEXT_PUBLIC_PUBLIC_ORIGIN`) — por defecto los QR ya
   usan el origen de la página, que será el dominio.
4. **Dispositivos:** la app Android (tablets y kiosco) trae por defecto `https://macondo.comfasucre.co`; el TV Windows
   abre `https://macondo.comfasucre.co/tv`. Con el dominio público **no hace falta** el certificado propio de la red local;
   `https://192.168.31.240:3443` queda solo como respaldo cuando la biblioteca no tenga internet.
5. **Comprobar:** `https://macondo.comfasucre.co/api/health`, `/catalogo` (570 recursos tras cargar el contenido), `/kiosco`, `/tv`, `/admin`.

## Opción A — Servicio "Compose"

1. Subir el repositorio a GitHub (privado).
2. En EasyPanel: **Project → + Service → Compose** → origen GitHub → archivo `docker-compose.yml` (raíz).
3. En **Environment** definir al menos (ver tabla de variables más abajo): `JWT_SECRET`, `POSTGRES_PASSWORD`.
4. **Deploy**. En **Domains**, apuntar el dominio al servicio `macondo-web`, puerto `3100`.

## Opción B — Servicios "App" separados

1. **Postgres**: + Service → Postgres. Nombre `macondo-db`, base `macondo`. Copiar la *Internal Connection URL*.
2. **API**: + Service → App, nombre `macondo-api`.
   - Source: GitHub (repo), Build: **Dockerfile**, File: `apps/api/Dockerfile`, Build path: `/`.
   - Environment: `DATABASE_URL` (URL interna del paso 1 + `?schema=public`), `JWT_SECRET`, `CORS_ORIGIN`, `SEED_ON_START`, `SEED_*`.
   - Mounts: Volume → `/app/storage`.
   - Sin dominio público.
3. **Web**: + Service → App, nombre `macondo-web`.
   - Build: **Dockerfile**, File: `apps/web/Dockerfile`, Build path: `/`.
   - Environment: `API_INTERNAL_URL=http://<proyecto>_macondo-api:4100`, `PORT=3100`.
   - `API_INTERNAL_URL` se lee **en ejecución** (proxy `src/app/api/[...path]/route.ts`); basta definirla en Environment.
   - Domains: dominio → puerto `3100` (HTTPS automático de EasyPanel).

## Opción C — RECOMENDADA: un solo servicio con el ZIP del código (imagen todo en uno)

El paquete `entregables/macondo-digital-<fecha>.zip` trae un **`Dockerfile` en la raíz** que construye la API y la web en
**una sola imagen** (la web reenvía `/api/*` a la API dentro del mismo contenedor). EasyPanel lo detecta
automáticamente al subir el ZIP, así que no hay que configurar nada del build. Si en vez del Dockerfile EasyPanel
intenta usar *Nixpacks* y falla (`nixpacks build … exit code 1`), el ZIP es antiguo: usa el que contiene `Dockerfile`
en la raíz o, en el servicio, pestaña **Build → Dockerfile** con ruta `Dockerfile`.

1. **Postgres:** Project → + Service → **Postgres** (nombre `macondo-db`, base `macondo`). Copiar la *Internal Connection URL*.
2. **App:** + Service → **App** (nombre `macondo`) → *Source: Upload* → subir el ZIP → Deploy.
3. **Environment** del servicio `macondo` (mínimo):

   ```env
   DATABASE_URL=<URL interna de Postgres>?schema=public
   JWT_SECRET=<openssl rand -base64 48>
   CORS_ORIGIN=https://macondo.comfasucre.co
   SEED_ON_START=true            # solo la primera vez; luego false
   SEED_ADMIN_EMAIL=admin@macondo.local
   SEED_ADMIN_PASSWORD=<clave inicial fuerte>
   MAX_UPLOAD_MB=200
   ```
   No definir `PORT` ni `API_PORT` (la imagen ya fija web 3100 y API interna 4100). Tampoco hace falta nada para la
   **narración sintética** (ADR-017): la imagen trae Piper y la voz `es_ES-davefx-medium` y fija `TTS_*`; se comprueba en
   el panel (Resumen → «Narración: Piper davefx · disponible») o con `GET /api/admin/tts/estado` con sesión de administración.
   Para el **Taller de cuentos** (ADR-018) añadir `DEEPSEEK_API_KEY` y `DEEPSEEK_MODEL=deepseek-chat`; sin ellas funciona en modo plantilla.

   **No copiar `.env.example` entero** al Environment. En concreto, con la imagen todo en uno:
   - `STORAGE_DIR` debe ser `/app/storage` (o no definirse). El valor local `../../storage` solo sirve en desarrollo.
   - `API_INTERNAL_URL`, `WEB_PORT`, `ALLOWED_DEV_ORIGINS` y `LAN_HOST` se ignoran: no hace falta ponerlos.
   - Sin `SEED_ON_START=true` en el primer arranque **no existe ningún usuario** y no se puede entrar a `/admin`.
   - **EasyPanel pasa todas las variables como `--build-arg` y las imprime completas en el log del build**
     (`DATABASE_URL` con contraseña, `JWT_SECRET`, `DEEPSEEK_API_KEY`). El `Dockerfile` no declara esos `ARG`, así que no
     quedan dentro de la imagen, pero sí en el log: no compartir ese log y, si se compartió, rotar la clave de DeepSeek
     (platform.deepseek.com → API keys) y el `JWT_SECRET`.
   - **Source: GitHub** (`jadaheto/macondo`, rama `main`, Build → Dockerfile `Dockerfile`) equivale a subir el ZIP; cada
     *push* permite redesplegar con un clic.
4. **Mounts:** Volume → `/app/storage` (archivos subidos, portadas, galerías, miniaturas).
5. **Domains:** `macondo.comfasucre.co` → puerto **3100**, HTTPS activado.
6. Deploy → revisar *Logs*: `[macondo] Aplicando migraciones…`, `API lista`, `Iniciando web…`.
7. **Cargar el contenido real** (siguiente sección): el contenedor de la app se llama como el servicio; el volumen es el montado en `/app/storage`.

Verificado localmente (2026-11-02): `docker build .` → arranque con un Postgres externo en 6 s (migraciones + seed), `/api/health` ok, `/`, `/catalogo`, `/kiosco`, `/tv`, `/admin`, `/instalar` responden 200, login de administración correcto, *healthcheck* `healthy`, procesos como usuario `node`. Con `SEED_ON_START=true` es **obligatorio** definir `SEED_ADMIN_PASSWORD` (mínimo 8 caracteres): si falta, el contenedor se detiene y el log lo indica.

Las opciones A/B (compose o dos servicios con `apps/api/Dockerfile` y `apps/web/Dockerfile`) siguen disponibles para quien prefiera separar API y web.

## Cargar el contenido real (590 recursos, 100 retos)

El contenido no viaja en el ZIP del código (pesa ≈4,4 GB). Se entrega aparte en `entregables/contenido-<fecha>/`
(generado con `sh scripts/export-content.sh`):

| Archivo | Qué contiene |
|---|---|
| `macondo-db.dump` | Base de datos completa: recursos, licencias, retos, programación de TV, usuarios y auditoría |
| `macondo-storage.tar` | Archivos subidos: EPUB/PDF/MP3, portadas, galerías y miniaturas |
| `MANIFIESTO.txt` | Conteos y SHA-256 para verificar la copia |
| `restore-content.sh` | Script de restauración |

**Restaurar en el servidor EasyPanel (por SSH):**

```bash
# 1. Copiar la carpeta del paquete al servidor (scp/rsync) y entrar en ella
# 2. Identificar contenedor de Postgres y volumen de /app/storage del proyecto
docker ps --format '{{.Names}}' | grep macondo
docker volume ls --format '{{.Name}}' | grep macondo
# 3. Detener la API, restaurar y volver a arrancar
docker stop <contenedor_macondo-api>
sh restore-content.sh <contenedor_macondo-db> <volumen_storage> .
docker start <contenedor_macondo-api>
```

Comprueba luego `https://<dominio>/api/health` y que `/catalogo` muestre 570 recursos.
El dump incluye los usuarios `admin@macondo.local` y `bibliotecaria@macondo.local` con las claves de desarrollo:
**cámbialas desde `/admin` tras el primer acceso** y pon `SEED_ON_START=false`.

**Alternativa sin SSH:** reimportar desde los manifiestos con el importador apuntando al dominio
(`node scripts/import-catalog.mjs --api https://<dominio> --manifest catalogo-dp/<manifiesto>.json --publish`),
que sube los archivos por la API. Requiere tener `catalogo-dp/` completo en el equipo desde el que se ejecuta
y no reproduce las decisiones de retiro (ver `catalogo-dp/RETIRADOS.md`).

## Variables de entorno

| Variable | Servicio | Desarrollo (ahora) | Producción |
|---|---|---|---|
| `CORS_ORIGIN` | api | `*` (cualquier IP/origen) | `https://macondo.comfasucre.co` |
| `JWT_SECRET` | api | valor demo | `openssl rand -base64 48` (≥32 caracteres) |
| `POSTGRES_PASSWORD` | db | `macondo_dev` | clave fuerte |
| `SEED_ON_START` | api | `true` | `true` solo en la primera instalación; luego `false` |
| `SEED_ADMIN_PASSWORD` | api | demo | clave fuerte, cambiar tras el primer acceso |
| `PUBLIC_ORIGIN` → `NEXT_PUBLIC_PUBLIC_ORIGIN` | web (build, opcional) | vacío | `https://macondo.comfasucre.co` |
| `API_INTERNAL_URL` | web (ejecución) | `http://macondo-api:4100` | `http://<proyecto>_macondo-api:4100` |
| `MAX_UPLOAD_MB` | api | 200 | según contenidos |
| `DEEPSEEK_API_KEY` | api | vacío (modo plantilla) | clave de DeepSeek para el Taller de cuentos (ADR-018); nunca se registra |
| `DEEPSEEK_MODEL` | api | `deepseek-chat` | igual |
| `CUENTOS_BANDAS` | api | `1-3,4-5` | bandas con taller |
| `CUENTOS_LIMITE_POR_HORA` / `CUENTOS_LIMITE_GLOBAL_POR_HORA` | api | 3 / 60 | según uso |
| `CUENTOS_ENABLED` / `CUENTOS_AUDIO` / `CUENTOS_TIMEOUT_MS` | api | true / true / 60000 | opcionales |
| `ALLOWED_DEV_ORIGINS` | web (solo `next dev`) | rangos LAN | no aplica |

### Acceso desde varias IP

- **Ahora (desarrollo):** la web escucha en `0.0.0.0` y el compose publica `0.0.0.0:3100`. Cualquier equipo de la
  red (tablets, kiosco, TV, PCs) entra por `http://<IP-del-servidor>:3100`. La API refleja cualquier origen (`CORS_ORIGIN=*`).
  `next dev` también acepta orígenes de la LAN (`ALLOWED_DEV_ORIGINS`).
- **Antes de producción:** fijar `CORS_ORIGIN` a los dominios reales, servir por HTTPS con el dominio de EasyPanel y
  cambiar todas las claves demo. Ver `docs/SECURITY.md`.

## Verificación hecha (local, 2026-10-31)

`docker compose build` ✅ · `docker compose up -d` ✅ · desde la IP LAN `192.168.31.240:3100`:
health `{"status":"ok","db":"ok"}`; catálogo 8 recursos; `/`, `/catalogo`, `/kiosco`, `/tv`, `/admin` → 200;
MP3 `Range` → 206 `audio/mpeg`; CORS refleja un origen ajeno; Chromium: EPUB, PDF y MP3 abren sin errores;
admin inicia sesión y muestra KPI por tipo frente a las metas 300/100/50/20/100 (total 570) y retos lectores frente a 100 (metas del 2026-10-31; antes 229).

## App Android (APK) y HTTPS

- Con el dominio público de EasyPanel (HTTPS automático con certificado válido) **la app Android no necesita la CA local**: basta instalar el APK y escribir `https://<dominio>` en Configuración (o cambiar `DEFAULT_SERVER_URL` en `apps/android/app/build.gradle.kts` antes de compilar). La página `/instalar` del propio dominio ofrece el QR y los pasos.
- La CA local (`infra/certs/`, perfil `https` de `docker-compose.yml`, puerto 3443) solo hace falta cuando el servidor se sirve por IP en la red de la biblioteca sin dominio. En EasyPanel **no** activar el perfil `https` (el proxy de EasyPanel ya termina TLS).
- Publicar el APK: copiar `macondo-digital.apk`, `SHA256SUMS.txt` y `macondo-digital.json` en `apps/web/public/descargas/` antes de construir la imagen web (ver `apps/android/README.md`).

## Operación

- Logs: pestaña *Logs* de cada servicio (`[macondo-api] Aplicando migraciones…`).
- Respaldo DB: *Backups* del servicio Postgres de EasyPanel, o `pg_dump` (ver README).
- Respaldo archivos: volumen `/app/storage` de `macondo-api`.
- Actualizar: push a GitHub → *Deploy* (o auto-deploy). Las migraciones se aplican solas al arrancar.
