# Macondo TV en Windows 11 Pro — guía para el técnico

Equipo de sala: **Dell OptiPlex 3000 Thin Client** (Intel Pentium Silver N6005, 16 GB RAM, SSD 512 GB,
Windows 11 Pro) conectado por HDMI al televisor. Muestra `/tv` de Macondo Digital en Microsoft Edge a
pantalla completa (modo kiosco), sin sonido, 24 h o en el horario de la biblioteca.

Dirección principal: **`https://macondo.comfasucre.co/tv`** (dominio público, certificado válido).
Respaldo si la biblioteca se queda sin internet y el servidor está en la red local:
`https://192.168.31.240:3443/tv?origin=https://192.168.31.240:3443` (HTTPS con la CA propia de la
biblioteca) o `http://192.168.31.240:3100/tv?origin=http://192.168.31.240:3100`.

> `?origin=` indica a la TV qué dirección deben llevar los códigos QR que escanean las tablets.
> Con el dominio público no hace falta (la propia dirección de la página ya es la pública).
> Otros parámetros útiles: `&animaciones=0` desactiva transiciones si el equipo va justo (el
> OptiPlex 3000 las mueve bien a 1080p; en 4K probar y, si hay tirones, añadirlo).

## Contenido de esta carpeta

| Archivo | Para qué |
|---|---|
| `Instalar-Macondo-TV.ps1` | Instalación completa (una vez, como administrador). |
| `Iniciar-Macondo-TV.cmd` | Abrir la TV a mano sin reiniciar (doble clic). |
| `Desinstalar-Macondo-TV.ps1` | Quitar la tarea y devolver la energía/protector de pantalla a valores normales. |
| `LEEME-TV-Windows.md` | Esta guía. |
| `ca.crt` (opcional) | Copia de `infra/certs/ca.crt`: solo para la dirección de respaldo por IP con HTTPS. |

## 1. Preparar Windows (15 minutos)

1. **Actualizar Windows** por completo antes de empezar (Configuración → Windows Update) y reiniciar.
2. **Cuenta local `macondotv`** (sin cuenta Microsoft): Configuración → Cuentas → Otros usuarios →
   Agregar cuenta → «No tengo la información de inicio de sesión» → «Agregar un usuario sin cuenta
   Microsoft» → nombre `macondotv`, contraseña sencilla pero no vacía (apúntala en el inventario de la
   biblioteca, no en este repositorio). Tipo: **Usuario estándar**. Deja también tu cuenta de administrador.
3. **Cerrar sesión e iniciar como `macondotv`** (todo lo que sigue se hace dentro de esa sesión).
4. **Inicio de sesión automático** (para que la TV arranque sola tras un corte de luz):
   - `Win + R` → `netplwiz` → desmarca «Los usuarios deben escribir su nombre y contraseña…» → Aceptar →
     escribe la contraseña de `macondotv`.
   - Si la casilla no aparece (equipos con Windows Hello): Configuración → Cuentas → Opciones de inicio de
     sesión → desactiva «Para mejorar la seguridad, permitir solo el inicio de sesión de Windows Hello…» y
     repite; o usa la herramienta **Autologon** de Sysinternals (Microsoft). Ningún script de esta carpeta
     guarda contraseñas.
5. **Sin notificaciones**: Configuración → Sistema → Notificaciones → desactivar «Notificaciones» y, en
   «No molestar», activar «Activar No molestar automáticamente» para siempre. (El instalador también
   desactiva las notificaciones emergentes por registro para este usuario.)
6. **Windows Update de noche**: Configuración → Windows Update → Opciones avanzadas → Horas activas →
   **Manualmente**, de 7:00 a 20:00 (ajústalo al horario de la biblioteca). Así reinicia de madrugada y,
   con el inicio de sesión automático, la TV vuelve sola.
7. **Pantalla**: Configuración → Sistema → Pantalla → resolución recomendada del televisor
   (1920×1080 o 3840×2160). Escala: 100 % en 1080p; en 4K puede quedarse en 100 % (la página se adapta al
   tamaño de la ventana) o 150 % si el texto del escritorio se ve muy pequeño al administrar.
   Desactiva el «Cambio automático de HDR» y «Ajustes de color automáticos» si el televisor parpadea.
8. **Sonido**: la TV es muda por diseño. Clic derecho en el altavoz → Configuración de sonido → salida
   HDMI del televisor → **Silenciar** (o volumen 0). Si el televisor tiene «Modo tienda»/ahorro, desactívalos
   y pon «Apagado automático: nunca» en el propio televisor.

## 2. Instalar (una vez)

1. Copia esta carpeta al equipo (p. ej. `C:\MacondoTV\`). Si vas a usar la dirección por IP con HTTPS,
   copia también `infra/certs/ca.crt` dentro de la carpeta.
2. Dentro de la sesión `macondotv`, clic derecho en el menú Inicio → **Terminal (administrador)** (se
   pedirá la contraseña del administrador) y ejecuta:
   ```powershell
   Set-Location C:\MacondoTV
   powershell -ExecutionPolicy Bypass -File .\Instalar-Macondo-TV.ps1
   ```
3. Elige la URL: `1` (dominio público, recomendado), `2`/`3` (red local) o escribe otra. El script:
   - instala la CA local **solo** si la dirección es una IP privada con `https://` (con el dominio público
     se omite porque el certificado ya es válido);
   - crea la tarea programada **«Macondo TV»** que abre Edge en kiosco al iniciar sesión (10 s después);
   - deja la pantalla y la suspensión en «nunca», desactiva la hibernación, el protector de pantalla, el
     bloqueo al apagar la pantalla y las notificaciones emergentes;
   - escribe el registro en `C:\ProgramData\MacondoTV\instalacion.log` y la URL en `config.json`.
4. Prueba sin reiniciar: doble clic en `Iniciar-Macondo-TV.cmd`. Debe verse la cabecera «Biblioteca TV»
   con el reloj y el rail «Programación» con 6 bloques. Luego reinicia el equipo: la TV debe aparecer sola.

Parámetros útiles del instalador (sin preguntas):

```powershell
powershell -ExecutionPolicy Bypass -File .\Instalar-Macondo-TV.ps1 -Url "https://macondo.comfasucre.co/tv?animaciones=0" -SinPreguntar
powershell -ExecutionPolicy Bypass -File .\Instalar-Macondo-TV.ps1 -Url "https://192.168.31.240:3443/tv?origin=https://192.168.31.240:3443" -CaPath C:\MacondoTV\ca.crt -SinPreguntar
```

Qué lanza exactamente la tarea (Edge; si no existe, Chrome con los mismos argumentos salvo los `--edge-*`):

```
msedge.exe --kiosk "<URL>" --edge-kiosk-type=fullscreen --no-first-run --autoplay-policy=no-user-gesture-required
           --disable-features=TranslateUI,msEdgeSidebarV2,msHubApps --kiosk-idle-timeout-minutes=0
           --disable-session-crashed-bubble --disable-infobars --noerrdialogs --no-default-browser-check
```

`--no-first-run` y `--kiosk` evitan el asistente de bienvenida y la sincronización de Edge; si aun así
aparece un aviso la primera vez, ciérralo una vez con `Alt + F4` y vuelve a lanzar: no se repite.

## 3. Operación diaria

| Quiero… | Cómo |
|---|---|
| Salir del kiosco un momento | `Alt + F4` cierra Edge. También `Ctrl + Alt + Supr` → Administrador de tareas. |
| Volver a abrir la TV | Doble clic en `Iniciar-Macondo-TV.cmd`, o cerrar sesión y entrar de nuevo. |
| Cambiar la URL (p. ej. pasar de la IP al dominio) | Ejecutar otra vez `Instalar-Macondo-TV.ps1` (sustituye la tarea; idempotente). |
| Ver qué se instaló / depurar | `C:\ProgramData\MacondoTV\instalacion.log` y `config.json`; Programador de tareas → «Macondo TV». |
| Cambiar la programación de la TV | Panel `/admin` → pestaña TV. La pantalla recarga la programación cada 5 min sin tocar el equipo. |
| La TV muestra «modo respaldo» o «programación guardada» | No llega a la API: revisa red/servidor. Sigue mostrando la última programación buena. |
| Quitar todo | `Desinstalar-Macondo-TV.ps1` (añade `-QuitarCA` para retirar la CA local). Luego, si se quiere, desactiva el inicio automático en `netplwiz`. |

## 4. Comprobaciones finales

- [ ] Tras reiniciar, la TV aparece sola en pantalla completa sin cursor ni barras.
- [ ] Pasan 30 min sin tocar nada y la pantalla sigue encendida (ni protector ni bloqueo).
- [ ] Al escanear el QR del «Libro de la semana» con una tablet se abre la ficha (dirección correcta).
- [ ] El televisor no tiene sonido (HDMI silenciado).
- [ ] Windows Update programado fuera del horario de la biblioteca.
- [ ] Contraseña de `macondotv` y del administrador anotadas en el inventario de la biblioteca.

## Notas

- Los scripts están escritos para **Windows PowerShell 5.1** (el que trae Windows 11) y también funcionan
  en PowerShell 7. Se revisaron línea a línea pero **no se han ejecutado en un equipo Windows** durante el
  desarrollo (no había uno disponible): la primera instalación debe hacerla el técnico con el registro
  `instalacion.log` a la vista y reportar cualquier mensaje en rojo.
- La CA local (`ca.crt`) dura 10 años; el certificado del servidor por IP, 825 días. Con el dominio público
  nada de esto aplica.
- No se usa el «Acceso asignado» (kiosco nativo de Windows) porque obliga a una app UWP o a Edge con
  política de dispositivo; la tarea programada + `--kiosk` da el mismo resultado y se administra con
  menos pasos. Si la biblioteca cuenta con Intune/MDM, puede migrarse a Acceso asignado con la misma URL.
