# Seguridad y privacidad

## Activos
Contenidos licenciados (y sus condiciones), credenciales del personal, `JWT_SECRET`, base de datos, `storage/`, integridad del catálogo y de la programación TV, y —sobre todo— la privacidad y seguridad de estudiantes menores de edad.

## Modelo de amenazas (STRIDE simplificado)

| Amenaza | Ejemplo | Controles |
|---|---|---|
| **S**uplantación | Estudiante intenta entrar a `/admin`; robo de token | Contraseñas bcrypt, límite de intentos (throttler), JWT de vida corta, sin cuentas de estudiantes, cierre de sesión en equipos compartidos |
| **T**ampering (manipulación) | Subir un ejecutable renombrado `.pdf`; alterar archivos offline | Validación de extensión + MIME + bytes mágicos (`ALLOWED_UPLOADS`), límite `MAX_UPLOAD_MB`, claves de almacenamiento generadas por el servidor, SHA-256 en servidor y verificación en cliente |
| **R**epudio | Cambio de licencia sin responsable | `AuditLog` de toda acción administrativa (actor, acción, entidad, fecha); solo ADMIN lo consulta |
| **I**nformation disclosure | Descarga directa de archivos con licencia vencida; fuga de datos de menores | `isResourceAccessible` en cada petición (403), rutas sin listado de directorio, sin datos personales de estudiantes, estadísticas agregadas sin rankings nominales, Postgres solo en `127.0.0.1` |
| **D**enegación de servicio | Subidas masivas; kiosco bloqueado | Límites de tamaño y de peticiones, healthchecks, reinicio del kiosco por inactividad |
| **E**levación de privilegios | LIBRARIAN accede a auditoría o gestión de usuarios | Guardas de rol en cada ruta `/api/admin/*`, pruebas de autorización 401/403 |

## Datos de menores (Colombia)
- **Ley 1581 de 2012** y **Decreto 1377 de 2013** (compilado en el Decreto 1074 de 2015): los datos de niños, niñas y adolescentes solo se tratan si responden a su interés superior y con autorización del representante legal. **Diseño**: no se recogen datos personales de estudiantes (sin nombres, documentos, fotos ni identificadores de dispositivo asociados a personas).
- **Código de Infancia y Adolescencia (Ley 1098 de 2006)**: prevalencia de sus derechos, protección frente a contenidos inapropiados. Todo recurso tiene rango de grado y revisión humana antes de publicarse.
- Datos del personal (correo, nombre, rol): finalidad exclusiva de administración; política de tratamiento a cargo de Comfasucre.
- **Sin IA conversacional para niños** sin una evaluación previa de privacidad, seguridad, moderación y supervisión, aprobada por la institución.

## Kiosco y tablets
- La salida del modo kiosco se restringe **en el sistema operativo** (modo de app única/fijación de pantalla, perfiles infantiles o MDM), no solo con JavaScript.
- Reinicio por inactividad que limpia el estado de la sesión; QR solo hacia recursos `accessible`.
- Tablets sin cuentas personales de estudiantes; navegador sin contraseñas guardadas.

## Narración sintética (ADR-017)
- **Sin servicio externo de audio**: Piper corre dentro del contenedor de la API; el texto a narrar y el MP3 resultante **nunca salen del servidor** (no hay llamadas a APIs de voz en la nube ni telemetría). Internet solo se usa en el *build* de la imagen (descarga de la voz, verificada por SHA-256).
- Solo ADMIN/LIBRARIAN con JWT pueden narrar; cada regrabación queda en `AuditLog` (`RESOURCE_NARRATE`) con actor, clave, hash y duración. Nunca se narra texto enviado por estudiantes ni por el público: el endpoint vive bajo `/api/admin/*`.
- Límites contra abuso: 40 000 caracteres por petición (cuerpo JSON ≤ 1 MB), **2 síntesis simultáneas** (cola), tiempo máximo por narración (`TTS_TIMEOUT_MS`, SIGKILL), temporales en un directorio propio que se borra siempre; Piper se ejecuta como usuario `node`, sin shell (`spawn` con argumentos, el texto va por stdin, nunca por línea de órdenes).
- Piper es GPL-3 y se usa como proceso separado (sin enlazar), lo que mantiene la licencia del software de la biblioteca sin cambios. La voz `es_ES-davefx-medium` tiene datos CC0 (`MODEL_CARD` incluido en la imagen).

## Contenido generado con IA para menores — Taller de cuentos (ADR-018)

Evaluación específica (la especificación exige una valoración adicional para esta función) y controles implementados:

| Riesgo | Control |
|---|---|
| Contenido inadecuado (violencia, miedo, sexo, drogas, marcas, religión, política, romance) | Prompt del sistema fijo con prohibiciones explícitas; validación posterior con lista de bloqueo propia (español de Colombia) sobre título, sinopsis, párrafos, preguntas, opciones, glosario; heurística de idioma; límites de longitud; un reintento con prompt estricto; si falla, **plantilla propia**. Nada se publica en el catálogo sin que la bibliotecaria lo lea y apruebe (`PENDING_REVIEW` → `APPROVED`). |
| Datos personales de menores hacia terceros (Ley 1581) | Al proveedor solo van banda, opciones cerradas y nombre del protagonista (2–30 letras, lista de bloqueo). El nombre de autor **nunca** sale del servidor. Sin IP, sin cuentas; id aleatorio por tablet → SHA-256 solo para el límite por hora. La respuesta pública nunca incluye `deviceHash`. |
| Inyección de instrucciones por el usuario | La entrada es cerrada (enums) salvo dos nombres con expresión regular estricta y longitud 2–30; el JSON del modelo se valida con zod y nunca se interpreta como HTML (React escapa; la portada SVG se construye con texto escapado). |
| Fuga de la clave del proveedor | Solo en variables de entorno del servidor; `DeepSeekProvider` registra latencia, modelo y tokens; nunca cabeceras, prompts ni cuerpos de error. Pruebas comprueban que la clave no viaja en el cuerpo. |
| Abuso / costo | 429 al superar 3 cuentos por dispositivo y hora y 60 globales por hora (contados en BD); tiempo máximo de 60 s por llamada; `max_tokens` por banda. |
| Dependencia de internet | Sin clave, sin DNS o con error del proveedor → modo plantilla, registrado sin datos; el resto de la app no cambia. |
| Trazabilidad | Auditoría `CUENTO_REVIEW` (decisión, nota, modo, banda, recursos creados) y `RESOURCE_CREATE`; el cuento conserva `modo`, latencia y tokens. |
| Archivos generados | EPUB construido por nosotros (sin contenido externo); MP3 por Piper en el servidor; portada PNG por sharp a partir de nuestro SVG. |

### Ilustración con IA (ADR-020)
- **Prompt cerrado:** solo tipo de protagonista, lugar y enseñanza, en una plantilla fija; nunca nombres ni texto del cuento. El niño no puede escribir texto libre que llegue al generador de imágenes.
- **Proveedor:** Pollinations (FLUX, `safe=true`) por defecto; sin clave ni datos de usuario; solo la descripción y una semilla. Alternativa de pago con token (Hugging Face), nunca registrado.
- **Exposición:** el estudiante ve la imagen al instante (decisión del usuario). Mitigación: prompt cerrado, estilo infantil, filtro del proveedor, botón «Ocultar ilustración» en la revisión (auditado) y, al rechazar el cuento, nada se publica. Una ilustración oculta no se sirve al público (404) ni se usa como portada.
- **Tratamiento:** la imagen se re-codifica en el servidor (JPEG 600×900, sin metadatos) antes de guardarse; se sirve por `/api/cuentos/:id/imagen` con id aleatorio no enumerable.

Límites conocidos: la lista de bloqueo es finita (la revisión humana es la barrera principal); la heurística de idioma detecta inglés, no otros idiomas; el modelo puede inventar detalles geográficos (la bibliotecaria revisa).

## Operación
- Secretos solo en `.env` (no versionado); `JWT_SECRET` ≥ 32 caracteres aleatorios; cambiar la contraseña semilla antes de cualquier uso real.
- **Respaldos**: `pg_dump` diario + `storage/` (ver `README.md`), cifrados, fuera del servidor, restauración probada trimestralmente.
- **Retención**: auditoría 2 años (propuesta, a validar con Comfasucre); contadores de uso agregados sin límite (no son datos personales); respaldos 90 días; registros técnicos 30 días. Recursos retirados se conservan como `RETIRED` hasta que la licencia exija destrucción.
- Actualizar dependencias y revisar `npm audit` en cada fase; cabeceras de seguridad (helmet) y CORS restringido a `CORS_ORIGIN`.
- Incidentes: registrar, contener (revocar `JWT_SECRET` rota todas las sesiones), notificar a la institución y, si aplica, a la SIC.
