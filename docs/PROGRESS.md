# Progreso — estado real

Última actualización: 2026-11-05 (narración sintética en el servidor, ADR-017). Solo se marca como hecho lo verificado.

## Hecho (verificado)
- **API v1** (`apps/api`): NestJS 11 + Prisma 6; auth JWT + roles, catálogo, archivos con Range, subidas validadas por bytes mágicos, manifest offline, TV, stats, auditoría, seed idempotente. 36/36 pruebas.
- **Web v1** (`apps/web`): Next 15; inicio por grados, catálogo, ficha, lectores EPUB/PDF, reproductor MP3, retos, kiosco, TV, admin, PWA. 47/47 unitarias, 20/20 E2E.
- **Primera versión ejecutable (meta §12) cumplida**: catalogar y abrir EPUB, PDF y MP3 legales de extremo a extremo, verificado en Chromium con API real.
- **Fundamentos**: monorepo npm workspaces, `tsconfig.base.json`, `.env.example`, `infra/docker/docker-compose.yml` (Postgres 16, `127.0.0.1:5544`, `macondo_db`), `CLAUDE.md`.
- **Contrato compartido** `packages/shared`: esquemas zod, tipos, `API_ROUTES`, reglas de licencia. `npx vitest run` → **8/8 pruebas pasan** (ejecutado 2026-10-31).
- **Contenido de demostración legal** (`demo-content/`): 3 EPUB, 1 PDF, 4 MP3 (2 LibriVox + audiobiografía y audioresumen propios con voz sintética) y 8 portadas propias. Bytes mágicos, tamaño y SHA-256 verificados; los 8 registros de `manifest.json` validan contra `ResourceInputSchema`. Fuentes: `demo-content/SOURCES.md`.
- **Documentación y harness**: `README.md`, `docs/*.md`, `.agent/*`.

- **Identidad corporativa Comfasucre** (ADR-008): admin con CSS PQR originales; portal (propuesta), kiosco y TV con perfiles de `branding.md`. Tests web 50/50, E2E 22/22 (2026-10-31).

- **Docker/EasyPanel** (ADR-009): imágenes api/web construidas; pila completa probada desde IP LAN (health, catálogo, Range 206, CORS, lectores y admin en Chromium). Licencia Velzon confirmada y estilo aprobado por el usuario. Icono PWA 512 px.

- **Catálogo ampliado (2026-10-31):** 401 recursos publicados — libros 283 (incl. 26 cuentos propios), audiolibros 58, audiobiografías 23, audioresúmenes 18, galerías 19; 70 retos activos. 126 recursos en borrador para revisión humana (`catalogo-dp/REVISION-PENDIENTE.md`). Todas las metas de capacidad cumplidas o superadas en contenido cargado.

- **Pase funcional final (2026-11-01, ADR-013):** miniaturas de portada en el servidor (`sharp`, `GET /api/resources/:id/cover?w=240|480`, WebP cacheado en `storage/thumbs/`, ETag/304; página 1 del catálogo 8,9 MB → 163 KB, −98,2 %); pestaña **Retos** en `/admin` (filtros, activar/desactivar, Importar JSON con validación local y resumen); **acciones en lote** en Recursos (publicar/retirar seleccionados con confirmación, avance y errores; una llamada auditada por recurso). Verificado: typecheck/lint OK; shared 14/14 · api 53/53 · web 76/76; E2E simulada 30/30; **E2E stack real 16/16**; stack Docker reconstruido con conteos intactos (300/100/50/20/100, 100 retos activos). Hallazgo de contenido pendiente: portada ausente en disco del recurso `cmvx802p10025oc01deejrfby` (ver `docs/TESTING.md`).

- **App Android (APK) y HTTPS local (2026-11-01, ADR-014):** `entregables/macondo-digital-1.0.0.apk` firmado; servicio `macondo-https` (Caddy, :3443) con CA propia; página `/instalar`. Resuelve el bloqueo de contexto seguro en la LAN. **No probado en tablet real.**
- **Repaso final (2026-11-01, ADR-013):** miniaturas WebP de portadas (catálogo −98 % bytes), pestaña Retos y acciones en lote en admin; suite real 16/16.
- **Entregables:** `entregables/` → ZIP de código para EasyPanel, paquete de contenido (dump + storage), APK + firma, manual HTML.

- **Cambio de contraseña en el panel + arreglo de Auditoría (2026-11-01):** endpoint `POST /api/auth/password` auditado; diálogo «Cambiar contraseña» en admin; la columna Usuario de Auditoría muestra «Nombre (correo)».

- **Hardware real (2026-11-01, ADR-015):** `/kiosco` para el tótem Android de 32" (`?escala=1|1.25|1.5|1.75` con CSS `zoom` persistido, maquetación vertical 1080×1920 / 1200×1920 y horizontal 1920×1080 por tamaño efectivo, objetivos ≥56/72 px, aviso de inactividad grande, panel oculto de configuración por pulsación larga sin PIN); `/tv` con `?animaciones=0` y portada que llena el panel en 4K; paquete `infra/tv-windows/` (instalador/desinstalador PowerShell, inicio manual, guía) para el Dell OptiPlex 3000 con Edge kiosco; `/instalar` con el dominio `macondo.comfasucre.co` como principal; `docs/HARDWARE.md`. Verificado: typecheck/lint OK; web 81/81; E2E simulada 36/36; **E2E real 17/17**; barrido kiosco/TV 78/78 en build local y en el stack real; scripts PowerShell sin errores de sintaxis (pwsh 7.4.2 en Docker). **Nada ejecutado en el hardware real**; incógnitas (marca/Android/orientación del tótem, resolución del televisor) en `docs/HARDWARE.md`.

- **Narración sintética en el servidor (2026-11-05, ADR-017):** Piper `es_ES-davefx-medium` (elegida por el usuario tras escuchar las muestras; datos CC0; motor GPL-3 como proceso aparte en `/opt/piper-venv`) + `lame` en las dos imágenes Docker (voz descargada en el build con SHA-256 verificado; +258 MB de capas por imagen). `TtsService` (cola de 2, tiempo máximo, 40 000 caracteres, trozos ≤ 4 000), `GET /api/admin/tts/estado`, `POST /api/admin/resources/:id/narrar` (reemplaza el MP3, acredita la voz, actualiza `licenseName` solo si citaba una voz sintética, audita `RESOURCE_NARRATE`), botón «Regrabar con la voz de la biblioteca» en el formulario y línea de estado en el Resumen. Verificado: typecheck/lint OK; shared 17/17 · api 71/71 (+1 integración real ejecutada aparte) · web 85/85; ambas imágenes construidas; en vivo (3201): estado ok, narración de 296 caracteres en 2,85 s → MP3 de 18 s servido con Range 206. Sin Piper (desarrollo local) la API responde 503 «Narración no disponible». La pila `compose` en marcha no se reconstruyó (pendiente del líder).

- **Imagen todo en uno para EasyPanel (2026-11-02, ADR-016):** `Dockerfile` raíz + `start-all.sh`; verificada localmente (arranque 6 s, health, páginas, login, healthcheck). Resuelve el fallo de Nixpacks al subir el ZIP.

## En curso
- Offline real (service worker + descarga verificada por SHA-256): implementado, **no probado en navegador real** aún.
- Contrato: añadir a `packages/shared` tipos de stats/audit, `ResourcePatchSchema`, reglas de imagen y rutas extra que la API ya expone.

## Taller de cuentos «Construye tu cuento» (2026-11-05, ADR-018)
- Implementado y verificado en vivo: `/construye-tu-cuento` (bandas 1-3 y 4-5; módulo en el inicio solo para primaria), API `cuentos` con DeepSeek detrás de `LlmProvider`, controles de contenido, reintento y modo plantilla propio, narración automática, cola de revisión en el panel (pestaña «Taller de cuentos» + KPI), aprobación que crea libro EPUB + audiolibro en el catálogo. Evidencia en `docs/TESTING.md` (generación real: modo ia, 710 ms, 917/855 tokens, audio 81 s; plantilla forzada; aprobación; limpieza con conteos 300/100/50/20/100).
- Docker: `DEEPSEEK_*` y `CUENTOS_*` en `docker-compose.yml`, `dns` público para `macondo-api` (solo necesario donde el DNS bloquea `api.deepseek.com`), `fonts-dejavu-core` en las imágenes.

## Pendiente / bloqueos
- Taller de cuentos: revisión pedagógica de las 64 plantillas y de una muestra mayor de cuentos de IA; decidir si la cola de revisión avisa a la bibliotecaria (correo/TV); limpieza periódica de cuentos rechazados antiguos (hoy se conservan); acento de la voz (España) para cuentos infantiles.
- Despliegue real en EasyPanel (imágenes probadas localmente; falta servidor y repositorio remoto).
- Antes de producción: restringir `CORS_ORIGIN`, cambiar secretos y `SEED_ON_START=false`.
- Pruebas físicas Fire HD 10, tótem Android 32" y mini PC de TV: **pendiente de validación física** (no hay hardware disponible en la sesión; ver `docs/HARDWARE.md`).
- Galería interactiva de demostración: sin imágenes con licencia verificada todavía.
- Voz sintética: ahora se regraba desde el panel con Piper `es_ES-davefx-medium` (ADR-017); la narración humana con cesión de derechos sigue pendiente para producción. Regrabar los recursos existentes narrados con `carlfm`/macOS es una tarea de contenido pendiente (un clic por recurso, auditado).
- Sin commit Git aún (no autorizado).

---

## Resultados de la iteración (a completar por el agente líder)

<!-- LEAD: completar con comandos ejecutados y salida real. No inventar. -->

| Verificación | Comando | Resultado | Fecha |
|---|---|---|---|
| Typecheck | `npm run typecheck` | sin errores (shared, api, web) | 2026-10-31 |
| Lint | `npm run lint` | sin errores (web usa `tsc`; ESLint no instalado) | 2026-10-31 |
| Pruebas | `npm test` | shared 8/8 · api 36/36 · web 47/47 | 2026-10-31 |
| Migración + seed | `npm run prisma -w @macondo/api -- migrate dev` · `npm run seed -w @macondo/api` | init aplicada; 8 recursos publicados importados | 2026-10-31 |
| API arriba | `curl localhost:3100/api/health` (vía proxy) | `{"status":"ok","db":"ok"}` | 2026-10-31 |
| Web / catálogo | `/catalogo` en Chromium | 8 recursos con portadas; filtro grade=1 → 1 resultado | 2026-10-31 |
| Abrir EPUB, PDF, MP3 | Playwright ad hoc contra API real | EPUB texto «Azul... Rubén Darío»; PDF canvas 630×892; MP3 reproduce y salta; 0 errores JS | 2026-10-31 |
| Flujo admin | curl vía :3100 | 401 sin token; subir PDF 201; PDF falso 415; publicar → visible; retirar → oculto | 2026-10-31 |
| E2E | `cd apps/web && npx playwright test` | 20/20 (API simulada; reportado por agente web, no re-ejecutado por el líder) | 2026-10-31 |

Notas del líder:

- Las E2E de Playwright simulan `/api`; la verificación con API real se hizo con un script ad hoc (no versionado). Siguiente paso: convertirlo en suite E2E versionada.
- Fire HD 10: **pendiente de validación física**.
