#!/bin/bash
# Uso: download.sh <archivo_ids>  — descarga secuencial, cortés, de EPUB sin imágenes de Project Gutenberg.
# Salida: libros/gutenberg-<ID>.epub ; registro en _tmp/download.log (ID<TAB>estado<TAB>url)
cd "$(dirname "$0")/.."
UA="MacondoDigital-SchoolLibrary/1.0 (Comfasucre school digital library, Colombia; low-volume sequential downloads)"
mkdir -p libros _tmp
while read -r ID; do
  [ -z "$ID" ] && continue
  OUT="libros/gutenberg-$ID.epub"
  if [ -s "$OUT" ]; then echo -e "$ID\tSKIP_EXISTS" >> _tmp/download.log; continue; fi
  ok=""
  for URL in "https://www.gutenberg.org/ebooks/$ID.epub.noimages" "https://www.gutenberg.org/cache/epub/$ID/pg$ID.epub"; do
    if curl -fsSL --retry 3 --retry-delay 3 --max-filesize 8388608 -A "$UA" -o "$OUT.part" "$URL"; then
      mv "$OUT.part" "$OUT"; ok="$URL"; break
    fi
    rm -f "$OUT.part"; sleep 2
  done
  if [ -n "$ok" ]; then echo -e "$ID\tOK\t$ok" >> _tmp/download.log; else echo -e "$ID\tFAIL" >> _tmp/download.log; fi
  sleep 2
done < "$1"
