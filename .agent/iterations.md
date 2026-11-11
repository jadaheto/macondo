# Historial de iteraciones

## Iteración 1 — 2026-10-31
**Objetivo**: fundamentos + primera versión ejecutable capaz de catalogar y abrir un EPUB, un PDF y un MP3 legales.

- Fundamentos (líder): monorepo npm, contrato `packages/shared` con 8 pruebas unitarias (8/8 pasan), docker-compose Postgres 5544, `CLAUDE.md`.
- Contenido y documentación (agente de licencias):
  - Descargados de Project Gutenberg (3 archivos directos, sin rastreo): *Fábulas* (Samaniego), *La Edad de Oro* (Martí), *Azul...* (Darío). Se retiraron portadas escaneadas de ilustradores no verificados.
  - Descargados de archive.org/LibriVox: "Las medias de los flamencos" (Quiroga) y "Los zapaticos de rosa" (Martí).
  - Generados: PDF de Pombo (escrito a mano en Python, sin reportlab), audiobiografía de Pombo y audioresumen de Quiroga (texto propio, `say` + ffmpeg), 8 portadas propias.
  - Verificación: bytes mágicos, `unzip -t`, PDFKit, ffprobe, SHA-256; manifest validado con `ResourceInputSchema` (8/8).
  - Escritos `README.md`, `docs/*` (GOALS, ROADMAP, ARCHITECTURE, DECISIONS, PROGRESS, TESTING, SECURITY, OFFLINE, CONTENT-LICENSING) y `.agent/*`.
  - Fallos: Gutendex no respondió (timeout) → se usó la búsqueda de gutenberg.org. Wikisource devolvió error 400 en "Simón el bobito" → se usaron solo dos poemas.
- API v1 y web v1: en curso por agentes paralelos (resultados a registrar por el líder).
- No obtenido: galería de demostración; *María* (Isaacs) no está en Gutenberg en español.
- Siguiente: integrar seed + lectores, ejecutar typecheck/lint/test/E2E y registrar evidencia; checkpoint con commit cuando el usuario lo autorice.

## Iteración 2 — 2026-10-31 (integración, agente líder)
- Agentes API y web terminados. API 36/36, web 47/47 unitarias + 20/20 E2E (API simulada).
- Integración real: API :4100 + web :3100 (proxy). Seed con 8 recursos de `demo-content`.
- Verificado en Chromium: EPUB, PDF y MP3 abren con API real; sin errores JS. Flujo admin completo por curl.
- No verificado: offline/service worker en navegador, reanudación de audio tras recarga, Fire HD 10.
- Siguiente: ampliar contrato compartido (stats/audit/patch/imágenes), E2E con API real versionada, galería con imágenes licenciadas, prueba offline en navegador.

## Iteración 3 — 2026-10-31 (identidad corporativa Comfasucre)
- Entrada: `branding/branding.md` + kit. Decisión ADR-008 (perfil por zona).
- Líder: recursos copiados a `apps/web/public/brand/`; root layouts separados `(publico)` / `(admin)`.
- Agente admin: marcado PQR con CSS originales, login, resumen KPI, bandeja, formulario por secciones, subidas, TV, auditoría.
- Agente público: tokens por rol (portal = propuesta infantil sobre paleta PQR; kiosco §3.4; sala §3.5), Outfit/Inter locales, Remix Icon inline, logo, PWA. Contraste: 57 parejas, 0 fallos (`apps/web/scripts/brand-contrast.mjs`, `docs/BRANDING-PUBLICO.md`).
- Líder: corregido KPI de capacidad (contaba retirados) + prueba unitaria.
- Evidencia (ejecutada por el líder): typecheck OK; tests shared 8/8, api 36/36, web 50/50; build OK; Playwright 22/22; lectores EPUB/PDF/MP3 con API real sin errores; KPI admin 4/100, 2/59, 1/30, 1/20, 0/20, 8/229; sin desbordamiento horizontal.
- Pendiente: confirmar licencia Velzon; icono PWA 512 px; validación con responsables de marca de la propuesta del portal estudiantil.

## Iteración 4 — 2026-10-31 (EasyPanel + decisiones del usuario)
- Usuario: licencia Velzon confirmada; estilo aprobado; pidió icono 512 px y preparar EasyPanel con acceso desde varias IP.
- Hecho: iconos 512 (any + maskable); `CORS_ORIGIN=*` soportado; API acepta `PORT`; web escucha en 0.0.0.0 y `allowedDevOrigins`; Dockerfiles api/web, entrypoint con migraciones + seed opcional, `docker-compose.yml`, `.dockerignore`, `docs/DEPLOY-EASYPANEL.md`.
- Evidencia: `docker compose build` OK; pila arriba; desde 192.168.31.240:3100 health ok, 8 recursos, rutas 200, Range 206, CORS reflejado; Chromium lectores OK y KPI admin correctos; tests 8/8, 36/36, 50/50.
- Pendiente: repositorio remoto (GitHub) y servidor EasyPanel; commit inicial (no autorizado aún).

## Iteración 5 — 2026-11-01 (cifras cerradas, TV, QA y simulación Fire HD 10)
- Catálogo público verificado: libros 300 · audiolibros 100 · audiobiografías 50 · audioresúmenes 20 · galerías 100 · retos 100 activos. Retirados para cerrar cifras: `catalogo-dp/RETIRADOS.md`.
- TV rediseñada (6 bloques × 20 s, rail «EN PANTALLA», QR, TUTORIAL). Metas de capacidad nuevas (570 + 100 retos).
- Bugs corregidos por el líder: seed sobrescribía estados al arrancar (ahora solo crea); proxy /api colgaba subidas grandes (route handler en streaming).
- QA: 7 problemas corregidos (admin paginaba solo 100, 404 en inglés, filtros que se pisaban, ETag/304 en portadas, galería offline, contraste admin, maquetación menor).
- Pruebas (líder, 2026-11-01): suite real `npm run e2e:real -w @macondo/web` 13/13 en 3 de 5 corridas; las fallas son siempre el test de inactividad del kiosco. Diagnóstico: sin long tasks en la página; un cronómetro independiente también se pausó (4,8 s) en la corrida lenta → pausas del host (Docker bajo carga, displaysleep 2 min, powernap), no del código.
- Simulación Fire HD 10: `docs/FIRE-HD10-SIMULACION.md`. Bloqueo real: por IP de LAN (http) no hay contexto seguro → sin service worker ni descargas offline. Requiere HTTPS local o dominio HTTPS (EasyPanel) o APK.
- Pendiente: HTTPS en red local, miniaturas de portadas (≈250 KB c/u; catálogo lento en 3G), commit inicial (no autorizado), validación física Fire HD 10.

## Iteración 6 — 2026-11-01 (repaso final, APK, manual y entregables)
- Funciones nuevas: miniaturas de portada (sharp, WebP, ETag) → catálogo 8,9 MB → 163 KB por página; pestaña Retos y acciones en lote en admin.
- App Android `co.com.comfasucre.macondo` 1.0.0 (WebView, NSC con CA propia, modo kiosco por device owner, PIN). Compilada en Docker JDK17 + SDK local; firmada; NO ejecutada en dispositivo.
- HTTPS LAN: `scripts/make-local-certs.sh` + Caddy (perfil `https`, :3443). Contexto seguro verificado.
- Datos: portada perdida de la nueva audiobiografía de Pombo restaurada; demo Pombo re-retirada; 0 portadas rotas en 570.
- Pruebas (líder): e2e:real 16/16; agente: shared 14, api 53, web 76, mocked e2e 30/30.
- Entregables: ZIP código, paquete contenido (export-content.sh), APK + firma, manual HTML (en curso).
- Pendiente: commit inicial (no autorizado), validación física Fire HD 10, cambiar claves demo, CORS en producción.
- Cierre 2026-11-01: añadido cambio de contraseña (API + diálogo admin) y corregida la columna Usuario de Auditoría; tests 15/54/76, suite real 16/16; ZIP de código regenerado; manual en actualización.

## Iteración 7 — 2026-11-01 (hardware real y dominio)
- Hardware confirmado por el usuario: kiosco táctil 32" Android (marca/versión/orientación por confirmar), TV con Dell OptiPlex 3000 (Windows 11 Pro). Dominio: macondo.comfasucre.co.
- App Android 1.1.0: dominio por defecto, arranque automático, escala/orientación, kiosco por device owner, esquina+PIN. Firmada con la misma clave. No ejecutada en dispositivo.
- Web: /kiosco vertical+horizontal con `?escala=`, panel oculto de configuración; /tv 720p–4K, `?animaciones=0`, portada 4K corregida; /instalar con dominio.
- `infra/tv-windows/` (Edge kiosco, tarea programada, energía) — sintaxis validada con PowerShell 7 en Docker, no ejecutado en Windows. `docs/HARDWARE.md`, ADR-015.
- Config producción: CORS/PUBLIC_ORIGIN/Dockerfile/compose/DEPLOY con el dominio.
- Pruebas: web 81/81, mocked e2e 36/36, e2e:real 17/17 (líder), conteos intactos.
- 2026-11-02: fallo en EasyPanel (Nixpacks, sin Dockerfile raíz) → imagen todo en uno (`Dockerfile` raíz, `infra/docker/start-all.sh`), probada localmente; DEPLOY opción C reescrita; ZIP regenerado.

## Iteración 8 — 2026-11-05 (voz nueva)
- Usuario rechazó la voz Piper x_low; muestras de Kokoro, MeloTTS (falló instalación), Piper claude-high y davefx-medium en `entregables/muestras-voz/`. Eligió **es_ES-davefx-medium** (CC0).
- TTS integrado en ambas imágenes (venv Piper + voz verificada por SHA-256, lame para MP3), `TtsService`, `POST /api/admin/resources/:id/narrar`, `GET /api/admin/tts/estado`, botón «Regrabar» en admin (ADR-017). Tests: shared 17, api 71, web 85; e2e:real 17/17 en la pila reconstruida.
- 52 audios sintéticos regrabados y reemplazados en vivo (0 fallos); manifiestos y FUENTES actualizados.
- Pendiente: «Construye tu cuento» (esperando clave DeepSeek y confirmaciones), manual v1.2, paquete de contenido regenerado.

## Iteración 9 — 2026-11-05 («Construye tu cuento»)
- Taller de cuentos (ADR-018): asistente 3 pasos, DeepSeek (deepseek-chat) con JSON estricto, filtro de seguridad, modo plantilla sin internet, audio Piper davefx, cola de revisión (PENDING_REVIEW → APROBAR crea BOOK EPUB + AUDIOBOOK / RECHAZAR), pestaña admin «Taller de cuentos», KPI, límites por dispositivo (3/h) y global (60/h). Privacidad: el nombre del autor nunca viaja al proveedor.
- Verificación del líder en vivo: cuento «Nube y la lancha de los secretos» (1-3, animal/Coveñas/amistad) generado en 17 s con audio (Range 206); DeepSeek responde en ~0,7–2 s; alias deepseek-chat → deepseek-flash. Pruebas del agente: shared 23, api 99, web 96, e2e 42, e2e:real 19/19.
- Pendiente: manual v1.3, rechazar cuento de prueba, re-exportar contenido (nueva tabla GeneratedStory), ZIP y sumas.
