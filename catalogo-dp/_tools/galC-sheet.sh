#!/bin/zsh
# Hoja de contacto (revisión visual) de una o varias galerías del lote cultura. Uso: galC-sheet.sh <outdir> <slug> [slug...]
O="$1"; shift; G0="$(dirname $0)/../galerias"
for s in "$@"; do
  D="$O/$s"; rm -rf "$D"; mkdir -p "$D"; i=0
  for f in "$G0/$s"/*.(jpg|png)(N); do
    sips -s format jpeg -Z 300 --padToHeightWidth 300 300 --padColor FFFFFF "$f" --out "$D/p$(printf %02d $i).jpg" >/dev/null 2>&1
    ffmpeg -y -loglevel error -i "$D/p$(printf %02d $i).jpg" -vf "scale=300:300,format=yuvj420p" "$D/q$(printf %02d $i).jpg"
    i=$((i+1))
  done
  rows=$(( (i+4)/5 ))
  ffmpeg -y -loglevel error -i "$D/q%02d.jpg" -vf "tile=5x${rows}:padding=4:color=gray" -frames:v 1 "$D/sheet.jpg"
  echo "$D/sheet.jpg ($i)"
done
