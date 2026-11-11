# Branding de interfaces Comfasucre

Guía reutilizable para nuevos proyectos, basada en el código local vigente de **PQR y Digiturno**. Fecha de revisión: **26 de octubre de 2026**. Incluye un kit de archivos y plantillas HTML; consulta la sección 14 para copiarlo a un proyecto nuevo.

## 1. Cómo usar esta guía

Entrega este archivo al agente o equipo que construya una aplicación y pide aplicar el perfil que corresponda: administrativo PQR, operación Digiturno, kiosco táctil o pantalla de sala. Contiene instrucciones de diseño, valores comprobados y una base CSS portable.

Este documento describe la identidad implementada; **no constituye un manual corporativo oficial**. La paleta institucional canónica todavía figura pendiente de confirmación en `docs/agent/DESIGN_SYSTEM.md`. Los valores de cada perfil son referencias actuales, no una autorización para recolorear módulos existentes.

Para reutilizarlo como referencia basta con adjuntarlo o copiarlo al nuevo proyecto. Por sí solo, un archivo `branding.md` no instala una skill de Codex: una skill descubrible necesita una carpeta con un `SKILL.md` que indique cuándo usarla y remita a esta guía. No es necesario convertirlo para usar el prompt de la sección 12.

### Instrucciones para el agente diseñador

1. Identifica el público, dispositivo y perfil visual antes de componer la interfaz.
2. En un proyecto nuevo usa el perfil solicitado; si no se especifica, toma PQR como punto de partida administrativo y declara esa elección.
3. Conserva la jerarquía compacta, los azules, las superficies claras, las tarjetas y la organización responsive descritas aquí. Evita mezclar las cuatro escalas de interfaz en una misma pantalla.
4. Preferencia confirmada el 26/10/2026: conservar la identidad mediante los **archivos CSS/JS, fuentes, iconos y estructura HTML originales**. Para nuevos proyectos parte de las plantillas del kit y cambia contenido y contratos. Si el framework es distinto, mantén el DOM, las clases y el orden de carga; una reinterpretación de los tokens no garantiza el mismo resultado.
5. Implementa carga, vacío, error, selección, foco y deshabilitado junto con el estado normal.
6. Comprueba el resultado con los datos y anchos reales. Si introduces una variante, identifícala como propuesta; no la presentes como una preferencia ya aprobada.

## 2. Personalidad visual

El lenguaje observado es institucional, claro y orientado al trabajo: azul para jerarquía y acciones principales; cian/turquesa para foco y apoyo; verde para resultados positivos; blanco y azules muy suaves para organizar información.

- **Densidad útil:** cabeceras breves, indicadores bajos y filtros próximos al listado. El contenido ocupa la mayor parte del espacio.
- **Agrupación:** tarjetas con borde fino, esquinas redondeadas, sombras discretas y títulos con iconos.
- **Jerarquía:** título, explicación corta, contexto o indicadores, contenido y acciones.
- **Acción reconocible:** texto explícito junto al icono; un estado no se comunica únicamente mediante color.
- **Adaptación real:** tablas en escritorio y tarjetas en móvil; campos y paneles se apilan cuando el contenedor pierde espacio.

La bandeja PQR más reciente tiene **cabecera transparente sin gran hero**. La radicación interna conserva una **franja azul compacta**. Son composiciones distintas y ambas forman parte del diseño actual.

## 3. Colores

Los valores siguientes provienen de los CSS cargados por las vistas actuales. Se revisaron también las reglas posteriores: en estos archivos una declaración inicial puede estar reemplazada más abajo.

### 3.1 Perfil PQR: base administrativa

| Rol | Valor | Uso observado |
| --- | --- | --- |
| Azul principal | `#17365d` | Títulos, radicados, botón principal, navegación activa |
| Azul secundario | `#205b88` | Enlaces, contornos, iconos, extremo del degradado |
| Turquesa | `#1595a3` | Foco, selección y apoyo informativo |
| Verde de acento | `#76a82b` | Acentos positivos, pasos completados y respuesta |
| Texto | `#24364b` | Contenido general del módulo |
| Texto secundario base | `#718096` | Ayudas y metadatos |
| Superficie suave | `#eef5fa` | Bloques informativos y fondos de icono |
| Panel | `#ffffff` | Tarjetas, controles y detalle |
| Borde base | `#dce6ee` | Tarjetas y separadores |
| Borde del control | `#b9cad8` | Inputs y selectores |
| Borde al pasar el puntero | `#8ca6b9` | Inputs y selectores |
| Botón principal hover | `#102b4b` | Botón `.btn-pqr` |
| Control deshabilitado | `#edf2f6` / `#647789` | Fondo / texto |
| Validación inválida | `#c44242` | Borde y marca de requerido |
| Validación válida | `#5f8d28` | Borde de control validado |

**Ajustes de las pantallas recientes:**

| Contexto | Token o función | Valor |
| --- | --- | --- |
| Bandeja | `--inbox-line` | `#e0e8f1` |
| Bandeja | `--inbox-muted` | `#697c90` |
| Bandeja | Hover/foco dentro de fila | `#eef5fc` |
| Bandeja | Cabecera de tabla compacta | `#f4f7fa` |
| Radicación interna | `--pqr-create-border` | `#d9e4ed` |
| Radicación interna | `--pqr-create-muted` | `#587086` |
| Radicación interna | `--pqr-create-positive` | `#2f9f69` |
| Radicación interna | `--pqr-create-file-edge` | `#aac6df` |

**Estados PQR:** las parejas son fondo / texto del badge, no colores intercambiables para cualquier botón.

| Estado | Fondo | Texto |
| --- | --- | --- |
| Éxito | `#e8f5e0` | `#4c761c` |
| Advertencia | `#fff4d7` | `#936000` |
| Error / peligro | `#fdeaea` | `#a43838` |
| Información | `#e5f4f7` | `#14717b` |
| Secundario | `#edf1f5` | `#5f6f7f` |

### 3.2 Perfil Digiturno: recepción y gestor

Recepción y gestor convergen actualmente en **`#184b78`**, aunque el principio de `turnos-gestor.css` todavía declara `#19559b`. El token posterior reemplaza ese valor en el perfil claro. Algunas acciones aisladas, como «Ver cola» del modal de pendientes, conservan `#19559b`.

| Rol | Valor vigente | Aplicación |
| --- | --- | --- |
| Principal | `#184b78` | Recepción y gestor |
| Principal intenso / hover | `#123f67` | Botones principales |
| Azul intermedio | `#176396` | Recepción |
| Azul suave | `#edf6fd` | Selección secundaria y apoyo |
| Línea azul suave | `#cfe2f2` | Recepción y acciones secundarias |
| Éxito operativo | `#0a927f` | Selección confirmada, iniciar/finalizar atención |
| Superficie de éxito | `#ecfaf6` | Confirmación y selección |
| Advertencia del gestor | `#b97909` / `#fff7e7` | Texto / fondo |
| Peligro del gestor | `#b5473c` / `#fff2f0` | Texto / fondo |

El texto, el borde y la superficie de estos módulos también dependen de `--vz-body-color`, `--vz-secondary-color`, `--vz-border-color` y `--vz-secondary-bg`. Sus fallbacks no siempre son el valor efectivo: la plantilla cargada tiene prioridad al resolver `var(...)`.

El verde lima `--gt-accent: #94bd1f` sigue declarado, pero las reglas posteriores de iniciar/finalizar utilizan `--gt-success: #0a927f` con texto blanco. No tomar el primer bloque del archivo como diseño final.

### 3.3 Perfil Digiturno: reportes

| Rol | Valor |
| --- | --- |
| Principal | `#164e7c` |
| Cian | `#00a9ce` |
| Verde | `#74b843` |
| Superficie, texto y borde | Variables `--vz-*` de la plantilla, con fallbacks locales |

Los filtros aplicados se representan como chips. Las cifras usan números tabulares y los gráficos se acompañan de títulos, contexto y acceso a datos.

### 3.4 Perfil Digiturno: kiosco táctil

| Rol | Valor |
| --- | --- |
| Azul principal | `#064679` |
| Azul oscuro | `#073258` |
| Cian | `#087ea4` |
| Verde | `#087a68` |
| Texto | `#153d5c` |
| Texto secundario | `#557086` |
| Borde | `#cddce7` |
| Fondo | `#eef4f8` |
| Foco | `#079bbb` |
| Botón secundario | Fondo `#edf4fa`, borde `#bfd3e3` |
| Error | Fondo `#fff1ef`, texto `#a13726`, borde `#edc3ba` |
| Advertencia | Fondo `#fff5d8`, texto `#795710`, borde `#e8d5a0` |
| Éxito | Fondo `#e8f6f1`, texto `#087a68`, borde `#b4ddd0` |

### 3.5 Perfil Digiturno: pantalla de sala

- Azules declarados: oscuro `#063b75`, medio `#0569b9`, claro `#00a9de`.
- Texto general `#103962`; fondo base `#f1f6fb`; cabecera blanca y borde `#dbe6f1`.
- Fondo ambiental: `radial-gradient(ellipse at top left, #e8f1fb, #f6f9fc 70%)`.
- Bloque de llamado: `linear-gradient(125deg, #053976 0%, #005cab 68%, #0096d5 100%)`, con texto blanco.
- Prioridad: fondo `#fff0ce`, texto `#895400`.

### 3.6 Plantilla global Velzon

La aplicación interna carga Bootstrap personalizado, iconos, `app.min.css`, `custom.min.css`, `custom.css` y después los estilos del módulo. El primario global es violeta **`#695eef`**. PQR y las pantallas optimizadas de Digiturno aplican sus propios azules sin reemplazar toda la plantilla.

Tokens claros observados en `bootstrap.min.css`: cuerpo `#212529`, texto secundario `#878a99`, fondo `#f7f7f9`, borde `#e9ebec`, panel `#fff`, éxito `#11d1b7`, advertencia `#ffc061` y peligro `#ff7f41`. Los colores semánticos de la plantilla difieren de los componentes PQR; por ejemplo, una clase global `btn-success` no garantiza el verde de PQR.

## 4. Tipografía

| Entorno | Familia efectiva declarada | Escala / observación |
| --- | --- | --- |
| Aplicación interna PQR y Digiturno | `Outfit, sans-serif` | Base Bootstrap `.875rem`, peso 400, interlineado 1.5 |
| PQR público | Outfit por Bootstrap | También carga la fuente local desde el CSS minificado |
| Pantalla de sala | `Inter, Arial, sans-serif` | Carga Inter mediante Google Fonts en la vista actual |
| Kiosco | `system-ui, -apple-system, "Segoe UI", sans-serif` | Base `16px/1.35`; funcionamiento sin fuente remota |

`fonts-local.css` contiene Outfit normal con rango 300–700 y Poppins normal en pesos 300, 400, 500, 600 y 700, con variantes Latin/Latin Extended y `font-display: swap`. **Poppins está disponible, pero no es la fuente principal verificada de estas pantallas.** `app.min.css` también contiene declaraciones de hkgrotesk para otros usos de la plantilla.

Los archivos CSS solicitan pesos 650, 750, 800 y 900 en determinados componentes. No todos están cubiertos por las fuentes cargadas: Outfit local llega a 700 y la URL actual de Inter solicita 300–700. La representación puede resolverlos mediante aproximación o síntesis. Para una reproducción exacta, verificar el renderizado; ampliar los pesos sería una decisión nueva.

### Escalas compactas actuales

Valores en rem; la conversión a px depende del tamaño raíz, no del `.875rem` del cuerpo.

| Elemento | Tamaño |
| --- | --- |
| Título de bandeja PQR | `1.42rem` escritorio; `1.2rem` móvil |
| Subtítulo de bandeja | `.77rem` escritorio; `.73rem` móvil |
| Tabla de bandeja | `.76rem`; encabezados `.66rem` |
| Asunto en bandeja | `.8rem`, peso 750, máximo dos líneas |
| Título de radicación interna | `1.24rem`; variante estrecha `1.12rem` |
| Título de sección de radicación | `.98rem` |
| Etiquetas de radicación | `.78rem` |
| Controles de radicación | `.84rem` |
| Tabla Vista 360 | `.72rem`; encabezados `.68rem` |
| Tarjetas Vista 360 | `.74rem` |
| Controles Vista 360 | `.75rem` |
| Valores de detalle Vista 360 | `.73rem` |
| Título del gestor | `20px`, peso 650 |
| Título de tarjeta del gestor | `15px`, peso 650 |
| Títulos de kiosco | `26px` y `27px` |
| Controles de kiosco | `20px`; botones `18px`; teclas numéricas `32px` |
| Código llamado en sala | `120px × --tv-scale`, peso solicitado 900 |

Los tamaños pequeños de Vista 360 son una preferencia aprobada para ese componente. No deben convertirse en la escala general de un portal público o kiosco.

## 5. Formas, espaciado y efectos

No existe una única escala de espaciado centralizada para ambos módulos. Estos son valores y familias observados que permiten reproducir el acabado sin inventar un sistema ya implementado.

| Componente | Radio / espaciado observado |
| --- | --- |
| Tarjeta PQR base | Radio `16px`; sombra `0 7px 22px rgba(23,54,93,.055)` |
| Hero PQR base | Radio `18px`; padding `24px 26px`; degradado azul a 125° |
| Hero interno reciente | Radio `12px`; padding `12px 18px`; sombra `0 4px 14px rgba(23,54,93,.10)` |
| Sección de radicación interna | Radio `11px`; padding `13px 15px`; borde `1px` |
| Tarjeta de bandeja | Radio `11px` |
| Bloques de detalle Vista 360 | Radio `6px`; padding `10px` |
| Controles PQR base / internos | Radio `10px` / `8px` |
| Botón del gestor | Radio `8px`; altura mínima `44px` |
| Tarjeta del gestor | Radio `12px`; sombra `0 3px 12px rgba(15,55,100,.04)` |
| Tarjeta de recepción | Radio `14px`; padding ajustado por etapa |
| Panel de kiosco | Radio `16px`; padding `20px` |
| Botón / control de kiosco | Radio `12px`; mínimo `56px` de altura |
| Badge PQR | Radio `999px`; padding base `5px 8px`; icono y texto con gap `5px` |

Separaciones frecuentes: 6–8px dentro de componentes compactos; 10–14px entre tarjetas y filtros; 16–24px en áreas más amplias. Para un proyecto nuevo pueden exponerse como tokens; el código actual no obliga a una progresión matemática única.

El foco PQR utiliza borde turquesa y halo `0 0 0 3px rgba(21,149,163,.16)`. Las transiciones observadas son breves, habitualmente 150–200ms. Respetar `prefers-reduced-motion`; las actualizaciones de datos no deben desplazar la lectura.

## 6. Componentes y patrones que deben preservarse

### Cabeceras y navegación

- Conservar encabezado y navegación global Velzon al trabajar dentro de la aplicación integrada.
- Bandejas: título breve, propósito y acciones próximas; evitar que el encabezado consuma el alto del listado.
- Formularios extensos: navegación por secciones; la radicación interna usa Solicitante, Recepción, Solicitud y Orientación con navegación libre.
- Los pasos activos se distinguen mediante número, texto, superficie y estado accesible. No copiar nombres específicos de PQR a otro proceso.

### Botones

- PQR: acción principal azul sólido; secundaria con contorno azul o superficie clara; enlace para acciones terciarias.
- Digiturno gestor: llamar siguiente en azul; iniciar/finalizar en verde operativo; transferir con contorno azul; cancelar con texto/borde de peligro.
- Distinguir claramente acciones irreversibles o de cancelación; el color debe acompañar una etiqueta explícita.
- PQR base usa mínimo `40px` y el público `44px`. La radicación interna compacta usa controles `39px` y acciones `38px`.
- Bandeja de escritorio tiene búsqueda/filtro `35px` y acciones de fila `30px`. En móvil, búsqueda/filtro y acción de tarjeta suben a `42px`; accesos rápidos a `40px`.
- Vista 360 utiliza controles y muchas acciones de `36px`. Son excepciones de densidad, no medidas para kioscos.

### Formularios

- Etiqueta asociada, requerido visible, ayuda concreta y error junto al control.
- Inputs blancos con borde definido; foco visible; readonly/deshabilitado distinguibles. Conservar datos ante errores.
- Icono al inicio de un grupo decorado, con radio exterior izquierdo; control editable con radio exterior derecho. La fecha visible y su icono permanecen en la misma fila.
- Selectores con Select2 y búsqueda; catálogos dinámicos por AJAX, resultados acotados y paginación cuando aplique. Dentro de modales, el desplegable debe pertenecer al modal. Las listas pequeñas y fijas pueden tener opciones locales documentadas.
- Fechas con Flatpickr donde ya está integrado. En Vista 360, fechas de presentación `dd/mm/aaaa`.
- Al enviar con errores, una advertencia y foco al primer control aplicable; etiqueta y campo visibles bajo barras fijas. Al corregir, retirar mensaje, icono y estado de error juntos.
- La barra final de radicación permanece en el flujo y no tapa descripción, controles ni teclado móvil.

### Listados, tarjetas y filtros

- Tabla con encabezados compactos, identificador destacado, estado legible y acción explícita por fila.
- El hover de una fila PQR aporta orientación visual; **no convierte toda la fila en enlace**.
- En móvil conservar identificador, información para decidir, estado y acciones. Los campos secundarios pueden reorganizarse, sin perder el acceso a su detalle.
- Búsqueda, conteos, filtros activos y paginación deben conservar contexto. Texto largo con wrap o elipsis según el dato, sin desbordar.
- Los KPIs son apoyos compactos, no una colección de grandes tarjetas decorativas. Una métrica única de Vista 360 no se extiende sin límite: máximo observado `380px`.

### Modales y detalle

- Detalles breves y edición simple en modal; procesos extensos en página o flujo dedicado.
- Vista 360: modal `96vw`, máximo `1580px`, contenido hasta `94dvh`. En teléfono hasta `575.98px`, ocupa `100dvh`.
- Cabecera compacta azul clara, icono circular y contexto del solicitante. En móvil el contexto secundario se despliega mediante «Datos».
- «Ver detalle» reemplaza el listado dentro del mismo panel; «Volver al listado» recupera filtros, página, posición y foco.
- Mantener título, cierre y acciones accesibles; cuerpo con scroll. Advertir al cerrar una edición con cambios sin guardar.

### Carga, avisos y adjuntos

- Diferenciar esperando, consultando, coincidencia, ausencia, parcial y error. Una coincidencia de identidad no prueba afiliación activa.
- En consultas progresivas conservar registros recibidos. Mostrar avance real; no inventar porcentajes, tiempos ni conclusiones.
- Vista 360 usa aviso compacto y spinner pequeño en la pestaña. El éxito puede desaparecer tras tres segundos; error/parcial conservan aviso y reintento.
- Adjuntos internos: zona compacta con botón/arrastre, lista con nombre y tamaño, eliminación real y mensajes por archivo rechazado. El check local representa reglas locales satisfechas, no validación del contenido en servidor.
- Límites actuales de PQR: diez archivos, 10 MB por archivo, formatos definidos por el backend. Son reglas de ese módulo; en un proyecto nuevo derivarlos de su propio contrato.
- Digiturno usa avisos con borde lateral de estado, radio `10px`, sombra ligera y ancho máximo `360px`, ajustado al viewport. Los pendientes persistentes no se confunden con avisos de éxito temporales.

## 7. Responsive por perfil

| Perfil | Comportamiento comprobado |
| --- | --- |
| Bandeja PQR reciente | Tabla desde `1200px`; dos columnas de tarjetas entre `768` y `1199.98px`; una por debajo de `768px` |
| Radicación PQR interna | Container query desde `980px`: Solicitante/Recepción `2:1`, con segunda columna mínima `300px`; por debajo, apilado |
| Radicación PQR interna | Identidad con columnas Bootstrap en pares; contacto en tercios cuando cabe. No imponer tres tracks a toda la tarjeta |
| Adjuntos y autorización | Distribución `55:45` desde `980px` del contenedor; selector/listado en dos columnas desde `640px` de su propio componente |
| Vista 360 | Menú lateral `200px` desde `1200px` y `180px` desde `960px`; navegación horizontal por debajo; tablas desde `960px`, tarjetas por debajo |
| Recepción Digiturno | Container queries: servicios en tres columnas desde `700px` y cuatro desde `900px`; confirmación en dos paneles desde `900px`; apilado al estrecharse |
| Kiosco | Diseño táctil de pantalla completa, teclado propio y controles grandes; reglas por ancho y alto del dispositivo |
| Pantalla de sala | Composición principal `37:63` para llamados frente a publicidad/resumen; marco de medios 16:9 y escala mediante `--tv-scale` |

Elegir según el ancho disponible dentro de la navegación, no solo según el ancho de la ventana. Usar `minmax(0,1fr)`, `min-width:0` y límites de altura para evitar desbordamientos. Los breakpoints de una pantalla no sustituyen automáticamente a los de otra.

## 8. Modo oscuro

Hay adaptación explícita en bandeja PQR, recepción, gestor y reportes. Esto no demuestra cobertura completa de todo PQR, del kiosco o de cada modal.

- Bandeja PQR: texto principal `#e6eef8`, secundario `#afbed1`, borde `#43566b`; superficie de bandeja `#1e2b39`; búsqueda `#172433`; botón principal `#2c6d9f`, hover `#3985bb`.
- Gestor: principal `#80b9f5`, intenso `#295b8c`, peligro `#ffb4ad`; superficies y texto resueltos con la plantilla.
- Recepción: principal `#9bcdf1`; éxito `#78dec9`; superficies positivas con alfa.
- Los selectores existentes reconocen `data-bs-theme="dark"`; algunos componentes también `data-layout-mode="dark"`.

Al solicitar modo oscuro en un nuevo proyecto, definir un juego semántico completo y revisar cada estado. No invertir colores mediante filtros ni asumir que cambiar el fondo completa la adaptación.

## 9. Logotipo, iconos y recursos

- Logotipo comprobado en kiosco y pantalla de sala: `appv1_integrada/assets/images/logo_comfasucre.png`.
- También existen `logo_comfasucre_light.png`, `logo_white.png` y `favicon.ico`; verificar su contenido y contexto antes de elegir una variante.
- Conservar proporción mediante `object-fit: contain`. Medidas observadas: kiosco `138×58px`; sala `134×60px` multiplicados por la escala. No son un área de protección corporativa oficial.
- Iconografía predominante de los módulos revisados: **Remix Icon**, clases `ri-...-line`, mediante `icons.min.css`. Ejemplos: `ri-user-line`, `ri-add-line`, `ri-arrow-left-line`, `ri-bar-chart-box-line`.
- Iconos decorativos con `aria-hidden="true"`; botones solo con icono requieren nombre accesible. Preferir icono y texto para acciones importantes.
- Fuentes locales: `appv1_integrada/assets/fonts/web/`; las declaraciones apuntan a archivos WOFF2 y el CSS indica licencias OFL en esa carpeta.
- La instalación incluye Velzon; el kit conserva los recursos y avisos originales para la reutilización solicitada. Su inclusión no concede licencias adicionales: comprobar las condiciones de terceros para cada proyecto de destino. El kit no incluye todos los módulos de la plantilla.

## 10. Base CSS portable

Este bloque es una **adaptación propuesta para nuevos proyectos**, derivada de los perfiles anteriores. Los nombres `--brand-*` no existen como sistema compartido en la aplicación actual. No reemplaza los CSS de los módulos ni implementa por sí solo todos los componentes.

```css
.brand-app {
  --brand-primary: #17365d;
  --brand-primary-hover: #102b4b;
  --brand-secondary: #205b88;
  --brand-accent: #1595a3;
  --brand-text: #24364b;
  --brand-muted: #587086;
  --brand-surface: #fff;
  --brand-soft: #eef5fa;
  --brand-border: #d9e4ed;
  --brand-control-border: #b9cad8;
  --brand-focus: rgba(21, 149, 163, .16);
  --brand-radius-control: 8px;
  --brand-radius-card: 11px;
  --brand-shadow: 0 3px 12px rgba(23, 54, 93, .035);
  --brand-font: "Outfit", system-ui, sans-serif;
  color: var(--brand-text);
  font-family: var(--brand-font);
  font-size: .875rem;
  line-height: 1.5;
}
.brand-app[data-brand-profile="digiturno"] {
  --brand-primary: #184b78;
  --brand-primary-hover: #123f67;
  --brand-secondary: #176396;
  --brand-accent: #0a927f;
  --brand-soft: #edf6fd;
  --brand-focus: rgba(23, 99, 150, .18);
  --brand-radius-card: 12px;
}
.brand-app .brand-card {
  min-width: 0;
  padding: 13px 15px;
  background: var(--brand-surface);
  border: 1px solid var(--brand-border);
  border-radius: var(--brand-radius-card);
  box-shadow: var(--brand-shadow);
}
.brand-app .brand-control {
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  min-height: 44px;
  padding: 8px 12px;
  font: inherit;
  color: var(--brand-text);
  background: var(--brand-surface);
  border: 1px solid var(--brand-control-border);
  border-radius: var(--brand-radius-control);
}
.brand-app .brand-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 44px;
  padding: 8px 14px;
  font: inherit;
  font-weight: 600;
  color: #fff;
  background: var(--brand-primary);
  border: 1px solid var(--brand-primary);
  border-radius: var(--brand-radius-control);
  cursor: pointer;
}
.brand-app .brand-button:hover:not(:disabled) {
  background: var(--brand-primary-hover);
  border-color: var(--brand-primary-hover);
}
.brand-app :is(.brand-control, .brand-button):focus-visible {
  outline: 2px solid var(--brand-accent);
  outline-offset: 2px;
  box-shadow: 0 0 0 3px var(--brand-focus);
}
.brand-app .brand-button:disabled {
  opacity: .55;
  cursor: default;
}
```

Cargar Outfit por separado y resolver sus rutas en el proyecto de destino. El bloque adopta controles de `44px` como punto de partida; las densidades específicas están documentadas en la sección 6. No aplicar este bloque administrativo al kiosco o a la pantalla de sala.

## 11. Revisión antes de entregar un proyecto

- [ ] El perfil visual está identificado y la paleta se usa mediante roles consistentes.
- [ ] La fuente realmente se descarga o existe; sus pesos y fallbacks se comprueban en el navegador.
- [ ] Título, filtros y KPIs dejan espacio al contenido principal.
- [ ] Campos, errores y acciones son utilizables con teclado y en móvil.
- [ ] Listados se convierten en tarjetas cuando corresponde; el contenido no desborda.
- [ ] Se revisan carga, vacío, error, parcial, seleccionado, foco, readonly y deshabilitado.
- [ ] Acciones o barras fijas no cubren contenido ni el teclado del teléfono.
- [ ] Color acompañado por texto/icono; contraste comprobado en las parejas de texto/fondo utilizadas.
- [ ] Movimiento reducido respetado; números, fechas y textos largos conservan legibilidad.
- [ ] Si se ofrece modo oscuro, se verifica también en modales, selectores y estados.

La extracción de valores se hizo mediante lectura de código y documentación. El kit añadido se comprobó además en navegador, como se detalla en la sección 14.7. No se realizó una auditoría de contraste; los valores observados no certifican por sí solos conformidad de accesibilidad.

## 12. Prompt listo para nuevos proyectos

> Usa `branding.md` como referencia visual. Construye [nombre y objetivo del proyecto] para [público] en [dispositivos], con el perfil [administrativo PQR / operación Digiturno / kiosco / pantalla de sala]. Conserva la paleta, tipografía, densidad, bordes, tarjetas y estados del perfil elegido. Organiza los formularios por secciones, usa tablas y tarjetas según el espacio disponible y mantén las acciones accesibles. Implementa estados de carga, vacío, error y foco. Adapta los nombres y reglas al nuevo proceso. Distingue las decisiones tomadas de esta guía de cualquier propuesta adicional. Entrega la interfaz y explica qué verificaste.

## 13. Fuentes locales y mantenimiento

Todas las rutas de esta sección son relativas a la raíz del proyecto original. Permiten rastrear los valores cuando este archivo se copia a otro repositorio.

| Fuente | Qué aporta |
| --- | --- |
| `docs/agent/DESIGN_SYSTEM.md` | Preferencias aprobadas, referencias visuales y límites de cada patrón |
| `appv1_integrada/application/views/template/css.php` | Orden real de carga de estilos internos |
| `appv1_integrada/assets/css/bootstrap.min.css` | Tokens efectivos de Bootstrap y fuente base |
| `appv1_integrada/assets/css/app.min.css` | Tipografía y componentes de la plantilla cargada |
| `appv1_integrada/assets/css/fonts-local.css` | Familias, pesos y archivos WOFF2 locales |
| `appv1_integrada/assets/css/pqr.css` | Paleta PQR; bandeja v2–v5; radicación interna consolidada y estados |
| `appv1_integrada/assets/css/pqr-360-responsive.css` | Acabado, escala y responsive actuales de Vista 360 |
| `appv1_integrada/assets/css/pqr-permissions.css` | Variante de administración delegada de permisos |
| `appv1_integrada/application/views/pqr/index.php` | Clases y composición de bandeja vigente |
| `appv1_integrada/application/views/pqr/form.php` | Estructura de radicación y campos |
| `appv1_integrada/application/views/pqr/_precheck_modal.php` | Modal y carga posterior del CSS responsive |
| `appv1_integrada/application/views/pqr/public_head.php` | Estilos y tipografía del portal público |
| `appv1_integrada/assets/css/turnos-recepcion.css` | Recepción y flujo por etapas, incluidos overrides posteriores |
| `appv1_integrada/assets/css/turnos-gestor.css` | Gestor, acciones operativas y aviso persistente de pendientes |
| `appv1_integrada/assets/css/turnos-dashboard.css` | Reportes, métricas, filtros y gráficos |
| `appv1_integrada/assets/css/turnos-avisos.css` | Avisos flotantes del módulo |
| `appv1_integrada/assets/css/turnos-kiosco.css` | Diseño táctil independiente |
| `appv1_integrada/assets/css/turnos-pantalla-publica.css` | Pantalla de sala, escala y composición |
| `appv1_integrada/application/views/turnos/recepcion.php` y `gestor.php` | Carga de estilos de operación |
| `appv1_integrada/application/views/turnos/turno_publico.php` | Recursos y documento independiente del kiosco |
| `appv1_integrada/application/views/turnos/pantalla_global_velzon.php` | Pantalla de sala, Inter y logotipo |
| `appv1_integrada/application/views/reportes/turnos.php` | Carga del CSS de reportes |
| `appv1_integrada/application/controllers/Pqr.php`, `Turnos.php` y `Turnos_kiosco.php` | Confirmación de las vistas usadas por los módulos |

No se utilizaron respaldos, archivos `.backup-*`, paquetes ni exportaciones como fuente de estilos vigentes. Antes de actualizar valores, verificar el controlador, la vista, el archivo realmente cargado, el orden de cascada y las reglas responsive. Registrar como estándar nuevo solo las preferencias confirmadas por el usuario.

## 14. Kit para copiar a nuevos proyectos

**Entrega:** `branding-comfasucre-20261026.zip`. En el proyecto original se encuentra en `artifacts/`; también se conserva la carpeta descomprimida `artifacts/branding-comfasucre-20261026/`.

Este kit responde a la preferencia confirmada de mantener el diseño con sus archivos y estructura HTML. El bloque portable de la sección 10 es orientativo; para obtener la mayor fidelidad, usar los CSS originales incluidos y partir del HTML de ejemplo correspondiente.

### 14.1 Contenido

```text
branding-comfasucre-20261026/
  branding.md                     Esta guía, en la misma versión que la raíz
  index.html                      Catálogo navegable de las plantillas
  pqr-bandeja.html                 Cabecera compacta, KPIs, búsqueda, tabla y tarjetas
  pqr-formulario.html              Secciones, cuadrícula, iconos, fecha y adjuntos
  pqr-360.html                     Modal, navegación, listado y detalle
  digiturno-recepcion.html         Consulta y selección de servicios
  digiturno-gestor.html            Atención actual, acciones y cola
  digiturno-reportes.html          Indicadores y gráfico con datos ficticios
  kiosco.html                     Cuerpo HTML original, sin APIs ni operación
  pantalla-sala.html              Composición original de sala con datos ficticios
  assets/
    css/                          Base Velzon/Bootstrap y estilos de los módulos
    js/                           Comportamientos originales y scripts de referencia
    libs/                         Librerías usadas por los componentes incluidos
    select2/                      CSS, JS e idioma español
    fonts/                        Fuentes de texto e iconos, conservando rutas
    images/                       Logotipos y dependencias locales de los CSS
  dist/jquery.validate.min.js     Ruta original del validador
  kit/                            Adaptadores exclusivos de demostración
  referencias/vistas/             Vistas originales guardadas como .php.txt
  manifest.json                   Origen, tamaño y SHA-256 de cada archivo
  LICENCIAS-Y-ORIGEN.md            Procedencia y condiciones de reutilización
```

Los CSS y JS copiados se conservan byte por byte. Los ejemplos administrativos son adaptaciones estáticas del marcado existente, no exportaciones completas de las pantallas en ejecución. El kiosco conserva el cuerpo de su vista y la sala su composición principal, retirando PHP y llamadas operativas. Los datos son ficticios.

### 14.2 Copiar y comenzar

1. Descomprime el ZIP en una carpeta nueva y abre `index.html`. Para integrar las páginas en un servidor puedes servir esa misma carpeta sin PHP.
2. Copia **`assets/` y `dist/` conservando la estructura relativa**. No renombres `fonts/`, `libs/` o `select2/` sin actualizar sus referencias. Si el destino ya usa carpetas con esos nombres, integra los archivos de forma explícita y revisa versiones antes de sustituirlos.
3. Copia el HTML del perfil elegido. Conserva contenedores, clases, IDs requeridos por los scripts y atributos de accesibilidad; cambia los textos y datos por los del nuevo proceso.
4. Los archivos `kit/` permiten probar los ejemplos. No son lógica productiva: sustitúyelos por la integración de tu aplicación al conectar servicios reales.
5. Conecta únicamente los scripts de negocio que necesite la pantalla, configurando endpoints, permisos, tokens y contratos del nuevo backend. Ningún ejemplo intenta consultar PQR, Genesys o Digiturno.
6. Verifica el resultado con contenido real en escritorio y móvil. La estructura por sí sola no reproduce datos, permisos ni condiciones de una sesión de producción.

### 14.3 Orden de CSS

Para una página administrativa PQR, usar este orden. Los estilos del módulo van después de los globales:

```html
<link rel="stylesheet" href="assets/css/bootstrap.min.css">
<link rel="stylesheet" href="assets/css/icons.min.css">
<link rel="stylesheet" href="assets/css/app.min.css">
<link rel="stylesheet" href="assets/css/custom.min.css">
<link rel="stylesheet" href="assets/css/custom.css">
<link rel="stylesheet" href="assets/select2/dist/css/select2.min.css">
<link rel="stylesheet" href="assets/libs/flatpickr/flatpickr.min.css">
<link rel="stylesheet" href="assets/libs/sweetalert2/sweetalert2.min.css">
<link rel="stylesheet" href="assets/css/pqr.css">
<!-- Solo para el modal de Vista 360: -->
<link rel="stylesheet" href="assets/css/pqr-360-responsive.css">
```

En Digiturno cargar el CSS específico (`turnos-recepcion.css`, `turnos-gestor.css` o `turnos-dashboard.css`) después de la base, además de `turnos-avisos.css` si se utilizan avisos. No cargar `turnos-kiosco.css` ni `turnos-pantalla-publica.css` dentro de las páginas administrativas: tienen reglas globales destinadas a documentos independientes.

`bootstrap.min.css` y `app.min.css` importan `fonts-local.css`, que a su vez necesita `assets/fonts/web/`. `icons.min.css` requiere las fuentes de iconos en `assets/fonts/`. El kit copia también las dependencias locales encontradas en `url(...)` de los CSS.

La pantalla de sala de la aplicación original obtiene Inter desde Google Fonts. El kit añade `inter-local.css`, los pesos 300–700 y su licencia OFL para que los ejemplos no dependan de esa conexión. Es una adaptación de distribución: el CSS original de sala permanece intacto y la versión descargada de Inter puede diferir de una descarga histórica del CDN.

### 14.4 Orden de JS y alcance

Para formularios que reutilicen los componentes PQR:

```html
<script src="assets/js/funciones/jquery-3.6.4.min.js"></script>
<script src="dist/jquery.validate.min.js"></script>
<script src="assets/select2/dist/js/select2.min.js"></script>
<script src="assets/select2/dist/js/i18n/es.js"></script>
<script src="assets/libs/flatpickr/flatpickr.min.js"></script>
<script src="assets/libs/flatpickr/l10n/es.js"></script>
<script src="assets/libs/bootstrap/js/bootstrap.bundle.min.js"></script>
<script src="assets/libs/sweetalert2/sweetalert2.min.js"></script>
<script src="assets/libs/cleave.js/cleave.min.js"></script>
<script src="assets/js/pqr-validation.js"></script>
<script src="assets/js/pqr-components.js"></script>
<!-- Solo si existe la estructura completa de adjuntos internos: -->
<script src="assets/js/pqr-attachments.js"></script>
```

Estos scripts deben estar cargados antes de `DOMContentLoaded`. Si un framework monta componentes después, llamar explícitamente a sus inicializadores cuando existan, o implementar el adaptador para el ciclo de vida del framework. Evitar duplicar jQuery o inicializar Select2 dos veces.

| Script / grupo | Qué se puede reutilizar y qué necesita adaptación |
| --- | --- |
| `pqr-components.js` | Iconos, etiquetas, fechas y máscaras. Reconoce nombres concretos de campos; el celular se normaliza al formato colombiano. `.pqr-municipality` necesita `data-url` y respuesta `{results, pagination}`. No añadir esa clase sin endpoint |
| `pqr-validation.js` | Mensajes, foco y validación. Incluye reglas específicas de PQR, mayúsculas y límites de adjuntos; adaptar a las reglas reales del nuevo proceso |
| `pqr-attachments.js` | Selector, arrastre, acumulación, eliminación y lista local. Requiere `PqrValidation`, `#pqrFiles` y todos los `data-files-*` del ejemplo |
| `turnos-avisos.js` | Avisos de éxito/información; necesita Bootstrap Toast y `turnos-avisos.css`. Ejemplo: `TurnosAvisos.mostrar('Título', 'Mensaje', 'info')` |
| `turnos-fechas.js` | Formateo de fechas; usa `America/Bogota`. Revisar la zona si el proyecto cambia de región |
| `turnos-pantalla-layout.js` | Ajusta escala y capacidad de la pantalla; necesita el DOM de sala y `TurnosPantallaLayout.init(callback)` |
| `pqr-security.js`, `pqr-inbox.js`, `pqr-history.js`, `pqr-permissions.js` | Referencia de integración; necesitan backend, configuración y contratos PQR. `pqr-security.js` no sustituye la autorización del servidor |
| `pqr-precheck.js`, `pqr-360-workspace.js`, `pqr-statistics.js` | Revisión, registros y reportes; requieren datos/servicios específicos y el DOM correspondiente. Estadísticas también utiliza ApexCharts |
| `turnos-recepcion.js`, `turnos-kiosco.js`, `turnos-dashboard.js`, `turnos-anuncios.js` | Scripts operativos; no cargarlos sin adaptar endpoints, configuración, datos y DOM. Pueden consultar o modificar estado al inicializarse |
| `turnos-ticket.js`, `turnos-hora-editor.js`, `turnos-gestor-avisos.js` | Referencia para ticket/impresión, edición de horario y avisos del gestor. Revisar sus servicios y permisos antes de activarlos |
| `layout.js`, `app.js` | Referencia del armazón Velzon. Necesitan la plantilla y sus plugins; no son necesarios para abrir los ejemplos, que usan un adaptador pequeño propio |

Las vistas originales de gestor, formulario, bandeja y sala contienen también **JS inline**. Se conservan en `referencias/vistas/`; copiar únicamente los `.js` externos no reconstruye esos comportamientos. Las vistas `.php.txt` son material de referencia, no páginas ejecutables: requieren CodeIgniter, helpers, variables, permisos y backend. No se deben renombrar y publicar sin adaptación.

### 14.5 Estructura HTML que sostiene el diseño

Base administrativa:

```html
<div id="layout-wrapper">
  <header id="page-topbar">...</header>
  <aside class="app-menu navbar-menu">...</aside>
  <main class="main-content">
    <div class="page-content">
      <div class="container-fluid pqr-shell pqr-inbox pqr-inbox-v2">
        <section class="pqr-hero pqr-hero-compact pqr-inbox-hero">...</section>
        <section class="pqr-priority-summary pqr-priority-compact">...</section>
        <section class="card pqr-card pqr-inbox-card">
          <div class="pqr-inbox-toolbar">...</div>
          <div id="pqrResults">
            <div class="pqr-desktop-list table-responsive">...</div>
            <div class="pqr-mobile-list">...</div>
          </div>
        </section>
      </div>
    </div>
  </main>
</div>
```

| Pantalla | Contrato de marcado |
| --- | --- |
| Formulario interno | `.container-fluid.pqr-shell.pqr-create-internal` → `#pqrCreate` → secciones `.pqr-form-section`, con `.pqr-create-applicant`, `.pqr-create-reception`, `.pqr-create-request`, `.pqr-create-guidance` y `.pqr-create-actions` |
| Campos de identidad | `.row` con `.col-md-6`; contacto con `.col-md-4`; grupos decorados `.input-group.pqr-icon-field` con icono primero |
| Vista 360 | `#pqrPrecheckModal.modal.pqr-shell.pqr-is-360` → `.modal-dialog` → `.modal-content` → cabecera, cuerpo y pie; dentro del cuerpo `.pqr-360-layout` con sidebar y main |
| Recepción | `.recepcion-turnos#recepcionApp[data-stage]` → `.rt-header`, `.rt-progress`, `.rt-workspace`; la etapa gobierna qué bloques aparecen |
| Gestor | `.main-content.gt-main` → `.page-content.gt-page` → `.container-fluid.gestor-turnos` → `.gt-toolbar`, `.gt-workspace`, `.gt-current` y `.gt-queue` |
| Kiosco | Documento independiente: `body.kiosco-page` → `#turnosKiosco` → cabecera, progreso, mensaje y `.kiosco-contenido` con paneles `[data-paso]` |
| Sala | Documento independiente: `.turnos-layout.turnos-public-v2` → `.turnos-topbar` y `.turnos-main` → `.turnos-col-left` y `.turnos-col-right` |

Conservar IDs que el CSS usa como selector y los que consulta el JS. Al renombrarlos, actualizar conjuntamente CSS, JS, `for`, `aria-controls`, `aria-labelledby` y selectores de apertura de modales. No copiar un estilo aislado sin su contenedor de alcance.

### 14.6 Qué entregar al siguiente agente

> Usa el ZIP del kit y `branding.md`. Parte de la plantilla HTML [nombre] para construir [proyecto]. Conserva los CSS originales, fuentes, iconos, estructura de contenedores y clases para mantener la identidad de PQR/Digiturno. Modifica contenido y conecta el backend del nuevo proceso; sustituye los adaptadores `kit/` por lógica productiva. Activa solo los scripts necesarios y adapta sus contratos. Revisa escritorio, móvil, foco, validación y estados antes de entregar. No redefinas la paleta ni cambies la densidad sin una solicitud expresa.

El kit excluye credenciales, configuración del servidor, `.env`, sesiones, uploads y respaldos. Es una base de presentación y referencia de integración; no incluye la aplicación PHP ni habilita servicios de producción.

### 14.7 Comprobaciones del paquete

Se revisaron las nueve páginas de entrada/ejemplo en dos anchos (1366px y 390px), con recursos externos bloqueados: sin errores de JavaScript, sin respuestas HTTP de error y sin desbordamiento horizontal del documento. Se verificaron además búsqueda y estado vacío de bandeja, validación del formulario, selección/limpieza de adjuntos, listado/detalle de Vista 360 y teclado del kiosco. Se inspeccionaron capturas de escritorio y móvil.

El manifiesto permite comprobar que los archivos originales se copiaron sin modificaciones y que la guía del ZIP coincide con la de la raíz. Los CSS de origen contienen una referencia histórica a `hkgrotesk-bold.eot` que ya está ausente en la aplicación; se registra en `referenciasCssAusentesEnOrigen` del manifiesto, sin inventar un archivo de sustitución. Las fuentes usadas por los ejemplos cargaron durante la revisión; el fallback WOFF de esa familia sí se incluye.

Estas comprobaciones validan el kit de presentación. No prueban los scripts operativos contra un nuevo backend ni certifican equivalencia píxel a píxel con todas las pantallas autenticadas del sistema original.
