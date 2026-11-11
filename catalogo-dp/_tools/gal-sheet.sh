#!/bin/zsh
# Hoja de contacto de una galería local (revisión visual). Uso: gal-sheet.sh <slug> <outdir>
set -e
G="$(dirname $0)/../galerias/$1"; O="$2"; rm -rf "$O"; mkdir -p "$O"
i=0
for f in "$G"/*.(jpg|png); do
  sips -s format jpeg -Z 300 --padToHeightWidth 300 300 --padColor FFFFFF "$f" --out "$O/p$(printf %02d $i).jpg" >/dev/null 2>&1
  ffmpeg -y -loglevel error -i "$O/p$(printf %02d $i).jpg" -vf "scale=300:300,format=yuvj420p" "$O/q$(printf %02d $i).jpg"
  i=$((i+1))
done
rows=$(( (i+3)/4 ))
ffmpeg -y -loglevel error -i "$O/q%02d.jpg" -vf "tile=4x${rows}:padding=4:color=gray" -frames:v 1 "$O/sheet.jpg"
echo "$O/sheet.jpg ($i)"
