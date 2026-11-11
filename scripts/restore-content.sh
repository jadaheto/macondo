#!/bin/sh
# Restaura un paquete de contenido (macondo-db.dump + macondo-storage.tar) en una pila Macondo
# Digital que corre en Docker (local o servidor EasyPanel con acceso SSH).
#
#   sh restore-content.sh <contenedor_db> <volumen_storage> [carpeta_del_paquete]
#
# Ejemplos:
#   Local (docker compose):  sh restore-content.sh macondo-digital-stack-macondo-db-1 macondo-digital-stack_macondo_storage .
#   EasyPanel: en el servidor, `docker ps` para ver el contenedor de Postgres del proyecto y
#              `docker volume ls` para el volumen montado en /app/storage de macondo-api.
#
# ¡ATENCIÓN! Sobrescribe la base de datos y el almacenamiento de destino. Detén la API antes
# (docker stop <contenedor_api>) y vuelve a arrancarla al terminar.
set -eu
DB_CT="${1:?contenedor de Postgres}"
STORAGE_VOL="${2:?volumen de /app/storage}"
PKG="$(cd "${3:-.}" && pwd)"
[ -f "$PKG/macondo-db.dump" ] && [ -f "$PKG/macondo-storage.tar" ] || { echo "Faltan macondo-db.dump / macondo-storage.tar en $PKG"; exit 1; }

PGUSER="$(docker exec "$DB_CT" sh -c 'echo "${POSTGRES_USER:-macondo}"')"
PGDB="$(docker exec "$DB_CT" sh -c 'echo "${POSTGRES_DB:-macondo}"')"

echo "[1/2] Base de datos → $DB_CT ($PGDB)"
docker exec -i "$DB_CT" sh -c "pg_restore -U '$PGUSER' -d '$PGDB' --clean --if-exists --no-owner --no-acl" < "$PKG/macondo-db.dump" \
  || echo "   (pg_restore reportó avisos; suele ser normal con --clean en una base vacía)"

echo "[2/2] Archivos → volumen $STORAGE_VOL"
docker run --rm -v "$STORAGE_VOL":/dst -v "$PKG":/pkg:ro alpine:3.20 sh -c \
  'rm -rf /dst/* && tar xf /pkg/macondo-storage.tar -C /dst && chown -R 1000:1000 /dst && echo "   archivos: $(find /dst -type f | wc -l)"'

echo "Listo. Arranca la API (docker start <contenedor_api>) y comprueba /api/health y el catálogo."
