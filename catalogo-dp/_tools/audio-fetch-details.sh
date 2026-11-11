#!/bin/sh
# Descarga metadatos extendidos de LibriVox para los ids dados (uno por archivo).
cd "$(dirname "$0")/.." || exit 1
mkdir -p _tmp/audio/api
for id in "$@"; do
  f=_tmp/audio/api/b$id.json
  [ -s "$f" ] && continue
  curl -fsSL --retry 3 -A "MacondoDigital-audio/1.0 (Comfasucre school library catalog)" \
    "https://librivox.org/api/feed/audiobooks?id=$id&format=json&extended=1" -o "$f" || echo "FAIL $id"
  sleep 1
done
