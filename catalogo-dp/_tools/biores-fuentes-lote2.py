# -*- coding: utf-8 -*-
"""Añade (o reemplaza) la sección 'Lote 2' al final de AUDIO-BIO-RESUMEN-FUENTES.md. Uso: python3 -I catalogo-dp/_tools/biores-fuentes-lote2.py"""
import json, os
HERE = os.path.dirname(os.path.abspath(__file__)); CAT = os.path.dirname(HERE); ROOT = os.path.dirname(CAT)
d = json.load(open(os.path.join(CAT, 'audiobiografias-lote2.manifest.json')))
val = open(os.path.join(ROOT, '_tmp', 'biores', 'validate-lote2.log')).read().strip()
chk = open(os.path.join(ROOT, '_tmp', 'biores', 'tts-lote2-check.txt')).read().strip()
fmt = lambda s: f'{s // 60}:{s % 60:02d}'
lv = [e for e in d if e['source']['provider'] == 'LibriVox']; own = [e for e in d if e not in lv]
MARK = '\n## Lote 2 (21 audiobiografías adicionales)\n'
L = [MARK]
L.append(f'Generado el 2026-10-31 a petición del usuario para completar 50 audiobiografías (30 del lote 1 − 1 retirada (Balboa, travesía del istmo) − la demo de Pombo retirada + 21). '
         f'**{len(d)} entradas** en `audiobiografias-lote2.manifest.json`: {len(lv)} de LibriVox + {len(own)} con guion original (incluye una nueva audiobiografía de **Rafael Pombo** que sustituye a la demo con voz de macOS). '
         f'{sum(e["gradeMin"] <= 5 for e in d)} pensadas para 1.º–5.º. **`status: PUBLISHED`** (publicación aprobada por el usuario); los avisos sensibles se mantienen en `reviewNotes`. '
         f'Duración {sum(e["durationSeconds"] for e in d)/3600:.2f} h, {sum(e["sizeBytes"] for e in d)/1e6:.1f} MB.\n')
L.append('**Método**: igual que el lote 1. LibriVox: se revisaron las secciones biográficas restantes de los proyectos en español ya catalogados; se descartó *El soldado poeta* (Lummis) por narrar sin crítica la guerra de Ácoma. '
         'El contenido de las 5 secciones elegidas se revisó con transcripción automática (faster-whisper). Guiones originales (`_tools/biores-bios-lote2.py`) narrados con la misma voz Piper `es_ES-carlfm-x_low` (modelo MIT, dataset de dominio público). '
         'Construcción y verificación: `_tools/biores-lote2.py` (bytes mágicos, ffprobe, decodificación completa sin errores, SHA-256, tamaño); validación: `_tools/biores-validate-lote2.js` (ResourceInputSchema + PUBLISHED, archivo, ≥3 preguntas, timeline y funFacts). '
         'No se citan versos de autores aún protegidos (Luis Carlos López †1950, canciones de Lucho Bermúdez †1994).\n')
L.append(f'Validación:\n\n```\n{val}\n```\n\nControl de inteligibilidad (primeros 30 s de la nueva audiobiografía de Pombo):\n\n```\n{chk}\n```\n')
L.append('| Archivo | Título — autor (†) / origen | Grados | Duración | Bytes | SHA-256 (prefijo) |')
L.append('|---|---|---|---|---|---|')
for e in d:
    who = f"{e['creator']} (†{e['rights']['authorDeathYear']}); LibriVox #{e['source']['id']}, {e['source']['sections'].split(':')[0]}; {e['narrator']}" if e in lv else 'Guion original; voz Piper es_ES-carlfm-x_low'
    L.append(f"| `{e['file']}` | {e['title']} — {who} | {e['gradeMin']}–{e['gradeMax']} | {fmt(e['durationSeconds'])} | {e['sizeBytes']} | `{e['sha256'][:16]}` |")
L.append('\n**Revisión recomendada (lote 2)**: escucha completa de las pistas sintéticas (nombres propios); fechas inciertas de Pedro Romero y datos escasos de Manuela Beltrán (indicados en el texto); '
         'tono decimonónico de Fernán Caballero y Gimeno de Flaquer; Lucho Bermúdez (†1994) y Diego Luis Córdoba (†1964) son figuras del siglo XX, sin citas de obras protegidas.\n')
p = os.path.join(CAT, 'AUDIO-BIO-RESUMEN-FUENTES.md'); s = open(p).read()
if MARK in s: s = s[:s.index(MARK)]
open(p, 'w').write(s.rstrip('\n') + '\n' + '\n'.join(L) + '\n')
print('ok')
