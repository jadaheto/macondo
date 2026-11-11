# -*- coding: utf-8 -*-
"""Construye audiobiografías y audioresúmenes de Macondo Digital.
Ejecutar con el venv de TTS:  catalogo-dp/_tmp/tts/venv/bin/python -I catalogo-dp/_tools/biores-build.py [--skip-tts]
Pasos: (1) copia/une secciones LibriVox ya descargadas (_tmp/biores/raw) ; (2) sintetiza guiones originales con Piper ;
(3) escribe _tmp/biores/entries.json (entradas sin verificar). La verificación y los manifiestos los hace biores-verify.py."""
import importlib.util, json, os, re, shutil, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__))
CAT = os.path.dirname(HERE); ROOT = os.path.dirname(CAT)
RAW = os.path.join(ROOT, '_tmp', 'biores', 'raw'); TXT = os.path.join(ROOT, '_tmp', 'biores', 'txt')
SKIP_TTS = '--skip-tts' in sys.argv
RETRIEVED = '2026-10-31'

def load(name):
    spec = importlib.util.spec_from_file_location(name.replace('-', '_'), os.path.join(HERE, name + '.py'))
    m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m); return m

bios = load('biores-bios').BIOS
res = load('biores-resumenes').RES
lvmeta = load('biores-lv-meta').LV_META
plan = json.load(open(os.path.join(ROOT, '_tmp', 'biores', 'lv_plan.json')))
tts = None if SKIP_TTS else load('biores-tts')

VOICE = 'Voz sintética Piper es_ES-carlfm-x_low'
VOICE_LIC = ('Contenido propio; voz sintética Piper es_ES-carlfm-x_low (modelo MIT, dataset de dominio público)')
RIGHTS_OWN = 'Comfasucre – Biblioteca Macondo (contenido propio)'
TTS_NOTE = ('Narración con voz sintética abierta (Piper, voz es_ES-carlfm-x_low, calidad x_low, 16 kHz; modelo con licencia MIT '
            'y dataset declarado de dominio público). Inteligible pero robótica: se recomienda regrabar con narrador humano '
            'antes de producción. ')

def clean(s):
    return re.sub(r'\s+', ' ', s).strip()

# ---------------------------------------------------------------- textos de dominio público para entradas LibriVox
def flat(path):
    return clean(open(path, encoding='utf-8').read())

def between(s, start, end, last=False, after=0):
    i = s.rfind(start) if last else s.find(start, after)
    if i < 0: return None
    j = s.find(end, i + len(start))
    return s[i:j if j > 0 else None].strip()

def lv_text(slug):
    try:
        if slug.startswith('marti-'):
            s = flat(os.path.join(TXT, 'edaddeoro.txt'))
            if slug == 'marti-tres-heroes':
                return between(s, 'Tres héroes Cuentan', 'Dos milagros', after=0) or between(s, 'Tres héroes', 'Dos milagros', last=True)
            if slug == 'marti-el-padre-las-casas':
                return between(s, 'El Padre las Casas', 'Los zapaticos de rosa', last=True)
            if slug == 'marti-musicos-poetas-y-pintores':
                return between(s, 'Músicos, poetas y pintores', 'La última página', last=True)
        if slug == 'ramon-y-cajal-recuerdos-infancia':
            s = flat(os.path.join(TXT, 'pg58331.txt'))
            t = between(s, 'CAPÍTULO III Mi primera infancia', 'CAPÍTULO V')
            return re.sub(r'\s*Friso ornamental\s*$', '', t) if t else t
        if slug == 'lummis-colon-el-descubridor':
            s = flat(os.path.join(TXT, 'pg61739.txt'))
            t = between(s, 'COLÓN EL DESCUBRIDOR Salió Colón', 'HACIENDO GEOGRAFÍA')
            return re.sub(r'\s+IV$', '', t) if t else t
        if slug == 'lummis-cabeza-de-vaca':
            s = flat(os.path.join(TXT, 'pg61739.txt'))
            i = s.find('EL PRIMER CAMINANTE EN AMÉRICA Las proezas')
            return between(s, 'EL PRIMER CAMINANTE EN AMÉRICA Las proezas', 'EL MAS INTREPIDO CAMINANTE', after=max(i, 0))
    except FileNotFoundError:
        return None
    return None

entries = []
os.makedirs(os.path.join(CAT, 'audiobiografias'), exist_ok=True)
os.makedirs(os.path.join(CAT, 'audioresumenes'), exist_ok=True)

# ---------------------------------------------------------------- (1) LibriVox
for slug, meta in lvmeta.items():
    p = plan[slug]
    out_rel = f'audiobiografias/librivox-{p["id"]}-{slug}.mp3'
    out = os.path.join(CAT, out_rel)
    files = [os.path.join(RAW, os.path.basename(s['url'])) for s in p['sections']]
    if len(files) == 1:
        shutil.copyfile(files[0], out)
        mod = 'Ninguna (copia directa del archivo de 64 kbps).'
    else:
        lst = os.path.join(ROOT, '_tmp', 'biores', f'concat-{slug}.txt')
        with open(lst, 'w') as f:
            for fp in files: f.write(f"file '{fp}'\n")
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', lst, '-c', 'copy', out], check=True)
        mod = f'Unión sin recodificar (ffmpeg concat -c copy) de las secciones {", ".join(s["n"] for s in p["sections"])}.'
    readers = sorted({r for s in p['sections'] for r in s['readers']})
    secs = '; '.join(f'sección {s["n"]}: «{s["title"]}» ({s["url"]})' for s in p['sections'])
    trans = meta.get('translator')
    entries.append({
        'file': out_rel, 'cover': None, 'title': meta['title'], 'creator': meta['creator'], 'type': 'AUDIOBIOGRAPHY',
        'description': meta['description'], 'gradeMin': meta['gradeMin'], 'gradeMax': meta['gradeMax'],
        'categories': meta['categories'], 'language': 'es',
        'narrator': ', '.join(readers) + ' (voluntarios de LibriVox)', 'durationSeconds': None, 'status': 'DRAFT',
        'license': {'rightsHolder': 'Dominio público',
                    'licenseName': 'Dominio público en Colombia (Ley 23 de 1982); grabación LibriVox de dominio público',
                    'licenseUrl': 'https://librivox.org/pages/public-domain/', 'authorizedDevices': 30, 'offlineAllowed': True,
                    'validFrom': None, 'validUntil': None, 'territory': 'CO'},
        'source': {'provider': 'LibriVox', 'id': p['id'], 'url': p['url_librivox'], 'retrievedAt': RETRIEVED,
                   'sections': secs, 'textSource': p.get('url_text_source')},
        'rights': {'authorDeathYear': meta['authorDeath'], 'translator': trans, 'translatorDeathYear': meta.get('translatorDeath'),
                   'basis': (f'Texto: autor fallecido en {meta["authorDeath"] if meta["authorDeath"] else "época antigua"}'
                             + (f'; traductor {trans} fallecido en {meta.get("translatorDeath")}' if trans else '')
                             + ' (más de 80 años: dominio público en Colombia). Grabación: LibriVox, dedicada al dominio público.')},
        'sha256': None, 'sizeBytes': None,
        'reviewNotes': meta['reviewNotes'] + ' Modificaciones: ' + mod,
        'text': lv_text(slug), 'timeline': meta['timeline'], 'funFacts': meta['funFacts'], 'questions': meta['questions'],
    })

# ---------------------------------------------------------------- (2) guiones originales
def narr_bio(b):
    paras = [f'Audiobiografía de {b["name"]}. Biblioteca Macondo.'] + b['body']
    paras.append('Datos curiosos. ' + ' '.join(b['funFacts']))
    paras.append('Preguntas para pensar. ' + ' '.join(q['prompt'] for q in b['questions']))
    paras.append('Fin de la audiobiografía. Biblioteca Macondo, Comfasucre.')
    return paras

def narr_res(r):
    paras = [f'Audioresumen de {r["work"]}, de {r["author"]}. Biblioteca Macondo.'] + r['body']
    paras.append('Ideas principales. ' + ' '.join(r['ideas']))
    paras.append('Preguntas para pensar. ' + ' '.join(q['prompt'] for q in r['questions']))
    paras.append('Fin del audioresumen. Biblioteca Macondo, Comfasucre.')
    return paras

def words(paras):
    return len(' '.join(paras).split())

for b in bios:
    paras = narr_bio(b)
    out_rel = f'audiobiografias/macondo-{b["slug"]}.mp3'
    if tts: tts.synth(paras, os.path.join(CAT, out_rel), f'Audiobiografía: {b["name"]}', 'Biblioteca Macondo (Comfasucre)')
    entries.append({
        'file': out_rel, 'cover': None, 'title': f'Audiobiografía: {b["name"]}', 'creator': 'Biblioteca Macondo – Comfasucre (texto original)',
        'type': 'AUDIOBIOGRAPHY', 'description': b['description'], 'gradeMin': b['gradeMin'], 'gradeMax': b['gradeMax'],
        'categories': b['categories'], 'language': 'es', 'narrator': VOICE, 'durationSeconds': None, 'status': 'DRAFT',
        'license': {'rightsHolder': RIGHTS_OWN, 'licenseName': VOICE_LIC, 'licenseUrl': None, 'authorizedDevices': 30,
                    'offlineAllowed': True, 'validFrom': None, 'validUntil': None, 'territory': 'CO'},
        'source': {'provider': 'Macondo Digital (contenido propio)', 'id': b['slug'], 'url': None, 'retrievedAt': RETRIEVED},
        'rights': {'authorDeathYear': None, 'translator': None, 'translatorDeathYear': None,
                   'basis': 'Guion original escrito para el proyecto; hechos históricos de dominio común. Voz: Piper es_ES-carlfm-x_low.'},
        'sha256': None, 'sizeBytes': None,
        'reviewNotes': TTS_NOTE + f'Guion de {words(paras)} palabras narradas; revisar exactitud histórica y adecuación al grado antes de publicar.',
        'text': '\n\n'.join(paras), 'timeline': b['timeline'], 'funFacts': b['funFacts'], 'questions': b['questions'],
    })

EXTRA = {
    'fuente-ovejuna': 'Tema sensible: acoso y violencia del Comendador contra mujeres del pueblo, tortura en el interrogatorio (solo 9.º–11.º). ',
    'el-camaron-encantado': 'El cuento original termina con la muerte de Loppi y Masicas; el resumen lo menciona sin detalles. ',
    'lazarillo-de-tormes': 'La obra critica a clérigos de su época; el resumen lo presenta como contexto histórico-literario. ',
    'el-sombrero-de-tres-picos': 'La trama gira en torno al acoso de un corregidor a una mujer casada, tratado en clave de humor. ',
    'la-muneca-negra': 'Conviene acompañar la conversación sobre prejuicios raciales con mediación docente. ',
}
for r in res:
    paras = narr_res(r)
    out_rel = f'audioresumenes/macondo-{r["slug"]}.mp3'
    if tts: tts.synth(paras, os.path.join(CAT, out_rel), f'Audioresumen: {r["work"]}', 'Biblioteca Macondo (Comfasucre)')
    death = r['authorDeath']
    entries.append({
        'file': out_rel, 'cover': None, 'title': f'Audioresumen: {r["work"]}', 'creator': 'Biblioteca Macondo – Comfasucre (resumen original)',
        'type': 'AUDIOSUMMARY', 'description': r['description'], 'gradeMin': r['gradeMin'], 'gradeMax': r['gradeMax'],
        'categories': r['categories'], 'language': 'es', 'narrator': VOICE, 'durationSeconds': None, 'status': 'DRAFT',
        'license': {'rightsHolder': RIGHTS_OWN, 'licenseName': VOICE_LIC, 'licenseUrl': None, 'authorizedDevices': 30,
                    'offlineAllowed': True, 'validFrom': None, 'validUntil': None, 'territory': 'CO'},
        'source': {'provider': 'Macondo Digital (contenido propio)', 'id': r['slug'], 'url': None, 'retrievedAt': RETRIEVED,
                   'workTextSource': r['textSource'], 'catalogFile': r['catalogFile']},
        'rights': {'authorDeathYear': death, 'translator': None, 'translatorDeathYear': None,
                   'basis': ('Resumen original del proyecto (obra derivada breve) de una obra en dominio público en Colombia'
                             + (f' (autor fallecido en {death})' if death else ' (obra anónima del siglo XVI)') + '. Voz: Piper es_ES-carlfm-x_low.')},
        'sha256': None, 'sizeBytes': None,
        'reviewNotes': EXTRA.get(r['slug'], '') + TTS_NOTE + f'Resumen de {words(paras)} palabras narradas, redactado tras leer el texto fuente; revisión pedagógica pendiente.',
        'text': '\n\n'.join(paras), 'relatedTitle': r['work'], 'relatedCreator': r['author'], 'questions': r['questions'],
    })

json.dump(entries, open(os.path.join(ROOT, '_tmp', 'biores', 'entries.json'), 'w'), ensure_ascii=False, indent=1)
print(len(entries), 'entradas;', sum(e['type'] == 'AUDIOBIOGRAPHY' for e in entries), 'biografías;', sum(e['type'] == 'AUDIOSUMMARY' for e in entries), 'resúmenes')
