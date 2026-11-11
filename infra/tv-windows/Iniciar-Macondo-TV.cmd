@echo off
rem Macondo TV: arranque manual (sin esperar al inicio de sesion). Usa la URL guardada por
rem Instalar-Macondo-TV.ps1 en %ProgramData%\MacondoTV\config.json; si no existe, abre la
rem direccion por defecto (dominio publico). Para cambiar la URL vuelve a ejecutar el instalador.
setlocal
set "CONFIG=%ProgramData%\MacondoTV\config.json"
set "URL=https://macondo.comfasucre.co/tv"
set "EDGE=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
if not exist "%EDGE%" set "EDGE=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
set "CHROME=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if not exist "%CHROME%" set "CHROME=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"

if exist "%CONFIG%" (
  for /f "usebackq delims=" %%U in (`powershell -NoProfile -ExecutionPolicy Bypass -Command "(Get-Content -Raw '%CONFIG%' | ConvertFrom-Json).url"`) do set "URL=%%U"
)
echo Abriendo Macondo TV: %URL%

if exist "%EDGE%" (
  start "" "%EDGE%" --kiosk "%URL%" --edge-kiosk-type=fullscreen --no-first-run --autoplay-policy=no-user-gesture-required --disable-features=TranslateUI,msEdgeSidebarV2,msHubApps --kiosk-idle-timeout-minutes=0 --disable-session-crashed-bubble --noerrdialogs --no-default-browser-check
  goto :fin
)
if exist "%CHROME%" (
  start "" "%CHROME%" --kiosk "%URL%" --no-first-run --autoplay-policy=no-user-gesture-required --disable-features=TranslateUI --disable-session-crashed-bubble --noerrdialogs --no-default-browser-check --start-fullscreen
  goto :fin
)
echo No se encontro Microsoft Edge ni Google Chrome.
pause
:fin
endlocal
