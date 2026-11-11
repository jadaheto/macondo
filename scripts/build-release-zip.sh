#!/bin/sh
# Empaqueta el CÓDIGO FUENTE listo para subir a EasyPanel (o a GitHub): sin node_modules, builds,
# secretos (.env), archivos subidos ni el catálogo de dominio público (que viaja en el paquete de
# contenido, ver export-content.sh).
#
#   sh scripts/build-release-zip.sh [salida.zip]   (por defecto entregables/macondo-digital-<fecha>.zip)
set -eu
cd "$(dirname "$0")/.."
OUT="${1:-entregables/macondo-digital-$(date +%Y%m%d).zip}"
mkdir -p "$(dirname "$OUT")"
rm -f "$OUT"
zip -r -q "$OUT" . \
  -x '*/node_modules/*' 'node_modules/*' \
  -x '*/.next/*' '*/dist/*' '*/coverage/*' '*/playwright-report/*' '*/test-results/*' '*.tsbuildinfo' \
  -x '.git/*' '.env' '.env.*' \
  -x 'storage/*' 'entregables/*' 'catalogo-dp/*' 'branding/*' '_tmp/*' \
  -x 'infra/certs/*.key' 'apps/android/.gradle/*' 'apps/android/build/*' 'apps/android/app/build/*' \
  -x 'apps/android/local.properties' 'apps/android/keystore.properties' '*.jks' '*.keystore' \
  -x '*.log' '*/.DS_Store' '.DS_Store'
zip -q "$OUT" .env.example
echo "Paquete: $OUT ($(du -h "$OUT" | cut -f1))"
unzip -l "$OUT" | tail -1
