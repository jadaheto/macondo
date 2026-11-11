# Objetivos y criterios de aceptación

Cada criterio debe demostrarse con evidencia registrada en `docs/TESTING.md`. "Pendiente" hasta entonces.

## G1 — Web adaptable, accesible y segura para 1.º–11.º
- [ ] Experiencias diferenciadas por banda (1–3, 4–5, 6–8, 9–11) seleccionables desde `/`.
- [ ] Objetivos táctiles ≥ 44 px; contraste WCAG 2.1 AA verificado con axe en `/`, `/catalogo`, `/kiosco`, `/admin` (0 violaciones serias).
- [ ] Navegación completa por teclado en `/admin`; textos alternativos en portadas.
- [ ] Cabeceras de seguridad (helmet), límite de peticiones en login y validación zod en todas las entradas.

## G2 — Catálogo multimedia de seis módulos, capacidad 570 recursos + 100 retos

> Metas actualizadas por el usuario el 2026-10-31: 300 libros, 100 audiolibros, 50 audiobiografías, 20 audioresúmenes, 100 galerías (570) y 100 retos lectores. Antes: 229 (100/59/30/20/20).
- [ ] Tipos `BOOK`, `AUDIOBOOK`, `AUDIOBIOGRAPHY`, `AUDIOSUMMARY`, `GALLERY` + retos lectores.
- [ ] Búsqueda y filtros por grado, tipo y categoría con prueba de integración.
- [ ] Lector EPUB (epub.js), PDF (PDF.js) y reproductor MP3 con reanudación abren los archivos de `demo-content/`.
- [ ] Carga de 570 registros sintéticos sin degradar el listado paginado (p95 < 500 ms en red local).

## G3 — Lectura y reproducción offline real en las tablets, según licencias
- [ ] `/api/offline/manifest` incluye solo recursos con `canDownloadOffline = true`, con SHA-256 y versión.
- [ ] El cliente rechaza archivos cuyo hash no coincide.
- [ ] En una Fire HD 10 real: abrir EPUB/PDF/MP3 descargados sin Wi-Fi y tras reiniciar (**pendiente de validación física**).

## G4 — Kiosco táctil público
- [ ] `/kiosco` sin cuentas, a pantalla completa, con reinicio de sesión por inactividad (prueba E2E con reloj simulado).
- [ ] Los QR solo apuntan a recursos `accessible`.
- [ ] Salida del modo kiosco restringida por configuración del sistema operativo (procedimiento documentado y verificado en el equipo).

## G5 — Macondo TV administrable
- [ ] `/api/tv/schedule` devuelve solo diapositivas activas y vigentes, ordenadas (prueba de integración).
- [ ] `/tv` rota según `durationSeconds`, sin sonido, y se recupera si la API cae (E2E con red cortada).

## G6 — Panel administrativo, roles y estadísticas agregadas
- [ ] Rutas `/api/admin/*` devuelven 401 sin token y 403 con rol insuficiente (auditoría solo ADMIN).
- [ ] Alta, edición, publicación y retiro (`RETIRED`, nunca borrado) con registro en auditoría.
- [ ] Subidas validadas por extensión, MIME y bytes mágicos; límite `MAX_UPLOAD_MB`.
- [ ] Estadísticas solo agregadas, sin datos personales de estudiantes ni rankings nominales.

## G7 — Despliegue local reproducible y documentado
- [ ] Desde un clon limpio, `README.md` lleva a un sistema funcionando (instalar, migrar, sembrar, arrancar) sin pasos no documentados.
- [ ] `npm run typecheck`, `npm run lint` y `npm test` pasan; resultados registrados.
- [ ] Respaldo y restauración de Postgres + `storage/` probados al menos una vez.
