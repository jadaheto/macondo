#!/usr/bin/env sh
# Genera una CA local (10 años) y un certificado de servidor para HTTPS en la red local.
#
# Uso:  sh scripts/make-local-certs.sh [IP-o-nombre ...]
#       (sin argumentos: detecta la IP de en0 con `ipconfig getifaddr en0`, o `hostname -I` en Linux)
#
# Salida (infra/certs/):
#   ca.crt / ca.key         CA "Macondo Digital Local CA" (la .key NUNCA se versiona)
#   server.crt / server.key certificado del servidor con SAN para las IP dadas,
#                           localhost, 127.0.0.1 y macondo.local
#   server.sans             lista de SAN emitidos (para detectar cambios)
#
# Idempotente: no sobrescribe una CA existente; reemite el certificado de servidor solo si
# cambian las IP/nombres o si ha expirado. Si se regenera la CA, hay que RECOMPILAR el APK
# (apps/android/app/src/main/res/raw/macondo_ca.crt) y volver a instalarlo en las tablets.
set -eu

ROOT=$(cd "$(dirname "$0")/.." && pwd)
CERTS="$ROOT/infra/certs"
mkdir -p "$CERTS"

if [ "$#" -gt 0 ]; then
  HOSTS="$*"
else
  HOSTS=$( (ipconfig getifaddr en0 2>/dev/null || hostname -I 2>/dev/null | awk '{print $1}') || true)
  if [ -z "$HOSTS" ]; then
    echo "No pude detectar la IP local; pásala como argumento: sh scripts/make-local-certs.sh 192.168.1.50" >&2
    exit 1
  fi
fi

# ── CA ───────────────────────────────────────────────────────────────────────
if [ -f "$CERTS/ca.crt" ] && [ -f "$CERTS/ca.key" ]; then
  echo "CA existente: $CERTS/ca.crt (no se sobrescribe)"
else
  if [ -f "$CERTS/ca.crt" ] && [ ! -f "$CERTS/ca.key" ]; then
    echo "Hay ca.crt pero falta ca.key: no puedo firmar. Borra infra/certs/ca.crt para crear una CA nueva." >&2
    exit 1
  fi
  echo "Creando CA local (10 años)…"
  openssl genrsa -out "$CERTS/ca.key" 4096 2>/dev/null
  openssl req -x509 -new -key "$CERTS/ca.key" -sha256 -days 3650 \
    -subj "/C=CO/O=Biblioteca Macondo - Comfasucre/CN=Macondo Digital Local CA" \
    -addext "basicConstraints=critical,CA:TRUE,pathlen:0" \
    -addext "keyUsage=critical,keyCertSign,cRLSign" \
    -out "$CERTS/ca.crt"
  chmod 600 "$CERTS/ca.key"
fi

# ── SAN ──────────────────────────────────────────────────────────────────────
SANS="DNS:localhost,IP:127.0.0.1,DNS:macondo.local"
for h in $HOSTS; do
  case "$h" in
    *[!0-9.]*) SANS="$SANS,DNS:$h" ;;
    *)         SANS="$SANS,IP:$h" ;;
  esac
done

NEED=1
if [ -f "$CERTS/server.crt" ] && [ -f "$CERTS/server.key" ] && [ -f "$CERTS/server.sans" ]; then
  if [ "$(cat "$CERTS/server.sans")" = "$SANS" ] && openssl x509 -checkend 2592000 -noout -in "$CERTS/server.crt" >/dev/null 2>&1 \
     && openssl verify -CAfile "$CERTS/ca.crt" "$CERTS/server.crt" >/dev/null 2>&1; then
    NEED=0
  fi
fi

if [ "$NEED" -eq 0 ]; then
  echo "Certificado de servidor vigente para: $SANS"
else
  echo "Emitiendo certificado de servidor para: $SANS"
  openssl genrsa -out "$CERTS/server.key" 2048 2>/dev/null
  EXT=$(mktemp)
  cat > "$EXT" <<EOT
basicConstraints=CA:FALSE
keyUsage=critical,digitalSignature,keyEncipherment
extendedKeyUsage=serverAuth
subjectAltName=$SANS
EOT
  openssl req -new -key "$CERTS/server.key" -subj "/C=CO/O=Biblioteca Macondo - Comfasucre/CN=macondo.local" -out "$CERTS/server.csr"
  # 825 días: máximo que aceptan Chrome/Android para certificados de servidor.
  openssl x509 -req -in "$CERTS/server.csr" -CA "$CERTS/ca.crt" -CAkey "$CERTS/ca.key" -CAcreateserial \
    -days 825 -sha256 -extfile "$EXT" -out "$CERTS/server.crt" 2>/dev/null
  rm -f "$EXT" "$CERTS/server.csr" "$CERTS/ca.srl"
  chmod 600 "$CERTS/server.key"
  printf '%s' "$SANS" > "$CERTS/server.sans"
fi

# Copia de la CA al proyecto Android (el APK confía en esta CA además de las del sistema).
ANDROID_RAW="$ROOT/apps/android/app/src/main/res/raw"
if [ -d "$ANDROID_RAW" ]; then
  cp "$CERTS/ca.crt" "$ANDROID_RAW/macondo_ca.crt"
  echo "CA copiada a apps/android/app/src/main/res/raw/macondo_ca.crt (recompilar el APK si cambió)"
fi

echo
echo "Huella SHA-256 de la CA: $(openssl x509 -noout -fingerprint -sha256 -in "$CERTS/ca.crt" | cut -d= -f2)"
echo "Siguiente paso: docker compose --profile https up -d macondo-https   →  https://<IP>:3443"
