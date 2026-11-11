#Requires -RunAsAdministrator
<#
.SYNOPSIS
  Quita "Macondo TV" del equipo: elimina la tarea programada, cierra el navegador en kiosco,
  restaura la energía a los valores del plan Equilibrado (pantalla 10 min, suspensión 30 min con
  corriente; hibernación activa) y vuelve a activar protector/bloqueo de pantalla y notificaciones.
  Opcionalmente quita la CA local de la biblioteca (-QuitarCA).

.PARAMETER QuitarCA
  También elimina la CA local (infra/certs/ca.crt) de "Entidades de certificación raíz de confianza"
  del equipo, si este script la instaló.

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File .\Desinstalar-Macondo-TV.ps1
.EXAMPLE
  powershell -ExecutionPolicy Bypass -File .\Desinstalar-Macondo-TV.ps1 -QuitarCA
#>
[CmdletBinding()]
param([switch]$QuitarCA)

$ErrorActionPreference = 'Stop'
$TaskName = 'Macondo TV'
$LogDir = Join-Path $env:ProgramData 'MacondoTV'
$LogFile = Join-Path $LogDir 'instalacion.log'
$ConfigFile = Join-Path $LogDir 'config.json'

function Write-Log {
  param([string]$Message, [string]$Level = 'INFO')
  $line = '{0} [{1}] {2}' -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $Level, $Message
  Write-Host $line
  if (Test-Path $LogDir) { Add-Content -Path $LogFile -Value $line -Encoding UTF8 }
}

Write-Log '===== Desinstalación de Macondo TV ====='
$config = $null
if (Test-Path $ConfigFile) { $config = Get-Content -Raw -Path $ConfigFile | ConvertFrom-Json }

# 1. Tarea programada y navegador en ejecución
$task = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($task) {
  Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
  Write-Log "Tarea '$TaskName' eliminada."
} else {
  Write-Log "La tarea '$TaskName' no existía." 'WARN'
}
$kioskProc = if ($config -and $config.browserKind -eq 'chrome') { 'chrome' } else { 'msedge' }
$running = Get-Process -Name $kioskProc -ErrorAction SilentlyContinue
if ($running) {
  $running | Stop-Process -Force -ErrorAction SilentlyContinue
  Write-Log "Proceso $kioskProc cerrado."
}

# 2. Energía: valores por defecto de Windows (plan Equilibrado) con corriente alterna.
& powercfg /change monitor-timeout-ac 10   | Out-Null
& powercfg /change standby-timeout-ac 30   | Out-Null
& powercfg /change hibernate-timeout-ac 0  | Out-Null
& powercfg /change monitor-timeout-dc 5    | Out-Null
& powercfg /change standby-timeout-dc 15   | Out-Null
& powercfg /hibernate on                   | Out-Null
& powercfg /setacvalueindex SCHEME_CURRENT SUB_VIDEO VIDEOCONLOCK 1 | Out-Null
& powercfg /setdcvalueindex SCHEME_CURRENT SUB_VIDEO VIDEOCONLOCK 1 | Out-Null
& powercfg /setactive SCHEME_CURRENT | Out-Null
Write-Log 'Energía restaurada: pantalla 10 min / suspensión 30 min (CA), hibernación activa, bloqueo al apagar pantalla.'

# 3. Protector de pantalla, bloqueo y notificaciones (usuario actual)
$desk = 'HKCU:\Control Panel\Desktop'
Set-ItemProperty -Path $desk -Name 'ScreenSaveActive' -Value '1' -Type String
Set-ItemProperty -Path $desk -Name 'ScreenSaverIsSecure' -Value '1' -Type String
Set-ItemProperty -Path $desk -Name 'ScreenSaveTimeOut' -Value '600' -Type String
Remove-ItemProperty -Path 'HKCU:\Software\Policies\Microsoft\Windows\Personalization' -Name 'NoLockScreen' -ErrorAction SilentlyContinue
Remove-ItemProperty -Path 'HKCU:\Software\Microsoft\Windows\CurrentVersion\PushNotifications' -Name 'ToastEnabled' -ErrorAction SilentlyContinue
Write-Log 'Protector de pantalla (10 min, con bloqueo), pantalla de bloqueo y notificaciones restaurados.'

# 4. CA local (opcional)
if ($QuitarCA) {
  $caPath = if ($config -and $config.caPath) { [string]$config.caPath } else { Join-Path $PSScriptRoot '..\certs\ca.crt' }
  if (Test-Path $caPath) {
    $cert = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2($caPath)
    $store = New-Object System.Security.Cryptography.X509Certificates.X509Store('Root', 'LocalMachine')
    $store.Open('ReadWrite')
    $found = $store.Certificates | Where-Object { $_.Thumbprint -eq $cert.Thumbprint }
    if ($found) { $store.Remove($found[0]); Write-Log ("CA eliminada: {0}" -f $cert.Subject) } else { Write-Log 'La CA no estaba instalada.' 'WARN' }
    $store.Close()
  } else {
    Write-Log "No se encontró el archivo de la CA ($caPath); quítala a mano con certlm.msc si procede." 'WARN'
  }
}

if (Test-Path $ConfigFile) { Remove-Item $ConfigFile -Force }
Write-Log 'Fin. El inicio de sesión automático (netplwiz) no se toca: desactívalo a mano si ya no se quiere.'
Write-Host 'Desinstalación terminada.' -ForegroundColor Green
