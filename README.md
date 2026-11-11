# Macondo Digital

Biblioteca escolar interactiva de la **Biblioteca Macondo (Comfasucre, Colombia)** para estudiantes de 1.º a 11.º. Sirve un catálogo multimedia (libros EPUB/PDF, audiolibros, audiobiografías, audioresúmenes y galerías) a 30 tablets Amazon Fire HD 10, un kiosco táctil, un televisor de señalización y computadores de bibliotecarios, en una red local.

> Estado real del proyecto: [`docs/PROGRESS.md`](docs/PROGRESS.md). Metas de capacidad (570 recursos: 300 libros, 100 audiolibros, 50 audiobiografías, 20 audioresúmenes, 100 galerías; más 100 retos lectores — fijadas por el usuario el 2026-10-31; antes 229) ≠ archivos adquiridos. La compatibilidad con Fire OS está **pendiente de validación física**.

## Arquitectura

```text
apps/web        Next.js (App Router) + Tailwind — estudiantes, /kiosco, /tv, /admin   → :3100
apps/api        NestJS + Prisma — API REST con prefijo /api                           → :4100
packages/shared Contrato API (zod + tipos + reglas de licencia) — fuente de verdad
infra/docker    PostgreSQL 16 (contenedor macondo_db)                                  → 127.0.0.1:5544
storage/        Archivos subidos (driver local, no versionado)
demo-content/   EPUB/PDF/MP3 de dominio público + manifest.json + SOURCES.md
docs/  .agent/  Documentación y harness del agente
```

El navegador habla solo con la web (`:3100`); Next.js reenvía `/api/*` a la API (`API_INTERNAL_URL`). Detalle y diagramas: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Requisitos

- Node.js ≥ 20 (probado con 26.3) y **npm** ≥ 10 (probado con 11.18). Se usa npm workspaces, **no pnpm** (ver ADR-001).
- Docker (para PostgreSQL). Probado con Docker 29.3.
- Puertos libres: **3100** (web), **4100** (API), **5544** (Postgres). No usar 3000, 5433, 3307, 8000 ni 8080: pertenecen a otros servicios del equipo.

## Instalación

```bash
cp .env.example .env            # ajustar JWT_SECRET y la contraseña semilla
npm install
# npm 11 bloquea scripts postinstall no aprobados. Si faltan binarios de prisma/esbuild/swc:
npm install-scripts approve prisma @prisma/client @prisma/engines esbuild @swc/core
npm run db:up                   # levanta macondo_db en 127.0.0.1:5544
npm run build:shared            # compila el contrato compartido
npm run prisma:migrate -w @macondo/api   # aplica migraciones (desarrollo)
npm run seed -w @macondo/api             # admin semilla + contenido de demo-content/manifest.json
```

## Variables de entorno (`.env`)

| Variable | Ejemplo | Uso |
|---|---|---|
| `DATABASE_URL` | `postgresql://macondo:macondo_dev@localhost:5544/macondo?schema=public` | Conexión Prisma |
| `API_PORT` | `4100` | Puerto de la API |
| `JWT_SECRET` | ≥ 32 caracteres aleatorios | Firma de tokens del personal |
| `STORAGE_DRIVER` / `STORAGE_DIR` | `local` / `../../storage` | Proveedor de archivos (S3 previsto, ADR-004) |
| `MAX_UPLOAD_MB` | `200` | Límite de subida |
| `CORS_ORIGIN` | `http://localhost:3100` | Origen permitido |
| `WEB_PORT` / `API_INTERNAL_URL` | `3100` / `http://localhost:4100` | Web y proxy hacia la API |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | solo desarrollo | Usuario administrador inicial |
| `DEMO_CONTENT_DIR` (opcional) | `demo-content` | Carpeta que lee el seed |

Nunca versionar `.env` ni credenciales reales.

## Comandos de desarrollo

```bash
npm run dev:api      # API en http://localhost:4100/api (watch)
npm run dev:web      # Web en http://localhost:3100
npm run typecheck    # tsc en todos los workspaces
npm run lint
npm test             # pruebas unitarias/integración de todos los workspaces
npm run e2e -w @macondo/web   # Playwright (requiere API y web arriba)
npm run db:down      # detiene Postgres (los datos persisten en el volumen macondo_pg)
```

## Docker y migraciones

- `infra/docker/docker-compose.yml` define solo la base de datos (`macondo_db`, volumen `macondo_pg`, healthcheck `pg_isready`). API y web corren con Node en el host durante la fase 1.
- Migraciones: `npm run prisma:migrate -w @macondo/api` (desarrollo) · `npm run db:deploy -w @macondo/api` (aplicar en el servidor local sin generar nuevas).

## Datos de prueba

`npm run seed -w @macondo/api` crea el administrador semilla y carga `demo-content/manifest.json`: 8 recursos legales (3 EPUB, 1 PDF, 4 MP3) con licencia, portada y SHA-256. Fuentes y base legal: [`demo-content/SOURCES.md`](demo-content/SOURCES.md). No hay datos de estudiantes.

## API (resumen, prefijo `/api`)

| Método y ruta | Acceso | Descripción |
|---|---|---|
| `GET /health` | público | Estado |
| `POST /auth/login` · `GET /auth/me` | público · personal | JWT de corta duración |
| `GET /resources?q&type&grade&category&page&pageSize` | público | Catálogo paginado (solo `PUBLISHED`) |
| `GET /resources/:id` · `/:id/file` · `/:id/cover` | público | Ficha; archivo con `Range` (403 si la licencia no está vigente); portada |
| `GET /offline/manifest` | público | Paquete offline con versión y SHA-256 |
| `GET /tv/schedule` | público | Diapositivas de TV vigentes y ordenadas |
| `GET/POST /admin/resources` · `PATCH/DELETE /admin/resources/:id` | ADMIN, LIBRARIAN | `DELETE` = retirar (`RETIRED`), no borra |
| `POST /admin/resources/:id/status` · `/file` · `/cover` | ADMIN, LIBRARIAN | Estado; subida multipart validada |
| `GET/POST /admin/tv/slides` · `PATCH/DELETE /admin/tv/slides/:id` | ADMIN, LIBRARIAN | Programación de TV |
| `GET /admin/stats` · `GET /admin/audit` | personal · ADMIN | Agregados; auditoría |

Fuente de verdad: `API_ROUTES` en `packages/shared/src/index.ts`.

## Pruebas

Estrategia, matriz contra los criterios del §9 de la especificación y evidencia: [`docs/TESTING.md`](docs/TESTING.md). Solo se registra como probado lo que se ejecutó.

## Despliegue (solo local)

Un servidor en la red de la biblioteca (sin depender de internet): Postgres por Docker, `npm run build` y `npm run start -w @macondo/api` / `-w @macondo/web`, con un proxy inverso opcional (TLS local). No hay despliegue en la nube ni externo autorizado.

## Operación

- Altas, publicación y retiro de recursos, licencias y programación de TV desde `/admin`.
- Revisar `GET /admin/audit` y `GET /api/health` periódicamente.
- Antes de publicar un recurso: completar todos los campos de licencia ([`docs/CONTENT-LICENSING.md`](docs/CONTENT-LICENSING.md)).

## Respaldo y restauración

```bash
# Respaldo de la base de datos
docker exec macondo_db pg_dump -U macondo -d macondo -Fc > backup/macondo_$(date +%F).dump
# Respaldo de archivos
tar -czf backup/storage_$(date +%F).tgz storage/

# Restauración (sobrescribe objetos existentes)
docker exec -i macondo_db pg_restore -U macondo -d macondo --clean --if-exists < backup/macondo_AAAA-MM-DD.dump
tar -xzf backup/storage_AAAA-MM-DD.tgz
```

Guardar copias fuera del servidor, cifradas, y probar la restauración periódicamente (ver [`docs/SECURITY.md`](docs/SECURITY.md)).

## Funcionamiento offline

Se distinguen **online local** (tablet conectada al Wi-Fi de la biblioteca, sin internet) y **offline absoluto** (tablet desconectada). El modo offline usa el manifest `/api/offline/manifest`, verifica SHA-256 y respeta `offlineAllowed` y la vigencia de cada licencia. Detalle: [`docs/OFFLINE.md`](docs/OFFLINE.md).

## Hardware de la biblioteca (tablets, tótem 32", TV, PCs)

Inventario, qué corre en cada equipo y guía de puesta en marcha por dispositivo: [`docs/HARDWARE.md`](docs/HARDWARE.md). El equipo de sala (Windows 11) se instala con el paquete [`infra/tv-windows/`](infra/tv-windows/LEEME-TV-Windows.md); el kiosco de 32" usa `/kiosco?escala=1.25–1.5`.

## Fire OS (Fire HD 10)

Estrategia PWA primero (Silk o un navegador instalado sin Google Play); si el almacenamiento persistente no se mantiene, contenedor nativo (WebView/Capacitor, APK instalada por *sideload*). Las 7 pruebas obligatorias están en [`docs/TESTING.md`](docs/TESTING.md): **pendiente de validación física**.

## Licencias

- Contenidos: solo con autorización explícita (dispositivos, offline, vigencia, territorio). Sin eliminar DRM; comprar un ebook Kindle no da derecho a redistribuirlo.
- Licencia del software ≠ licencia de los contenidos.

## Solución de problemas

| Síntoma | Causa probable / solución |
|---|---|
| `prisma: command not found` o binarios faltantes tras `npm install` | npm 11 bloqueó postinstall: `npm install-scripts approve <paquete>` y reinstalar |
| `P1001 Can't reach database` | `npm run db:up`; verificar `docker ps` y el puerto 5544 |
| `EADDRINUSE :3100/:4100` | Otro proceso usa el puerto: `lsof -i :3100` |
| La web no ve la API | Revisar `API_INTERNAL_URL` y que `npm run dev:api` esté arriba |
| `Cannot find module '@macondo/shared'` | `npm run build:shared` |
| El recurso devuelve 403 al abrir | Licencia no vigente o recurso no publicado (comportamiento esperado) |
| PDF no se muestra | Falta el worker de PDF.js: `npm run copy-pdf-worker -w @macondo/web` |

## Recorrido rápido

- **`/`** — inicio por bandas de grado (1–3, 4–5, 6–8, 9–11).
- **`/catalogo`** — búsqueda y filtros por grado, tipo y categoría; ficha; lector EPUB/PDF; reproductor MP3.
- **`/kiosco`** — pantalla completa táctil, sesión anónima, reinicio por inactividad, QR solo hacia contenido autorizado.
- **`/tv`** — señalización sin sonido según la programación vigente.
- **`/admin`** — inicio de sesión del personal, recursos, licencias, TV, estadísticas agregadas y auditoría.

## Despliegue con Docker / EasyPanel

```bash
docker compose up -d --build   # pila completa: db + api + web → http://<IP>:3100
```

Guía completa, variables y acceso desde varias IP: [`docs/DEPLOY-EASYPANEL.md`](docs/DEPLOY-EASYPANEL.md).
