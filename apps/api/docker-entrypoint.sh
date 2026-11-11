#!/bin/sh
# Arranque de la API en contenedor: migraciones → seed opcional → servidor.
set -e
cd /app/apps/api
echo "[macondo-api] Aplicando migraciones (prisma migrate deploy)…"
node scripts/prisma.cjs migrate deploy
if [ "${SEED_ON_START:-false}" = "true" ]; then
  echo "[macondo-api] SEED_ON_START=true → ejecutando seed idempotente…"
  npx ts-node --transpile-only prisma/seed.ts
fi
echo "[macondo-api] Iniciando servidor…"
exec node dist/main.js
