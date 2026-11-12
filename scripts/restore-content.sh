#!/bin/sh
# Restaura un paquete de contenido (macondo-db.dump + macondo-storage.tar) en una pila Macondo
# Digital que corre en Docker (local o servidor EasyPanel con acceso SSH).
#
#   sh restore-content.sh <base_de_datos> <volumen_storage> [carpeta_del_paquete]
#
# <base_de_datos> puede ser:
#   - el NOMBRE del contenedor de Postgres (pg_restore se ejecuta dentro de él), o
#   - una URL postgresql://usuario:clave@host:5432/base  (Postgres externo o publicado en el host;
#     pg_restore corre en un contenedor postgres:16-alpine con red del host).
#
# Ejemplos:
#   Local (docker compose):  sh restore-content.sh macondo-digital-stack-macondo-db-1 macondo-digital-stack_macondo_storage .
#   EasyPanel, Postgres del proyecto: sh restore-content.sh <contenedor_postgres> <volumen_de_/app/storage> .
#   EasyPanel, Postgres por URL:      sh restore-content.sh 'postgresql://usuario:clave@127.0.0.1:5432/macondo' <volumen> .
#   En el servidor: `docker ps` muestra los contenedores y `docker volume ls` el volumen montado en /app/storage.
#
# ¡ATENCIÓN! Sobrescribe la base de datos y el almacenamiento de destino. Detén la app antes
# (docker stop <contenedor_app>) y vuelve a arrancarla al terminar.
set -eu
DB="${1:?contenedor de Postgres o URL postgresql://}"
STORAGE_VOL="${2:?volumen de /app/storage}"
PKG="$(cd "${3:-.}" && pwd)"
[ -f "$PKG/macondo-db.dump" ] && [ -f "$PKG/macondo-storage.tar" ] || { echo "Faltan macondo-db.dump / macondo-storage.tar en $PKG"; exit 1; }

case "$DB" in
  postgres://*|postgresql://*)
    # La URL puede llevar "?schema=public" (Prisma); pg_restore no lo entiende.
    URL="${DB%%\?*}"
    echo "[1/2] Base de datos → ${URL##*@} (pg_restore en contenedor postgres:16-alpine)"
    docker run --rm -i --network host postgres:16-alpine \
      pg_restore -d "$URL" --clean --if-exists --no-owner --no-acl < "$PKG/macondo-db.dump" \
      || echo "   (pg_restore reportó avisos; suele ser normal con --clean en una base vacía)"
    ;;
  *)
    PGUSER="$(docker exec "$DB" sh -c 'echo "${POSTGRES_USER:-macondo}"')"
    PGDB="$(docker exec "$DB" sh -c 'echo "${POSTGRES_DB:-macondo}"')"
    echo "[1/2] Base de datos → $DB ($PGDB)"
    docker exec -i "$DB" sh -c "pg_restore -U '$PGUSER' -d '$PGDB' --clean --if-exists --no-owner --no-acl" < "$PKG/macondo-db.dump" \
      || echo "   (pg_restore reportó avisos; suele ser normal con --clean en una base vacía)"
    ;;
esac

echo "[2/2] Archivos → volumen $STORAGE_VOL"
docker run --rm -v "$STORAGE_VOL":/dst -v "$PKG":/pkg:ro alpine:3.20 sh -c \
  'rm -rf /dst/* && tar xf /pkg/macondo-storage.tar -C /dst && chown -R 1000:1000 /dst && echo "   archivos: $(find /dst -type f | wc -l)"'

echo "Listo. Arranca la app (docker start <contenedor_app>) y comprueba /api/health y el catálogo."
