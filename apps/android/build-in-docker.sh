#!/usr/bin/env sh
# Compila el APK dentro de un contenedor con JDK 17 (el Java local puede ser demasiado nuevo
# para AGP) reutilizando el Android SDK ya instalado en el equipo (solo lectura).
#
# Uso:   sh apps/android/build-in-docker.sh [tareas gradle…]      (por defecto: test lint assembleRelease)
# Firma: exporta MACONDO_STORE_FILE (ruta en el host), MACONDO_STORE_PASSWORD, MACONDO_KEY_ALIAS,
#        MACONDO_KEY_PASSWORD; o deja apps/android/keystore.properties (no versionado).
# Variables opcionales: ANDROID_SDK (por defecto ~/Library/Android/sdk), DOCKER_PLATFORM
#        (p. ej. linux/amd64 si el aapt2 de Maven no existe para la arquitectura del contenedor).
set -eu
HERE=$(cd "$(dirname "$0")" && pwd)
SDK=${ANDROID_SDK:-$HOME/Library/Android/sdk}
IMAGE=${JDK_IMAGE:-eclipse-temurin:17-jdk}
TASKS=${*:-"test lint assembleRelease"}
PLATFORM_FLAG=${DOCKER_PLATFORM:+--platform $DOCKER_PLATFORM}

[ -d "$SDK/platforms/android-34" ] || { echo "Falta platforms;android-34 en $SDK" >&2; exit 1; }
[ -d "$SDK/build-tools/34.0.0" ] || { echo "Falta build-tools;34.0.0 en $SDK" >&2; exit 1; }

SIGN_ARGS=""
if [ -n "${MACONDO_STORE_FILE:-}" ]; then
  KEYDIR=$(cd "$(dirname "$MACONDO_STORE_FILE")" && pwd)
  SIGN_ARGS="-v $KEYDIR:/keys:ro -e MACONDO_STORE_FILE=/keys/$(basename "$MACONDO_STORE_FILE") \
    -e MACONDO_STORE_PASSWORD -e MACONDO_KEY_ALIAS -e MACONDO_KEY_PASSWORD"
fi

# shellcheck disable=SC2086
docker run --rm $PLATFORM_FLAG \
  -v "$HERE":/work -w /work \
  -v macondo-gradle-cache:/root/.gradle \
  -v "$SDK":/opt/android-sdk:ro \
  -e ANDROID_HOME=/opt/android-sdk -e ANDROID_SDK_ROOT=/opt/android-sdk \
  -e GRADLE_OPTS="-Dorg.gradle.daemon=false" \
  $SIGN_ARGS \
  "$IMAGE" sh -c "./gradlew --no-daemon --console=plain $TASKS"
