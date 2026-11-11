#!/bin/bash
# Descarga secuencial (pausa 1,5 s) de las secciones 64 kbps listadas en _tmp/biores/lv_plan.json
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"; RAW="$ROOT/_tmp/biores/raw"; mkdir -p "$RAW"
python3 -I -c "import json;p=json.load(open('$ROOT/_tmp/biores/lv_plan.json'))
[print(s['url']) for v in p.values() for s in v['sections']]" | while read u; do
  f="$RAW/$(basename "$u")"; [ -s "$f" ] && continue
  curl -fsSL --retry 3 -A "MacondoDigital-biblioteca-escolar/1.0 (descarga puntual)" -o "$f" "$u" && echo "OK $(basename "$u") $(stat -f%z "$f")" || echo "FAIL $u"
  sleep 1.5
done
