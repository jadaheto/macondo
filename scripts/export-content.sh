#!/bin/sh
# Exporta el CONTENIDO de una pila Macondo Digital en Docker (base de datos + archivos subidos)
# a un paquete portable para restaurarlo en otro servidor (EasyPanel u otro Docker).
#
#   sh scripts/export-content.sh [carpeta_destino]   (por defecto entregables/contenido-<fecha>)
#
# Produce:
#   macondo-db.dump        pg_dump formato custom (restaurar con pg_restore)
#   macondo-storage.tar    contenido de /app/storage (covers/, files/, galleries/, thumbs/)
#   MANIFIESTO.txt         tamaños, conteos y SHA-256 de ambos archivos
#   restore-content.sh     copia del script de restauración
# Requiere: docker; la pila debe estar arriba (docker compose ps).
set -eu
cd "$(dirname "$0")/.."
OUT="${1:-entregables/contenido-$(date +%Y%m%d)}"
mkdir -p "$OUT"
OUT_ABS="$(cd "$OUT" && pwd)"

DB_CT="$(docker compose ps -q macondo-db)"
API_CT="$(docker compose ps -q macondo-api)"
[ -n "$DB_CT" ] && [ -n "$API_CT" ] || { echo "La pila no está arriba: docker compose up -d"; exit 1; }
STORAGE_VOL="$(docker inspect -f '{{range .Mounts}}{{if eq .Destination "/app/storage"}}{{.Name}}{{end}}{{end}}' "$API_CT")"
[ -n "$STORAGE_VOL" ] || { echo "No se encontró el volumen de /app/storage"; exit 1; }

echo "[1/3] Base de datos → $OUT/macondo-db.dump"
docker exec "$DB_CT" sh -c 'pg_dump -U "${POSTGRES_USER:-macondo}" -d "${POSTGRES_DB:-macondo}" --no-owner --no-acl -Fc' > "$OUT_ABS/macondo-db.dump"

echo "[2/3] Archivos (volumen $STORAGE_VOL) → $OUT/macondo-storage.tar"
docker run --rm -v "$STORAGE_VOL":/src:ro -v "$OUT_ABS":/out alpine:3.20 sh -c 'tar cf /out/macondo-storage.tar -C /src . && echo "   archivos: $(find /src -type f | wc -l)"'

echo "[3/3] Manifiesto"
cp scripts/restore-content.sh "$OUT_ABS/"
{
  echo "Macondo Digital — paquete de contenido"
  echo "Fecha: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "Origen: $(hostname) · volumen $STORAGE_VOL"
  echo
  echo "Recursos por tipo/estado en la base de datos:"
  docker exec "$DB_CT" psql -U macondo -d macondo -Atc 'select type, status, count(*) from "Resource" group by 1,2 order by 1,2' | sed 's/^/  /'
  echo "Retos: $(docker exec "$DB_CT" psql -U macondo -d macondo -Atc 'select count(*) filter (where active)||'"'"' activos / '"'"'||count(*) from "Challenge"')"
  echo
  echo "Archivos:"
  (cd "$OUT_ABS" && ls -la macondo-db.dump macondo-storage.tar | awk '{print "  "$5" bytes  "$9}')
  echo
  echo "SHA-256:"
  (cd "$OUT_ABS" && shasum -a 256 macondo-db.dump macondo-storage.tar | sed 's/^/  /')
} > "$OUT_ABS/MANIFIESTO.txt"
cat "$OUT_ABS/MANIFIESTO.txt"
echo
echo "Listo: $OUT_ABS"
