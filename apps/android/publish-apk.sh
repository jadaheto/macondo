#!/usr/bin/env sh
# Publica el APK firmado: copia a entregables/ y a apps/web/public/descargas/ (para que las tablets lo
# descarguen desde el servidor y la página /instalar muestre versión y SHA-256).
# Uso: sh apps/android/publish-apk.sh [ruta-al-apk]   (por defecto app/build/outputs/apk/release/app-release.apk)
set -eu
HERE=$(cd "$(dirname "$0")" && pwd)
ROOT=$(cd "$HERE/../.." && pwd)
APK=${1:-$HERE/app/build/outputs/apk/release/app-release.apk}
[ -f "$APK" ] || { echo "No existe $APK (compila primero: sh apps/android/build-in-docker.sh)" >&2; exit 1; }

VERSION=$(sed -n 's/.*versionName = "\([^"]*\)".*/\1/p' "$HERE/app/build.gradle.kts")
CODE=$(sed -n 's/.*versionCode = \([0-9]*\).*/\1/p' "$HERE/app/build.gradle.kts")
SHA=$(shasum -a 256 "$APK" | awk '{print $1}')
SIZE=$(stat -f %z "$APK" 2>/dev/null || stat -c %s "$APK")
DATE=$(date -u +%Y-%m-%dT%H:%M:%SZ)

mkdir -p "$ROOT/entregables" "$ROOT/apps/web/public/descargas"
cp "$APK" "$ROOT/entregables/macondo-digital-$VERSION.apk"
cp "$APK" "$ROOT/apps/web/public/descargas/macondo-digital.apk"
( cd "$ROOT/apps/web/public/descargas" && shasum -a 256 macondo-digital.apk > SHA256SUMS.txt )
cat > "$ROOT/apps/web/public/descargas/macondo-digital.json" <<EOT
{
  "name": "Macondo Digital",
  "package": "co.com.comfasucre.macondo",
  "version": "$VERSION",
  "versionCode": $CODE,
  "sha256": "$SHA",
  "sizeBytes": $SIZE,
  "builtAt": "$DATE",
  "minAndroid": "Android 9 (Fire OS 7) o superior",
  "file": "/descargas/macondo-digital.apk"
}
EOT
echo "APK $VERSION ($SIZE bytes) sha256=$SHA"
echo " → $ROOT/entregables/macondo-digital-$VERSION.apk"
echo " → $ROOT/apps/web/public/descargas/macondo-digital.apk (+ SHA256SUMS.txt, macondo-digital.json)"
echo "Reconstruir la web para servirlo: docker compose up -d --build macondo-web"
