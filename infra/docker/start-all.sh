#!/bin/bash
# Arranque de la imagen todo-en-uno: migraciones → seed opcional → API (127.0.0.1:4100) → web ($PORT).
# Si cualquiera de los dos procesos muere, el contenedor termina (EasyPanel/Docker lo reinicia).
set -euo pipefail

# Permisos del volumen (EasyPanel puede montarlo como root la primera vez); luego bajamos a `node`.
if [ "$(id -u)" = "0" ]; then
  chown -R node:node /app/storage 2>/dev/null || true
  exec runuser -u node -- /usr/local/bin/macondo-start "$@"
fi

export API_PORT="${API_PORT:-4100}"
export API_INTERNAL_URL="http://127.0.0.1:${API_PORT}"
WEB_PORT="${PORT:-3100}"

cd /app/apps/api
echo "[macondo] Aplicando migraciones…"
node scripts/prisma.cjs migrate deploy
if [ "${SEED_ON_START:-false}" = "true" ]; then
  echo "[macondo] SEED_ON_START=true → seed idempotente (solo crea lo que falta)…"
  npx ts-node --transpile-only prisma/seed.ts
fi

echo "[macondo] Iniciando API en 127.0.0.1:${API_PORT}…"
node dist/main.js &
API_PID=$!

for i in $(seq 1 60); do
  if node -e "fetch('http://127.0.0.1:${API_PORT}/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"; then
    echo "[macondo] API lista."
    break
  fi
  if ! kill -0 "$API_PID" 2>/dev/null; then echo "[macondo] La API terminó antes de estar lista."; exit 1; fi
  sleep 1
done

echo "[macondo] Iniciando web en 0.0.0.0:${WEB_PORT}…"
cd /app/web
PORT="$WEB_PORT" HOSTNAME=0.0.0.0 node apps/web/server.js &
WEB_PID=$!

trap 'kill -TERM "$API_PID" "$WEB_PID" 2>/dev/null || true' TERM INT
wait -n "$API_PID" "$WEB_PID"
STATUS=$?
echo "[macondo] Un proceso terminó (código $STATUS); cerrando el contenedor."
kill -TERM "$API_PID" "$WEB_PID" 2>/dev/null || true
exit "$STATUS"
