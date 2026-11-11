# CLAUDE.md — Macondo Digital

Biblioteca escolar interactiva (Biblioteca Macondo, Comfasucre). Grados 1.º–11.º. Tablets Fire HD 10, kiosco, TV, panel admin.
Especificación completa: `CLAUDE_CODE_MACONDO_DIGITAL.md`. Estado real: `docs/PROGRESS.md`. Backlog: `.agent/tasks.json`.

## Estructura
- `packages/shared` — contrato API (zod + tipos + reglas de licencia). **Fuente de verdad**; compilar con `npm run build:shared` tras cambios.
- `apps/api` — NestJS + Prisma + PostgreSQL. Puerto **4100**. Prefijo `/api`.
- `apps/web` — Next.js (App Router) + Tailwind. Puerto **3100**. Proxy `/api/*` → API.
- `infra/docker` — Postgres 16 en **127.0.0.1:5544** (contenedor `macondo_db`).
- `storage/` — archivos subidos (driver local). No versionado.
- `demo-content/` — EPUB/PDF/MP3 de dominio público con `SOURCES.md`.

## Identidad visual
- Guía: `branding/branding.md` (Comfasucre). Decisión: `docs/DECISIONS.md` ADR-008.
- `/admin` = perfil PQR con CSS originales en root layout propio `src/app/(admin)/layout.tsx` (sin Tailwind). Portal = paleta PQR con escalas infantiles (aprobado por el usuario). Licencia Velzon confirmada. `/kiosco` = perfil kiosco Digiturno. `/tv` = perfil sala.
- No modificar `branding/` ni los CSS copiados en `apps/web/public/brand/css/`.

## Despliegue
- Destino: **EasyPanel**. `docker-compose.yml` (raíz) + `apps/api/Dockerfile` + `apps/web/Dockerfile`. Guía: `docs/DEPLOY-EASYPANEL.md`.
- Desarrollo: acceso desde cualquier IP (`CORS_ORIGIN=*`, 0.0.0.0). Producción: restringir CORS, cambiar secretos, `SEED_ON_START=false`.

## Comandos
- `npm install` (npm 11 bloquea postinstall: si falta prisma/esbuild, `npm install-scripts approve <pkg>`)
- `npm run db:up` · `npm run build:shared` · `npm run dev:api` · `npm run dev:web`
- `npm run typecheck` · `npm run lint` · `npm test`

## Reglas no negociables
- Puertos 3000, 5433, 3307, 8000, 8080 pertenecen a OTROS proyectos del usuario: no usarlos ni tocar sus contenedores.
- Nunca marcar algo como probado sin ejecutarlo. Registrar evidencia en `docs/TESTING.md` / `docs/PROGRESS.md`.
- Sin DRM-stripping, sin contenido sin licencia verificada. Licencia de software ≠ licencia de contenidos.
- Sin datos reales de menores, credenciales ni tokens en repo/memoria. Estadísticas solo agregadas; sin rankings nominales.
- Retirar recursos = estado `RETIRED`, no borrado.
- Sin commits/push/despliegues externos sin autorización explícita del usuario.
- Pruebas físicas Fire HD 10: **pendiente de validación física** hasta que existan.
- Tras 3 intentos fallidos sobre un bloqueo: documentar y proponer alternativas.
