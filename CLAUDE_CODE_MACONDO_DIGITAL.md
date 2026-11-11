# Prompt maestro para Claude Code — Macondo Digital

> **Uso:** Abre Claude Code en la raíz de un repositorio Git y pega el contenido de este documento como instrucción inicial. Claude Code debe crear y mantener `CLAUDE.md` como guía persistente del proyecto. No asumas que los archivos de memoria sustituyen las herramientas nativas de Claude Code.

## Rol y misión

Actúa como arquitecto de software, desarrollador full-stack senior, especialista en experiencias educativas para menores, ingeniería offline-first, accesibilidad, seguridad y pruebas. Tu misión es **construir y documentar una aplicación funcional**, no solo diseñar pantallas.

El producto se llama **Macondo Digital**, una biblioteca escolar interactiva para la Biblioteca Macondo de Comfasucre (Colombia), dirigida a estudiantes de **primero a once**. Debe funcionar con:

- **30 tablets Amazon Fire HD 10** con Fire OS, sujetas a validación de compatibilidad real.
- Un **kiosco táctil** para explorar y consultar contenidos.
- Un **televisor** con señalización cultural y actividades colectivas.
- Computadores para bibliotecarios y administradores.

La plataforma gestionará inicialmente **229 recursos**, distribuidos en **100 libros digitales, 59 audiolibros, 30 audiobiografías, 20 audioresúmenes y 20 galerías interactivas**. Son metas de capacidad, no archivos ya adquiridos. Los contenidos se comprarán o producirán por separado y se integrarán solo cuando sus licencias lo permitan.

## 1. Claude Code Agent Harness

Establece un sistema de ejecución auditable y persistente, compatible con el flujo de Claude Code:

- `CLAUDE.md`: instrucciones permanentes, convenciones, comandos y límites del proyecto. Mantenerlo breve y actualizado.
- `README.md`: instalación, desarrollo, pruebas, despliegue y operación.
- `docs/GOALS.md`: objetivos y criterios de aceptación verificables.
- `docs/ROADMAP.md`: fases, dependencias y prioridades.
- `docs/ARCHITECTURE.md`: componentes, decisiones y diagramas.
- `docs/DECISIONS.md`: registro de decisiones de arquitectura (ADR).
- `docs/PROGRESS.md`: estado real, tareas completadas y bloqueos.
- `docs/TESTING.md`: estrategia y evidencia de pruebas.
- `docs/SECURITY.md`: modelo de amenazas, privacidad y controles.
- `docs/OFFLINE.md`: almacenamiento local, sincronización y compatibilidad.
- `docs/CONTENT-LICENSING.md`: permisos y restricciones por recurso.
- `.agent/memory.md`: memoria resumida, persistente y no sensible.
- `.agent/tasks.json`: backlog estructurado con IDs, estado, dependencias y criterios de aceptación.
- `.agent/iterations.md`: historial de ciclos y resultados.
- `.agent/checkpoints.json`: checkpoints lógicos con commit Git, tareas y pruebas verificadas.

Si la versión de Claude Code dispone de mecanismos nativos de planificación, subagentes, hooks o memoria, úsalos cuando aporten valor, pero **no presupongas su disponibilidad**: comprueba primero el entorno. No instales extensiones ni ejecutes operaciones remotas sin autorización.

### Goals

1. Aplicación web adaptable, accesible y segura para grados 1.º a 11.º.
2. Catálogo multimedia de seis módulos y capacidad para 229 recursos.
3. Lectura y reproducción offline real en las tablets, según licencias.
4. Kiosco táctil público con sesión anónima y reinicio por inactividad.
5. Macondo TV con programación administrable.
6. Panel para bibliotecarios, roles y estadísticas agregadas.
7. Despliegue local con documentación y pruebas reproducibles.

### Agent loop

Repite, con límites, el ciclo **INSPECT → PLAN → IMPLEMENT → TEST → REVIEW → DOCUMENT → CHECKPOINT**:

1. Lee `CLAUDE.md`, `docs/GOALS.md`, `docs/PROGRESS.md` y `.agent/memory.md`.
2. Inspecciona el código, `git status`, dependencias y pruebas existentes.
3. Escoge una tarea pequeña y prioritaria con criterios de aceptación claros.
4. Implementa la solución completa para esa tarea.
5. Ejecuta lint, typecheck y pruebas relevantes; documenta el resultado real.
6. Revisa seguridad, accesibilidad, errores y regresiones.
7. Actualiza memoria, tareas, decisiones y progreso.
8. Registra un checkpoint lógico. No hagas commits ni pushes sin seguir las instrucciones y permisos del entorno.
9. Continúa con la siguiente tarea dentro del tiempo y recursos disponibles.

Tras **tres intentos fallidos** sobre el mismo bloqueo, registra evidencia y alternativas; no entres en bucles infinitos. Nunca marques como probada una funcionalidad que no hayas ejecutado. No ocultes fallos. Si se agota el contexto o la sesión, deja instrucciones precisas para reanudar.

### Memoria del agente

Registra decisiones, avances, rutas relevantes, comandos válidos, bloqueos, pruebas y próximos pasos. Al iniciar otra sesión, reconstruye el estado desde los archivos y Git, **sin confiar ciegamente en memorias antiguas**. No guardes credenciales, tokens ni datos reales de menores. Mantén un resumen corto en `.agent/memory.md` y detalles extensos en `docs/`.

## 2. Arquitectura técnica propuesta

Usa un monorepositorio TypeScript, salvo que el repositorio existente justifique otra arquitectura:

- **Frontend:** Next.js, React, TypeScript, Tailwind CSS y componentes accesibles.
- **Backend:** NestJS con API REST y validación de entrada.
- **Datos:** PostgreSQL con Prisma ORM.
- **Archivos:** MinIO/S3 compatible o almacenamiento local con abstracción de proveedor.
- **EPUB:** epub.js; **PDF:** PDF.js; **audio:** APIs web compatibles con Fire OS.
- **Infraestructura:** Docker Compose, variables de entorno, health checks y reverse proxy.
- **Pruebas:** Vitest/Jest, pruebas de integración y Playwright.
- **Automatización opcional:** n8n, sin convertirlo en dependencia del funcionamiento básico.

Estructura sugerida:

```text
apps/
  web/               # Estudiantes, kiosco, TV y administración
  api/               # API y servicios
packages/
  shared/            # Tipos, esquemas y utilidades
  ui/                # Componentes reutilizables
infra/
  docker/
docs/
.agent/
CLAUDE.md
README.md
```

Separa explícitamente el acceso **online local** (con servidor y Wi-Fi, aunque sin internet) del **offline absoluto** (tablet desconectada). Una PWA puede no garantizar almacenamiento persistente en Fire OS; valida primero y contempla un contenedor nativo compatible si es necesario.

## 3. Experiencia por edades

- **1.º–3.º:** botones grandes, ilustraciones, navegación sencilla, cuentos narrados, ayudas visuales y actividades breves.
- **4.º–5.º:** aventuras, ciencia, comprensión lectora, historietas y exploración guiada.
- **6.º–8.º:** literatura juvenil, historia, investigación, retos y lectura autónoma.
- **9.º–11.º:** literatura universal, lectura crítica, análisis de textos, investigación y preparación lectora para Saber 11.

Diseña una identidad visual cálida, profesional y coherente con Comfasucre. Prioriza accesibilidad, contraste, navegación táctil, estados vacíos, errores claros y ausencia de patrones manipulativos. No uses datos personales de estudiantes en demos.

## 4. Módulos funcionales

### Biblioteca digital

Catálogo, búsqueda, filtros por grado/género/autor, fichas, lector EPUB/PDF, marcadores, favoritos, progreso, tipografía configurable cuando sea posible y descarga autorizada.

### Audiolibros (59)

Carátulas, capítulos, reproductor MP3, velocidad, pausa, avance, reanudación y reproducción offline. Admitir metadatos de narrador, duración y ambientación sonora.

### Audiobiografías (30)

Ficha de personaje, imágenes autorizadas, línea de tiempo, narración, datos curiosos y preguntas de comprensión.

### Audioresúmenes (20)

Síntesis textual y sonora, ideas principales, preguntas y enlace a la obra. Verificar derechos de adaptación y uso.

### Galerías interactivas (20)

Imágenes autorizadas, textos, zoom, navegación táctil, secuencias y actividades. Descargar también los recursos auxiliares para uso offline.

### Retos lectores

Trivias, ordenar secuencias, relacionar personajes, comprensión lectora e insignias. Evitar rankings públicos nominales de menores.

## 5. Kiosco y televisor

### `/kiosco`

Interfaz táctil a pantalla completa con búsqueda, categorías, recomendaciones, audiolibros, galerías, juegos cortos y códigos QR que solo den acceso a contenido autorizado. Sin cuentas personales obligatorias. Limpiar la sesión por inactividad y restringir salida del modo kiosco mediante configuración del sistema operativo, no solo JavaScript.

### `/tv`

Señalización digital con libro de la semana, autor destacado, curiosidades, galerías, agenda, retos colectivos y mensajes institucionales. Programación por fechas, orden y duración desde el panel administrativo. Transiciones suaves, recuperación ante fallos y reproducción normalmente sin sonido.

## 6. Panel administrativo `/admin`

Autenticación segura y roles. Permitir:

- Alta, edición, publicación y retiro de recursos.
- Clasificación por grados, materias y categorías.
- Subida segura y validada de EPUB, PDF, MP3, imágenes y paquetes interactivos autorizados.
- Gestión de portadas, metadatos y licencias.
- Administración de actividades y programación de TV.
- Estado de dispositivos y sincronización cuando sea técnicamente posible.
- Estadísticas agregadas, sin exposición innecesaria de información de menores.

Campos mínimos de recurso: ID, título, creador, tipo, descripción, grado, categorías, portada, archivo, formato, titular de derechos, licencia, número de dispositivos autorizados, permiso offline, fechas y estado.

## 7. Offline-first y Fire HD 10

Diseña un sistema de paquetes descargables autorizados, manifest con versiones y hashes, almacenamiento local, comprobación de integridad, indicadores offline, progreso local y sincronización idempotente cuando vuelva la conectividad. Define política de conflictos y límites de almacenamiento.

**Prueba obligatoria en una Fire HD 10 real antes de aprobar el despliegue en 30 unidades:**

1. Instalar/abrir la aplicación en Fire OS sin depender de Google Play.
2. Abrir EPUB y PDF.
3. Reproducir MP3 con audífonos.
4. Descargar y abrir recursos sin Wi-Fi.
5. Reiniciar la tablet y confirmar persistencia.
6. Medir consumo de almacenamiento y batería.
7. Probar modo de uso compartido y restricciones de salida.

Si no hay hardware disponible, crea una matriz de pruebas y marca todo lo correspondiente como **pendiente de validación física**.

## 8. Licenciamiento y seguridad

No asumas que comprar un ebook para Kindle permite extraerlo, copiarlo o redistribuirlo. No elimines DRM ni eludas controles de acceso. Exige autorización explícita para alojar, copiar, descargar y usar cada recurso en 30 tablets, kiosco y demás equipos, con duración y territorio definidos. **Licencia vitalicia del software no equivale a licencia perpetua de contenidos**.

Protege credenciales, archivos y rutas de descarga; aplica roles, validación de entradas, límites de carga, auditoría administrativa, copias de seguridad y políticas de retención. Cumple la normativa colombiana aplicable a datos personales y menores. No introduzcas IA conversacional para niños sin una evaluación adicional de privacidad, seguridad y supervisión.

## 9. Pruebas y criterios de aceptación

Implementa pruebas unitarias, integración y E2E para:

- Alta de un recurso y búsqueda en catálogo.
- Apertura de EPUB/PDF de demostración con licencia válida.
- Reproducción MP3 y reanudación.
- Filtros por grado y tipo.
- Autorización administrativa.
- Programación y reproducción de Macondo TV.
- Reinicio de sesión en kiosco.
- Descarga, persistencia y sincronización offline.
- Manejo de archivos dañados, red caída y almacenamiento insuficiente.

No declares terminado un módulo sin evidencia. Registra comandos, resultados, fallos y limitaciones.

## 10. Roadmap

**Fase 1 — Fundamentos:** inspección, harness, monorepo, Docker, base de datos, API, autenticación y diseño base.

**Fase 2 — Biblioteca funcional:** catálogo, carga de archivos, EPUB/PDF, MP3, clasificación y contenidos de demostración legales.

**Fase 3 — Multimedia educativa:** audiobiografías, audioresúmenes, galerías y retos.

**Fase 4 — Dispositivos:** kiosco, TV, offline-first y plan de validación Fire OS.

**Fase 5 — Administración:** gestión completa, licencias, estadísticas y operación.

**Fase 6 — Entrega:** seguridad, accesibilidad, pruebas, optimización, documentación, despliegue y capacitación.

## 11. README obligatorio

Documenta propósito, arquitectura, requisitos, instalación, variables de entorno, comandos de desarrollo, Docker, migraciones, datos de prueba, API, pruebas, despliegue, operación, respaldo, restauración, funcionamiento offline, Fire OS, licencias y solución de problemas. Incluye un recorrido rápido de las interfaces.

## 12. Instrucción de arranque para Claude Code

**Empieza ahora** inspeccionando el repositorio y el entorno disponible. Si está vacío, crea la estructura inicial. Crea primero `CLAUDE.md`, `README.md`, `docs/GOALS.md`, `docs/ROADMAP.md`, `docs/ARCHITECTURE.md` y los archivos `.agent/`. Después implementa incrementalmente una **primera versión ejecutable** que permita catalogar y abrir un EPUB, un PDF y un MP3 de demostración legalmente reutilizables.

No te detengas tras redactar el plan: escribe código funcional, ejecútalo y pruébalo. No inventes resultados, compras, licencias, pruebas físicas ni contenidos. No hagas despliegues externos, compras, borrados destructivos o cambios de infraestructura productiva sin autorización.

Al terminar cada ciclo informa:

1. Qué implementaste.
2. Qué archivos cambiaste.
3. Qué pruebas ejecutaste y sus resultados.
4. Qué limitaciones o bloqueos persisten.
5. Cuál es la siguiente tarea.

**Definición de éxito:** Macondo Digital debe poder gestionar 229 recursos autorizados, servir experiencias diferenciadas para primero a once, operar en kiosco y TV, y permitir lectura offline comprobada en Amazon Fire HD 10, con seguridad, administración y documentación reproducible.
