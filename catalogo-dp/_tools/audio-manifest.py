# Verifica los MP3 construidos y genera audiolibros.manifest.json y AUDIOLIBROS-FUENTES.md.
# Uso: python3 -I catalogo-dp/_tools/audio-manifest.py
import hashlib, json, os, runpy, subprocess

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
API = os.path.join(ROOT, '_tmp', 'audio', 'api')
BUILD = os.path.join(ROOT, '_tmp', 'audio', 'build')
_P = runpy.run_path(os.path.join(ROOT, '_tools', 'audio-plan.py'))
PLAN = _P['PLAN']
N1 = len(_P['PLAN1'])
RETRIEVED = '2026-10-31'
LICENSE_NAME = 'Texto: dominio público en Colombia (Ley 23 de 1982) · Grabación: dominio público (LibriVox)'

def outname(e): return f"librivox-{e[0]}{('-' + e[2]) if e[2] else ''}.mp3"
def hms(s):
    s = int(round(s)); return f'{s // 3600}:{s % 3600 // 60:02d}:{s % 60:02d}' if s >= 3600 else f'{s // 60}:{s % 60:02d}'

def verify(path):
    with open(path, 'rb') as f:
        head = f.read(3)
    ok = head == b'ID3' or (head[0] == 0xFF and (head[1] & 0xE0) == 0xE0)
    if not ok: raise RuntimeError('magic bytes inválidos ' + path)
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        for chunk in iter(lambda: f.read(1 << 20), b''): h.update(chunk)
    r = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration,bit_rate', '-of', 'json', path],
                       capture_output=True, text=True, check=True)
    fmt = json.loads(r.stdout)['format']
    return {'magic': head.hex(), 'sha256': h.hexdigest(), 'size': os.path.getsize(path),
            'duration': float(fmt['duration']), 'bitrate': int(fmt.get('bit_rate', 0))}

def narrator(chs):
    names = []
    for c in chs:
        for r in c['readers']:
            if r not in names: names.append(r)
    if len(names) <= 3: return ', '.join(names) + ' (LibriVox)', names
    return f'Varios lectores de LibriVox ({len(names)})', names

entries, rows = [], []
for e in PLAN:
    (lid, secs, suf, title, creator, adeath, transl, tdeath, gmin, gmax, cats, desc, notes, legal_extra) = e
    name = outname(e)
    path = os.path.join(ROOT, 'audiolibros', name)
    meta = json.load(open(os.path.join(BUILD, name + '.json')))
    book = json.load(open(os.path.join(API, f'b{lid}.json')))['books'][0]
    v = verify(path)
    narr, names = narrator(meta['chapters'])
    page = book['url_librivox']
    review = []
    if notes: review.append(notes)
    if len(meta['chapters']) > 1:
        review.append(f"Archivo único formado por {len(meta['chapters'])} secciones LibriVox ({meta['method']}). Índice: " +
                      '; '.join(f"{hms(c['start'])} {c['title'].strip()}" for c in meta['chapters']) + '.')
    else:
        review.append(f"Sección {meta['chapters'][0]['section']} de la grabación LibriVox «{book['title']}».") if len(book['sections']) > 1 else None
    if len(names) > 3: review.append('Lectores: ' + ', '.join(names) + '.')
    basis = (f'Autor fallecido en {adeath} (Ley 23 de 1982, art. 21: vida + 80 años).' if creator != 'Anónimo'
             else 'Obra anónima publicada en 1554.') + legal_extra + ' Grabación LibriVox dedicada al dominio público.'
    entry = {
        'file': 'audiolibros/' + name, 'cover': None, 'title': title, 'creator': creator, 'type': 'AUDIOBOOK',
        'description': desc, 'gradeMin': gmin, 'gradeMax': gmax, 'categories': cats, 'language': 'es',
        'narrator': narr, 'durationSeconds': int(round(v['duration'])), 'status': 'DRAFT',
        'license': {'rightsHolder': 'Dominio público', 'licenseName': LICENSE_NAME, 'licenseUrl': page,
                    'authorizedDevices': 30, 'offlineAllowed': True, 'validFrom': None, 'validUntil': None, 'territory': 'CO'},
        'source': {'provider': 'LibriVox', 'id': str(lid) + (f'#secciones {secs[0]}–{secs[-1]}' if len(secs) > 1 and len(secs) != len(book['sections']) else (f'#sección {secs[0]}' if len(secs) == 1 and len(book['sections']) > 1 else '')),
                   'url': page, 'retrievedAt': RETRIEVED},
        'rights': {'authorDeathYear': adeath if creator != 'Anónimo' else None, 'translator': transl,
                   'translatorDeathYear': tdeath, 'basis': basis},
        'sha256': v['sha256'], 'sizeBytes': v['size'],
        'reviewNotes': ' '.join(x for x in review if x) or None,
    }
    entries.append(entry)
    rows.append((lid, secs, title, creator, adeath, transl, tdeath, narr, names, v, name, meta, book, gmin, gmax))

json.dump(entries, open(os.path.join(ROOT, 'audiolibros.manifest.json'), 'w'), ensure_ascii=False, indent=2)

# ---- Informe
def band(g0, g1):
    return g0
bands = {'1.º–3.º': (1, 3), '4.º–5.º': (4, 5), '6.º–8.º': (6, 8), '9.º–11.º': (9, 11)}
tot_d = sum(r[9]['duration'] for r in rows); tot_s = sum(r[9]['size'] for r in rows)
L = []
L.append('# Audiolibros LibriVox — fuentes y verificación\n')
L.append(f'Recuperado el **{RETRIEVED}** por el agente de adquisición de audiolibros. {len(rows)} recursos en `audiolibros/`, '
         f'descritos en `audiolibros.manifest.json` (formato de `FORMATO.md`, `status: DRAFT`).\n')
L.append('## Método\n')
L.append('1. Catálogo completo de LibriVox descargado con la API (`/api/feed/audiobooks?format=json&limit=500&offset=N&fields={id,title,language,authors,...}`, '
         '45 páginas, pausas de 1,5 s). El parámetro `language=Spanish` de la API **no filtra** (devolvía todo el catálogo), así que se filtró localmente por `language == "Spanish"`: 588 proyectos.')
L.append('2. Metadatos extendidos (`?id=N&extended=1`) de los candidatos: secciones, lectores, URL de 64 kbps, fuente del texto. Los autores de las secciones de antologías multiautor se tomaron de la tabla de capítulos de la página del libro en librivox.org.')
L.append('3. Descarga secuencial con `curl -fL --retry 3` (desde la tercera pasada también `--retry-all-errors`, porque archive.org cortó varias conexiones con el error 56; el script es reanudable y se ejecutó tres veces hasta completar sin fallos), User-Agent descriptivo y 1,5 s de pausa entre archivos; solo archivos `_64kb.mp3` de archive.org (nunca 128 kbps ni zip). Temporales en `_tmp/audio/` (borrados tras concatenar).')
L.append('4. Obras de varias secciones: unidas en un único MP3 con `ffmpeg -f concat -safe 0 -i list.txt -c copy` (si todas las secciones tenían el mismo códec/frecuencia/canales; si no, recodificación a 64 kbps mono con libmp3lame). El índice con tiempos de inicio está en `reviewNotes` de cada entrada.')
L.append('5. Verificación de cada MP3 final: bytes mágicos (ID3 `494433` o sincronía `0xFFE*`), duración con `ffprobe`, SHA-256 y tamaño (límite inicial 150 MB/archivo y 2,5 GB en total; ampliado por el coordinador, con aprobación del usuario, a 300 MB/archivo y 6 GB para el lote 1, y luego a 10 GB para los 100 recursos).')
L.append('6. Validación de cada entrada con `ResourceInputSchema` de `@macondo/shared` (`packages/shared/dist/index.js`).\n')
L.append('Scripts: `_tools/audio-fetch-details.sh`, `_tools/audio-show.py`, `_tools/audio-plan.py` (selección y metadatos), `_tools/audio-build.py` (descarga/concatenación), `_tools/audio-manifest.py` (verificación, manifiesto e informe), `_tools/audio-validate.js`.\n')
L.append('## Filtro legal\n')
L.append('- **Grabación**: todas las grabaciones LibriVox están dedicadas al dominio público.')
L.append('- **Texto**: LibriVox solo verifica el dominio público en EE. UU. Para Colombia (Ley 23 de 1982, art. 21: vida + 80 años) se exigió autor fallecido **en 1945 o antes** según `dod` de la API (o de la ficha del autor en la página del libro, para antologías). Se descartaron autores sin fecha de muerte o fallecidos después de 1945.')
L.append('- **Traducciones**: se priorizaron obras escritas originalmente en español. Las únicas obras no originales en español son adaptaciones hechas por autores también fallecidos antes de 1946 (José Martí †1895 sobre Laboulaye †1883 y Andersen †1875; Juan Valera †1905 sobre un cuento tradicional japonés; Rafael Pombo †1912, versiones libres de rimas infantiles inglesas tradicionales). Los cuentos populares chilenos son de tradición oral anónima, recogidos y redactados por Ramón Laval (†1929). No se incluyó ninguna traducción cuyo traductor no pudiera identificarse.')
L.append('- **Aparato editorial**: se omitieron secciones de prólogos, biografías o notas de editores no identificados (La vida es sueño s0, s1, s16; María s0; Mitología s1; Páginas escogidas s1). Se excluyeron biografías y semblanzas (p. ej. «Tres héroes» de La Edad de Oro y la tercera parte de la Mitología de Fernán Caballero), porque otro proceso produce las audiobiografías.\n')
L.append('## Lotes\n')
L.append(f'- **Lote 1** (entradas 1–{N1} del manifiesto): selección general 1.º–11.º, con clásicos latinoamericanos, colombianos y españoles.')
L.append(f'- **Lote 2** (entradas {N1+1}–{len(rows)}): pedido posterior del usuario, priorizando 1.º–5.º (cuentos populares chilenos de Ramón Laval, más textos de La Edad de Oro, fábulas de Pombo, leyendas), más algunos clásicos para 8.º–11.º.\n')
L.append('## Resumen\n')
L.append(f'- Recursos: **{len(rows)}** · Duración total: **{hms(tot_d)}** ({int(tot_d)} s) · Tamaño total: **{tot_s / 1e9:.2f} GB** ({tot_s} bytes)')
L.append(f'- Archivo más grande: {max(r[9]["size"] for r in rows) / 1048576:.1f} MiB · Todos en MP3 64 kbps.')
for lab, sub in (('Lote 1', rows[:N1]), ('Lote 2', rows[N1:])):
    d = sum(r[9]['duration'] for r in sub); s = sum(r[9]['size'] for r in sub)
    L.append(f'- {lab}: {len(sub)} recursos · {hms(d)} · {s / 1e9:.2f} GB')
L.append('- Recursos cuyo rango de grados incluye cada franja (total / lote 1 / lote 2):')
for k, (a, b) in bands.items():
    f = lambda sub: sum(1 for r in sub if r[13] <= b and r[14] >= a)
    L.append(f'  - {k}: {f(rows)} / {f(rows[:N1])} / {f(rows[N1:])}')
L.append(f'- Recursos de literatura colombiana: {sum(1 for e in entries if "Literatura colombiana" in e["categories"])} (Pombo, Carrasquilla, Isaacs, Rivera).\n')
L.append('## Tabla\n')
L.append('| Lote | Archivo | LibriVox id (secciones) | Título | Autor (†) | Traductor/adaptador | Lectores | Grados | Duración | SHA-256 (prefijo) | Bytes |')
L.append('|---|---|---|---|---|---|---|---|---|---|---|')
for idx, (lid, secs, title, creator, adeath, transl, tdeath, narr, names, v, name, meta, book, g0, g1) in enumerate(rows):
    sec = (f's{secs[0]}' if len(secs) == 1 else f's{secs[0]}–s{secs[-1]}') if len(secs) != len(book['sections']) else 'completo'
    rd = ', '.join(names) if len(names) <= 4 else f'Varios ({len(names)}): ' + ', '.join(names[:4]) + '…'
    L.append(f'| {1 if idx < N1 else 2} | `{name}` | [{lid}]({book["url_librivox"]}) ({sec}) | {title} | {creator} ({adeath if creator != "Anónimo" else "anónimo, 1554"}) | '
             f'{transl or "—"} | {rd} | {g0}–{g1} | {hms(v["duration"])} | `{v["sha256"][:12]}` | {v["size"]} |')
L.append('\n## Exclusiones notables\n')
L.append('- **Biografías** (las produce otro agente como AUDIOBIOGRAPHY): «Tres héroes» (Martí), *La vida de Rubén Darío*, *Vida de Lord Byron*, etc.\n- **Duplicados de `demo-content/`**: «Las medias de los flamencos» (Quiroga; LibriVox 6706 s3 y también Relatos y cuentos 001 s1) y «Los zapaticos de rosa» (Martí; 2162 s19).')
L.append('- **Autor fallecido después de 1945 o sin fecha**: Juan Ramón Jiménez (*Platero y yo*, †1958), Pío Baroja (†1956), Mariano Azuela (†1952), Alfonso Reyes (†1959), Oliverio Girondo (†1967), Pablo Neruda (†1973), Julio Camba (†1962), Vicente Huidobro (†1948; «La montaña» en la Antología de cuentos hispanoamericanos), H. G. Wells (†1946), Luis Eduardo Pacheco (†1976), *Supersticiones y leyendas mayas* (autor sin fecha de muerte).')
L.append('- **Traducciones con traductor no identificado** (texto de autor antiguo pero traducción sin datos verificables): Fábulas de Esopo (fuente: traducción web moderna), Cuentos de Grimm (fuente: cuentosdegrimm.com), Perrault, Andersen (*Cuentos escogidos*, traductor no indicado), Madame d’Aulnoy, Schmid (*Cuentos nuevos*), Afanásiev (*Cuentos populares rusos*), Frobenius, *Alicia* abreviada (1914, traductor anónimo), *Las mil noches y una noche*, *Simbad*, Homero, Shakespeare, Verne, Dickens, etc. Esto es lo que más limita la oferta para 1.º–3.º.\n- **Contenido o fuente no apropiados para primaria**: «Delgadina y el culebrón» (Laval; tema del romance de Delgadina), chascarros breves de Laval de menos de 3 minutos o con burlas (s29–s35, s37–s40); Apéndice de *Fábulas y verdades* (ensayo sobre un método de lectura); *Cuentos mejicanos* de Cornyn (autores de cada texto no identificados en la API); *Supersticiones y leyendas mayas* (autor sin fecha de muerte); *Costa Rica pintoresca* y *Cuentos mexicanos* (sin audio publicado).\n- **Duplicados internos evitados**: «La hormiguita» y «Los caballeros del pez» (ya en Fernán Caballero 7662), «Historia de dos cachorros de coatí» (Relatos 002 s7, ya en 6706), «El resucitado» y «Los duendes del Cuzco» (ya en *Tradiciones peruanas*), «La garita del diablo» de Coll y Toste (ya en la versión de Fernández Juncos), «¡Adiós, Cordera!» de la Antología (ya en Relatos 001).')
L.append('- **Obras largas divididas** (superan 300 MB / ~10 h): *María* (12,3 h) y *La vorágine* (12 h) se dividieron en dos partes cada una, por secciones completas. Con el límite ampliado se añadieron *Marianela*, *Tradiciones peruanas*, *La vorágine* y *El sombrero de tres picos*, y se retiraron «El lago encantado» y «Un espanto de verdad» (descripción no verificable) y «Los duendes del Cuzco» de Relatos y cuentos 002 (incluida ya en *Tradiciones peruanas*).')
L.append('- **Sin audio publicado**: *Policarpa Salabarrieta* (Constancio Franco Vargas), proyecto sin archivos en la API.')
L.append('- *La Navidad en las montañas* (Altamirano): la fuente es una edición escolar estadounidense con posible aparato editorial; no verificado, se dejó fuera.\n')
L.append('## Pendiente de revisión humana\n')
L.append('- Revisión pedagógica de todas las fichas (`status: DRAFT`), en especial las marcadas en `reviewNotes` (terror, violencia, temas adultos, expresiones de época).')
L.append('- Relatos y cuentos 001 (LibriVox 3898): la página marca las secciones con idioma «en»; confirmar escuchando que la lectura en español es clara.')
L.append('- Lote 2: 18 cuentos populares de Laval tienen descripción genérica (basada en el título); conviene escucharlos o leerlos (Project Gutenberg #63424) antes de publicar.\n- Escucha de control de los archivos concatenados (las transiciones entre secciones no se revisaron de oído).')
L.append('- Descripciones redactadas sin escuchar los audios: se basan en el conocimiento de las obras y en los títulos de sección; conviene cotejarlas.')
open(os.path.join(ROOT, 'AUDIOLIBROS-FUENTES.md'), 'w').write('\n'.join(L) + '\n')
print('entradas', len(entries), 'duración', hms(tot_d), 'bytes', tot_s)
