# -*- coding: utf-8 -*-
"""Genera catalogo-dp/AUDIO-BIO-RESUMEN-FUENTES.md a partir de los manifiestos verificados y del informe de verificación.
Uso: python3 -I catalogo-dp/_tools/biores-fuentes.py"""
import json, os
HERE = os.path.dirname(os.path.abspath(__file__)); CAT = os.path.dirname(HERE); ROOT = os.path.dirname(CAT)
bio = json.load(open(os.path.join(CAT, 'audiobiografias.manifest.json')))
res = json.load(open(os.path.join(CAT, 'audioresumenes.manifest.json')))
rep = {r['file']: r for r in json.load(open(os.path.join(ROOT, '_tmp', 'biores', 'verify-report.json')))}
val = open(os.path.join(ROOT, '_tmp', 'biores', 'validate.log')).read().strip() if os.path.exists(os.path.join(ROOT, '_tmp', 'biores', 'validate.log')) else '(no ejecutada)'
tts_check = open(os.path.join(ROOT, '_tmp', 'biores', 'tts-intelligibility.txt')).read().strip() if os.path.exists(os.path.join(ROOT, '_tmp', 'biores', 'tts-intelligibility.txt')) else '(no ejecutada)'
fmt = lambda s: f'{s // 60}:{s % 60:02d}'
lv = [e for e in bio if e['source']['provider'] == 'LibriVox']; own = [e for e in bio if e['source']['provider'] != 'LibriVox']
allE = bio + res
tot_d = sum(e['durationSeconds'] for e in allE); tot_s = sum(e['sizeBytes'] for e in allE)
L = []
A = L.append
A('# Audiobiografías y audioresúmenes — método, voz, fuentes y verificación\n')
A(f'Generado el **2026-10-31** por el agente de audiobiografías/audioresúmenes. **{len(bio)} audiobiografías** '
  f'({len(lv)} de LibriVox + {len(own)} con guion original) y **{len(res)} audioresúmenes** (guion original). '
  f'Duración total **{tot_d/3600:.2f} h**, **{tot_s/1e6:.1f} MB**. Todas las entradas en `status: DRAFT`.\n')
A('Manifiestos: `audiobiografias.manifest.json`, `audioresumenes.manifest.json` (formato de `FORMATO.md`, con los campos extra '
  '`text`, `timeline`, `funFacts`, `questions`, `relatedTitle`, `relatedCreator`). Archivos: `audiobiografias/*.mp3`, `audioresumenes/*.mp3`.\n')
A('## Criterio legal\n')
A('- **Textos**: dominio público en Colombia (Ley 23 de 1982: autor y traductor fallecidos antes de 1946) **o** texto original escrito para el proyecto. '
  'Los guiones originales se redactaron con palabras propias; los hechos se apoyan en datos históricos ampliamente documentados (los hechos no son objeto de derecho de autor). '
  'No se copiaron frases de Wikipedia ni de otras fuentes. Las únicas citas literales son versos breves de obras en dominio público (p. ej., Candelario Obeso, †1884).')
A('- **Grabaciones LibriVox**: dedicadas al dominio público por LibriVox (https://librivox.org/pages/public-domain/). Se usaron solo los archivos de 64 kbps de archive.org.')
A('- **Personas vivas o fallecidas recientemente**: excluidas. Gabriela Mistral (†1957) aparece solo como tema de una biografía original; no se citan sus poemas (no están en dominio público en Colombia).')
A('- **Resúmenes**: obras derivadas breves, originales, de obras en dominio público; se leyó el texto fuente antes de redactar (ver tabla).\n')
A('## Voz sintética (guiones originales)\n')
A('- **Motor**: Piper TTS (`piper-tts` 1.8.0, paquete de OHF-Voice/piper1-gpl; la licencia GPL del software no se extiende al audio generado), instalado en `catalogo-dp/_tmp/tts/venv` (Python 3.14).')
A('- **Voz**: `es_ES-carlfm-x_low` de https://huggingface.co/rhasspy/piper-voices (repositorio con licencia **MIT**). '
  'MODEL_CARD: dataset https://github.com/carlfm01/my-speech-datasets, licencia **Public domain**, modelo *trained from scratch*. '
  'Copia del MODEL_CARD en `catalogo-dp/_tmp/tts/voices/MODEL_CARD`.')
A('- **Por qué esta voz**: se revisaron los MODEL_CARD de todas las voces en español. Las de mayor calidad (`es_ES-davefx-medium`, `es_ES-sharvard-medium`, `es_AR-daniela-high`, `es_MX-ald-*`) '
  'son ajustes finos (*finetuned*) del modelo inglés `lessac`, cuyo dataset (Blizzard 2013) tiene una licencia restrictiva; `es_ES-mls_*` parte del modelo `ryan`; `es_MX-claude-high` no documenta su base. '
  '`carlfm` es la única entrenada desde cero con datos de dominio público, por lo que se eligió pese a su calidad *x_low* (16 kHz).')
A('- **Parámetros**: length_scale 1.3, noise_scale 0.6, noise_w 0.7; 0,35 s de silencio entre frases y 0,9 s entre párrafos. Conversión: ffmpeg/libmp3lame, **64 kbps, mono, 44,1 kHz**, etiquetas ID3v2.3.')
A('- **Calidad**: inteligible pero robótica; algunas consonantes finales se debilitan. Se recomienda regrabar con narrador humano (con cesión de derechos firmada) antes de producción. '
  'No se usó la voz de macOS (`say`), cuya licencia es personal/no comercial.')
A(f'- **Prueba de inteligibilidad** (transcripción automática con faster-whisper `small` de un fragmento de cada uno de varios archivos generados; solo control, no sustituye la escucha humana):\n\n```\n{tts_check}\n```\n')
A('## Método\n')
A('1. **LibriVox**: catálogo en español (588 proyectos; el filtro `language` de la API no filtra, se filtró localmente) y metadatos extendidos (`?id=N&extended=1`) de los candidatos biográficos. '
  'Descarga secuencial con `curl`, User-Agent descriptivo y 1,5 s de pausa (`_tools/biores-lv-download.sh`), solo `_64kb.mp3`.')
A('2. **Revisión de contenido**: se leyó el texto fuente cuando estaba disponible (Gutenberg: Martí, Ramón y Cajal, Lummis) y, cuando no, se transcribió el audio con faster-whisper (`_tools/biores-transcribe.py`) para revisar el contenido '
  '(Fernán Caballero, Darío, Obregón, Confucio, Gimeno de Flaquer). Se descartaron 4 secciones tras la revisión (ver `_tools/biores-lv-meta.py`, `DESCARTADAS`). '
  'Se cambió la selección de Ramón y Cajal de los caps. I–II a los caps. III–IV (más narrativos).')
A('3. **Guiones originales** (`_tools/biores-bios.py`, `_tools/biores-resumenes.py`) → síntesis con Piper (`_tools/biores-tts.py`, `_tools/biores-build.py`).')
A('4. **Verificación** (`_tools/biores-verify.py`): bytes mágicos (ID3/sincronía MPEG), `ffprobe` (códec, duración → `durationSeconds`, bitrate, canales), SHA-256 y tamaño. '
  f'**Validación** (`_tools/biores-validate.js`) de cada entrada con `ResourceInputSchema` de `packages/shared/dist/index.js` más comprobaciones propias (DRAFT, archivo existente, ≥3 preguntas, índice de respuesta válido, timeline/funFacts en biografías). Resultado:\n\n```\n{val}\n```\n')
A('Reproducir: `bash catalogo-dp/_tools/biores-lv-download.sh` → `catalogo-dp/_tmp/tts/venv/bin/python -I catalogo-dp/_tools/biores-build.py` → `python3 -I catalogo-dp/_tools/biores-verify.py` → `node catalogo-dp/_tools/biores-validate.js` → `python3 -I catalogo-dp/_tools/biores-fuentes.py`.\n')
A('## Audiobiografías de LibriVox\n')
A('| Archivo | Obra / autor (†) | Sección(es) y lectores | Grados | Duración | Bytes | SHA-256 (prefijo) |')
A('|---|---|---|---|---|---|---|')
for e in lv:
    r = e['rights']
    tr = f"; trad. {r['translator']} (†{r['translatorDeathYear']})" if r.get('translator') else ''
    A(f"| `{e['file']}` | {e['title']} — {e['creator']} (†{r['authorDeathYear']}){tr} | LibriVox #{e['source']['id']}, sección(es) {', '.join(x.split(':')[0].replace('sección ','') for x in e['source']['sections'].split('; '))}; {e['narrator']} | "
      f"{e['gradeMin']}–{e['gradeMax']} | {fmt(e['durationSeconds'])} | {e['sizeBytes']} | `{e['sha256'][:16]}` |")
A('\nURL exactas de cada sección: campo `source.sections` del manifiesto. Página del proyecto: `source.url`. Fuente del texto según LibriVox: `source.textSource`.\n')
A('## Audiobiografías con guion original\n')
A('| Archivo | Persona | Grados | Palabras narradas | Duración | Bytes | SHA-256 (prefijo) |')
A('|---|---|---|---|---|---|---|')
for e in own:
    A(f"| `{e['file']}` | {e['title'].replace('Audiobiografía: ', '')} | {e['gradeMin']}–{e['gradeMax']} | {len(e['text'].split())} | {fmt(e['durationSeconds'])} | {e['sizeBytes']} | `{e['sha256'][:16]}` |")
A('\n## Audioresúmenes (guion original)\n')
A('| Archivo | Obra resumida — autor (†) | Texto leído para resumir | Grados | Palabras | Duración | Bytes | SHA-256 (prefijo) |')
A('|---|---|---|---|---|---|---|---|')
for e in res:
    d = e['rights']['authorDeathYear']
    A(f"| `{e['file']}` | *{e['relatedTitle']}* — {e['relatedCreator']} ({'†' + str(d) if d else 'anónimo, s. XVI'}) | {e['source'].get('catalogFile') or e['source']['workTextSource']} | "
      f"{e['gradeMin']}–{e['gradeMax']} | {len(e['text'].split())} | {fmt(e['durationSeconds'])} | {e['sizeBytes']} | `{e['sha256'][:16]}` |")
A('\nLectura de fuentes: lectura completa de los textos breves (Ratón Pérez, La tortuga gigante, La abeja haragana, Bebé y el señor don Pomposo, La muñeca negra, El camarón encantado, La lechera, El rayo de luna, Mi último adiós); '
  'en obras extensas (Lazarillo, Quijote, Marianela, El sí de las niñas, Fuente Ovejuna, El Capitán Veneno, Trafalgar, La Navidad en las montañas, Ariel, El sombrero de tres picos, Coplas) '
  'se cotejaron en el EPUB del catálogo personajes, lugares, fechas y episodios clave (búsquedas dirigidas y lectura de pasajes, incluido el desenlace). '
  '*María* (Isaacs) se descartó como resumen porque no se pudo consultar el texto (Wikisource limitó las peticiones) y fue sustituida por *El sombrero de tres picos*.\n')
A('## Pendiente de revisión humana\n')
A('- **Todas** las pistas con voz sintética: escucha completa (pronunciación de nombres propios y cifras) y, idealmente, regrabación con narrador humano.')
A('- **Contenido sensible / perspectiva histórica** (ver `reviewNotes`): Lummis (Colón, Cabeza de Vaca) y Obregón (Balboa) presentan la conquista de forma apologética; '
  'el cap. 4 de Balboa narra sin crítica una matanza de indígenas (valorar si se publica). Fernán Caballero y Gimeno de Flaquer: tono moralizante del siglo XIX. '
  'Darío (caps. I–V): alusiones sensuales adolescentes (solo 10.º–11.º). Martí, *El Padre Las Casas*: violencia de la conquista.')
A('- **Resúmenes**: *Fuente Ovejuna* (acoso y violencia del Comendador, 9.º–11.º); *El camarón encantado* (final trágico); revisión pedagógica de preguntas y grados.')
A('- **Datos a confirmar por el equipo**: fecha de nacimiento de Policarpa Salavarrieta (se indica como la más citada) y de Sor Juana (1648/1651, se indica la duda); detalles tradicionales de Benkos Biohó (presentados como tradición); '
  'autoría del original francés de *Vida y pensamientos morales de Confucio* (atribuida a P.-C. Levesque).')
A('- **Sin portadas**: `cover: null` en todas las entradas.')
open(os.path.join(CAT, 'AUDIO-BIO-RESUMEN-FUENTES.md'), 'w').write('\n'.join(L) + '\n')
print('ok', len(L), 'líneas')
