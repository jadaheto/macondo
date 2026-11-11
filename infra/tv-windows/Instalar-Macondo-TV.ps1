#Requires -RunAsAdministrator
<#
.SYNOPSIS
  Instala "Macondo TV" en el equipo de sala (Dell OptiPlex 3000 Thin Client, Windows 11 Pro):
  Microsoft Edge en modo kiosco a pantalla completa mostrando /tv de Macondo Digital, sin suspensión
  ni apagado de pantalla, arrancando solo al iniciar sesión.

.DESCRIPTION
  Ejecutar UNA vez como administrador, con la sesión del usuario que quedará conectado a la TV
  (recomendado: cuenta local "macondotv" con inicio de sesión automático; ver LEEME-TV-Windows.md).
  Pasos:
    1. Pide/acepta la URL de la TV (por defecto https://macondo.comfasucre.co/tv).
    2. Solo si la URL apunta a una IP privada o a un host .local (red de la biblioteca sin internet):
       instala la CA local de la biblioteca (infra/certs/ca.crt) en "Entidades de certificación raíz de
       confianza" del EQUIPO, para que Edge acepte https://192.168.x.x:3443. Con el dominio público
       el certificado ya es válido y este paso se omite.
    3. Crea la tarea programada "Macondo TV" (al iniciar sesión del usuario actual) que lanza Edge
       (o Chrome si Edge no existe) en modo kiosco.
    4. Energía (con corriente): pantalla nunca se apaga, nunca suspende, hibernación desactivada.
    5. Protector de pantalla desactivado y sin tiempo de espera de bloqueo (HKCU del usuario actual).
    6. Escribe un registro en %ProgramData%\MacondoTV\instalacion.log.
  No guarda contraseñas. El inicio de sesión automático se configura aparte (netplwiz / Autologon).

.PARAMETER Url
  URL completa de la TV. Ejemplos:
    https://macondo.comfasucre.co/tv                                  (dominio público: por defecto)
    https://192.168.31.240:3443/tv?origin=https://192.168.31.240:3443 (red local con CA propia)
    http://192.168.31.240:3100/tv?origin=http://192.168.31.240:3100   (red local sin HTTPS)
  Nota: ?origin= solo hace falta cuando la dirección que abre la TV no es la misma que escanearán
  las tablets en los códigos QR. Con el dominio público no hace falta.

.PARAMETER CaPath
  Ruta del certificado de la CA local (por defecto ..\certs\ca.crt junto a este script, o .\ca.crt).

.PARAMETER SinPreguntar
  No pide confirmación: usa -Url (o el valor por defecto) directamente.

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File .\Instalar-Macondo-TV.ps1
.EXAMPLE
  powershell -ExecutionPolicy Bypass -File .\Instalar-Macondo-TV.ps1 -Url "https://192.168.31.240:3443/tv?origin=https://192.168.31.240:3443" -SinPreguntar
#>
[CmdletBinding()]
param(
  [string]$Url = 'https://macondo.comfasucre.co/tv',
  [string]$CaPath = '',
  [switch]$SinPreguntar
)

$ErrorActionPreference = 'Stop'
$TaskName = 'Macondo TV'
$LogDir = Join-Path $env:ProgramData 'MacondoTV'
$LogFile = Join-Path $LogDir 'instalacion.log'
$ConfigFile = Join-Path $LogDir 'config.json'

function Write-Log {
  param([string]$Message, [string]$Level = 'INFO')
  $line = '{0} [{1}] {2}' -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $Level, $Message
  Write-Host $line
  Add-Content -Path $LogFile -Value $line -Encoding UTF8
}

function Test-PrivateHost {
  param([string]$HostName)
  if ([string]::IsNullOrWhiteSpace($HostName)) { return $false }
  if ($HostName -ieq 'localhost' -or $HostName -like '*.local') { return $true }
  $ip = $null
  if ([System.Net.IPAddress]::TryParse($HostName, [ref]$ip)) {
    $b = $ip.GetAddressBytes()
    if ($ip.AddressFamily -eq 'InterNetwork') {
      if ($b[0] -eq 10) { return $true }
      if ($b[0] -eq 127) { return $true }
      if ($b[0] -eq 192 -and $b[1] -eq 168) { return $true }
      if ($b[0] -eq 172 -and $b[1] -ge 16 -and $b[1] -le 31) { return $true }
      if ($b[0] -eq 169 -and $b[1] -eq 254) { return $true }
    }
    return $false
  }
  return $false   # nombre DNS público (p. ej. macondo.comfasucre.co)
}

function Find-Browser {
  $edge = @(
    "$env:ProgramFiles (x86)\Microsoft\Edge\Application\msedge.exe",
    "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe"
  )
  foreach ($p in $edge) { if (Test-Path $p) { return @{ Kind = 'edge'; Path = $p } } }
  $chrome = @(
    "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
    "$env:ProgramFiles (x86)\Google\Chrome\Application\chrome.exe",
    "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
  )
  foreach ($p in $chrome) { if (Test-Path $p) { return @{ Kind = 'chrome'; Path = $p } } }
  return $null
}

function Get-BrowserArguments {
  param([string]$Kind, [string]$TvUrl)
  # Comunes a Edge y Chrome (ambos Chromium). Sin primer arranque, sin traducción, reproducción
  # automática permitida (la TV no tiene sonido pero sí vídeo/animación), kiosco sin tiempo de espera.
  $common = @(
    '--kiosk', ('"{0}"' -f $TvUrl),
    '--no-first-run',
    '--autoplay-policy=no-user-gesture-required',
    '--disable-features=TranslateUI,msEdgeSidebarV2,msHubApps',
    '--disable-session-crashed-bubble',
    '--disable-infobars',
    '--noerrdialogs',
    '--overscroll-history-navigation=0',
    '--start-fullscreen'
  )
  if ($Kind -eq 'edge') {
    $common += '--edge-kiosk-type=fullscreen'
    $common += '--kiosk-idle-timeout-minutes=0'
    $common += '--no-default-browser-check'
  } else {
    $common += '--no-default-browser-check'
  }
  return ($common -join ' ')
}

# ───────────────────────────── Inicio ─────────────────────────────
New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
Write-Log '===== Instalación de Macondo TV ====='
Write-Log ("Equipo: {0} · Usuario: {1}\{2} · Windows: {3}" -f $env:COMPUTERNAME, $env:USERDOMAIN, $env:USERNAME, [System.Environment]::OSVersion.VersionString)

if ($env:USERNAME -like '*$' -or $env:USERNAME -ieq 'SYSTEM') {
  throw 'Ejecuta este script dentro de la sesión del usuario que quedará conectado a la TV (p. ej. macondotv), no como SYSTEM.'
}

# 1. URL
if (-not $SinPreguntar) {
  Write-Host ''
  Write-Host 'URL de Macondo TV. Opciones habituales:' -ForegroundColor Cyan
  Write-Host '  [1] https://macondo.comfasucre.co/tv                                   (dominio público, recomendado)'
  Write-Host '  [2] https://192.168.31.240:3443/tv?origin=https://192.168.31.240:3443  (red local, HTTPS con CA propia)'
  Write-Host '  [3] http://192.168.31.240:3100/tv?origin=http://192.168.31.240:3100    (red local, sin HTTPS)'
  $answer = Read-Host ("Escribe 1, 2, 3 o una URL completa [Enter = {0}]" -f $Url)
  switch ($answer.Trim()) {
    ''  { }
    '1' { $Url = 'https://macondo.comfasucre.co/tv' }
    '2' { $Url = 'https://192.168.31.240:3443/tv?origin=https://192.168.31.240:3443' }
    '3' { $Url = 'http://192.168.31.240:3100/tv?origin=http://192.168.31.240:3100' }
    default { $Url = $answer.Trim() }
  }
}
$uri = $null
if (-not [System.Uri]::TryCreate($Url, [System.UriKind]::Absolute, [ref]$uri) -or ($uri.Scheme -notin @('http', 'https'))) {
  throw "URL no válida: $Url (debe empezar por http:// o https://)"
}
Write-Log "URL de la TV: $Url"

# 2. CA local solo para direcciones privadas por HTTPS
$privateHost = Test-PrivateHost -HostName $uri.Host
if ($uri.Scheme -eq 'https' -and $privateHost) {
  if ([string]::IsNullOrWhiteSpace($CaPath)) {
    $candidates = @(
      (Join-Path $PSScriptRoot '..\certs\ca.crt'),
      (Join-Path $PSScriptRoot 'ca.crt')
    )
    foreach ($c in $candidates) { if (Test-Path $c) { $CaPath = (Resolve-Path $c).Path; break } }
  }
  if ([string]::IsNullOrWhiteSpace($CaPath) -or -not (Test-Path $CaPath)) {
    Write-Log 'No se encontró ca.crt (infra/certs/ca.crt). Copia el archivo junto a este script o pásalo con -CaPath. Edge mostrará un aviso de certificado hasta instalarla.' 'WARN'
  } else {
    $cert = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2($CaPath)
    $store = New-Object System.Security.Cryptography.X509Certificates.X509Store('Root', 'LocalMachine')
    $store.Open('ReadWrite')
    $already = $store.Certificates | Where-Object { $_.Thumbprint -eq $cert.Thumbprint }
    if ($already) {
      Write-Log ("CA ya instalada: {0} ({1})" -f $cert.Subject, $cert.Thumbprint)
    } else {
      $store.Add($cert)
      Write-Log ("CA instalada en Raíz de confianza del equipo: {0} ({1}), válida hasta {2}" -f $cert.Subject, $cert.Thumbprint, $cert.NotAfter)
    }
    $store.Close()
  }
} elseif ($uri.Scheme -eq 'https') {
  Write-Log ("Dominio público {0}: certificado emitido por una CA pública; no hace falta instalar la CA local." -f $uri.Host)
} else {
  Write-Log 'URL http:// (sin cifrado): no se instala ninguna CA.' 'WARN'
}

# 3. Navegador y tarea programada
$browser = Find-Browser
if (-not $browser) { throw 'No se encontró Microsoft Edge ni Google Chrome. Instala Edge (viene con Windows 11) y vuelve a ejecutar.' }
$arguments = Get-BrowserArguments -Kind $browser.Kind -TvUrl $Url
Write-Log ("Navegador: {0} ({1})" -f $browser.Kind, $browser.Path)
Write-Log "Argumentos: $arguments"

$existing = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($existing) {
  Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
  Write-Log 'Tarea anterior eliminada.'
}
$userId = "$env:USERDOMAIN\$env:USERNAME"
$action = New-ScheduledTaskAction -Execute $browser.Path -Argument $arguments
$trigger = New-ScheduledTaskTrigger -AtLogOn -User $userId
$trigger.Delay = 'PT10S'   # da tiempo a la red y al escritorio
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries `
  -StartWhenAvailable -ExecutionTimeLimit ([TimeSpan]::Zero) -MultipleInstances IgnoreNew `
  -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1)
$principal = New-ScheduledTaskPrincipal -UserId $userId -LogonType Interactive -RunLevel Limited
Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings -Principal $principal `
  -Description 'Abre Macondo TV (Biblioteca Macondo, Comfasucre) en modo kiosco al iniciar sesión.' | Out-Null
Write-Log "Tarea programada '$TaskName' creada para $userId (al iniciar sesión, 10 s de espera)."

# 4. Energía (con corriente alterna). Se deja constancia del plan activo para restaurarlo.
$activeScheme = (powercfg /getactivescheme) -replace '.*GUID: ([0-9a-f-]+).*', '$1'
Write-Log "Plan de energía activo: $activeScheme"
& powercfg /change monitor-timeout-ac 0   | Out-Null
& powercfg /change standby-timeout-ac 0   | Out-Null
& powercfg /change hibernate-timeout-ac 0 | Out-Null
& powercfg /change monitor-timeout-dc 0   | Out-Null
& powercfg /change standby-timeout-dc 0   | Out-Null
& powercfg /hibernate off                 | Out-Null
Write-Log 'Energía: pantalla y suspensión nunca (CA y batería), hibernación desactivada.'

# 5. Protector de pantalla y bloqueo (usuario actual)
$desk = 'HKCU:\Control Panel\Desktop'
Set-ItemProperty -Path $desk -Name 'ScreenSaveActive' -Value '0' -Type String
Set-ItemProperty -Path $desk -Name 'ScreenSaverIsSecure' -Value '0' -Type String
Set-ItemProperty -Path $desk -Name 'ScreenSaveTimeOut' -Value '0' -Type String
Remove-ItemProperty -Path $desk -Name 'SCRNSAVE.EXE' -ErrorAction SilentlyContinue
# Bloqueo automático tras apagar la pantalla (0 = nunca). Solo afecta a este equipo/usuario.
& powercfg /setacvalueindex SCHEME_CURRENT SUB_VIDEO VIDEOCONLOCK 0 | Out-Null
& powercfg /setdcvalueindex SCHEME_CURRENT SUB_VIDEO VIDEOCONLOCK 0 | Out-Null
& powercfg /setactive SCHEME_CURRENT | Out-Null
# Sin bloqueo de pantalla de Windows para este usuario (la TV no tiene teclado a mano).
$personal = 'HKCU:\Software\Policies\Microsoft\Windows\Personalization'
New-Item -Path $personal -Force | Out-Null
Set-ItemProperty -Path $personal -Name 'NoLockScreen' -Value 1 -Type DWord
# Notificaciones del sistema silenciadas para el usuario de la TV (asistente de concentración/No molestar).
$notif = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\PushNotifications'
New-Item -Path $notif -Force | Out-Null
Set-ItemProperty -Path $notif -Name 'ToastEnabled' -Value 0 -Type DWord
Write-Log 'Protector de pantalla desactivado; sin bloqueo al apagar pantalla; notificaciones emergentes desactivadas para este usuario.'

# 6. Guardar configuración (sin secretos) para Iniciar/Desinstalar
@{
  url = $Url; browser = $browser.Path; browserKind = $browser.Kind; arguments = $arguments
  user = $userId; previousPowerScheme = $activeScheme; installedAt = (Get-Date).ToString('s')
  caInstalled = [bool]($uri.Scheme -eq 'https' -and $privateHost -and $CaPath -and (Test-Path $CaPath))
  caPath = $CaPath
} | ConvertTo-Json | Set-Content -Path $ConfigFile -Encoding UTF8
Write-Log "Configuración guardada en $ConfigFile"

Write-Host ''
Write-Host 'Instalación terminada.' -ForegroundColor Green
Write-Host ' - Escalado de pantalla: en Configuración > Sistema > Pantalla deja 100 % para TV 1080p o 150-200 % si la TV es 4K' -ForegroundColor Yellow
Write-Host '   (la página /tv se adapta sola: escala con el tamaño de la ventana; 100 % en 4K también se ve bien).'
Write-Host ' - Inicio de sesión automático: ejecuta netplwiz (o Sysinternals Autologon) y desmarca "Los usuarios deben escribir su nombre..."'
Write-Host '   para la cuenta macondotv. Este script NO guarda contraseñas.'
Write-Host ' - Probar ahora sin reiniciar: Iniciar-Macondo-TV.cmd (o cierra sesión y vuelve a entrar).'
Write-Host " - Registro: $LogFile"
Write-Log 'Fin.'
