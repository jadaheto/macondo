# -*- coding: utf-8 -*-
"""Lote 2 de audiobiografías (21): 5 secciones LibriVox + 16 guiones originales con Piper es_ES-carlfm-x_low.
Uso: catalogo-dp/_tmp/tts/venv/bin/python -I catalogo-dp/_tools/biores-lote2.py [--skip-tts]
Escribe los MP3 en catalogo-dp/audiobiografias/, verifica cada archivo (bytes mágicos, ffprobe, sha256, tamaño)
y genera catalogo-dp/audiobiografias-lote2.manifest.json (status PUBLISHED, aprobado por el usuario)."""
import hashlib, importlib.util, json, os, shutil, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__)); CAT = os.path.dirname(HERE); ROOT = os.path.dirname(CAT)
RAW = os.path.join(ROOT, '_tmp', 'biores', 'raw'); LV = os.path.join(ROOT, '_tmp', 'biores', 'lv')
SKIP_TTS = '--skip-tts' in sys.argv
RETRIEVED = '2026-10-31'

def load(name):
    spec = importlib.util.spec_from_file_location(name.replace('-', '_'), os.path.join(HERE, name + '.py'))
    m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m); return m

def q(prompt, options, answer, explanation):
    return {"prompt": prompt, "options": options, "answer": answer, "explanation": explanation}

BIOS2 = load('biores-bios-lote2').BIOS2
tts = None if SKIP_TTS else load('biores-tts')

LV2 = {
 'caballero-los-siete-sabios': ('13232', '15', {
  "title": "Los siete sabios de Grecia (Historia de los grandes hombres de la Grecia)", "creator": "Fernán Caballero", "authorDeath": 1877,
  "gradeMin": 7, "gradeMax": 11, "categories": ["Biografías", "Grecia antigua", "Filosofía"],
  "description": "Vidas breves y máximas de los siete sabios de Grecia, como Tales de Mileto, Solón, Pítaco y Cleóbulo, contadas para jóvenes lectores en el siglo XIX.",
  "timeline": [{"year": -624, "event": "Hacia esta fecha nace Tales de Mileto (el texto da 640 a. C.)."}, {"year": -594, "event": "Hacia esta fecha Solón reforma las leyes de Atenas."}],
  "funFacts": ["Según la tradición, Tales enseñó a los egipcios a medir la altura de las pirámides por su sombra.", "Pítaco solo aceptó como premio las tierras que alcanzaba el tiro de su ballesta."],
  "questions": [q("¿Quién es el primero de los siete sabios según el texto?", ["Tales de Mileto", "Sócrates", "Homero"], 0, "Tales nació en Mileto."),
                q("¿Qué enseñó Tales a los sacerdotes egipcios, según la tradición?", ["A medir las pirámides", "A escribir", "A navegar"], 0, "Midió las pirámides con geometría."),
                q("¿Por qué Pítaco rechazó recibir muchas tierras?", ["Para no crearse envidiosos", "Porque eran malas", "Porque se iba de viaje"], 0, "Pensaba que recibir mucho crea envidia.")],
  "reviewNotes": "Texto del siglo XIX con introducción de tono apologético cristiano; anécdotas tradicionales no siempre históricas."}),
 'caballero-teofrasto-herodoto-epaminondas': ('13232', '20', {
  "title": "Teofrasto, Heródoto y Epaminondas (Historia de los grandes hombres de la Grecia)", "creator": "Fernán Caballero", "authorDeath": 1877,
  "gradeMin": 7, "gradeMax": 11, "categories": ["Biografías", "Grecia antigua", "Historia", "Ciencia"],
  "description": "Vidas breves del naturalista Teofrasto, discípulo de Aristóteles; del historiador Heródoto, y del general tebano Epaminondas.",
  "timeline": [{"year": -484, "event": "Hacia esta fecha nace Heródoto en Halicarnaso."}, {"year": -371, "event": "Epaminondas vence a Esparta en la batalla de Leuctra."}, {"year": -287, "event": "Hacia esta fecha muere Teofrasto."}],
  "funFacts": ["Teofrasto se llamaba Tirtamo; Aristóteles le dio un nombre que significa 'lenguaje divino'.", "Heródoto es llamado el padre de la historia."],
  "questions": [q("¿Quién fue maestro de Teofrasto?", ["Aristóteles", "Esopo", "Pitágoras"], 0, "Heredó la escuela de Aristóteles."),
                q("¿Sobre qué escribió Teofrasto?", ["Sobre las plantas y las piedras", "Sobre barcos", "Sobre música"], 0, "Se conservan sus tratados de plantas y piedras."),
                q("¿Qué batalla ganó Epaminondas?", ["Leuctra", "Boyacá", "Trafalgar"], 0, "Venció a los espartanos en Leuctra.")],
  "reviewNotes": "Texto del siglo XIX; incluye episodios bélicos narrados brevemente."}),
 'gimeno-madame-dacier-y-marquesa-du-chatelet': ('21404', '8', {
  "title": "Madame Dacier y la Marquesa du Châtelet (Mujeres: vidas paralelas)", "creator": "Concepción Gimeno de Flaquer", "authorDeath": 1919,
  "gradeMin": 9, "gradeMax": 11, "categories": ["Biografías", "Mujeres en la historia", "Ciencia", "Literatura"],
  "description": "Ensayo biográfico sobre dos sabias francesas: la helenista Anne Dacier, traductora de Homero, y Émilie du Châtelet, matemática y física que tradujo a Newton.",
  "timeline": [{"year": 1647, "event": "Hacia esta fecha nace Anne Dacier."}, {"year": 1706, "event": "Nace Émilie du Châtelet en París."}, {"year": 1749, "event": "Muere Émilie du Châtelet, poco después de terminar su traducción de los Principia de Newton."}],
  "funFacts": ["La traducción francesa de los Principia de Newton hecha por Émilie du Châtelet se siguió usando durante siglos.", "Anne Dacier tradujo al francés la Ilíada y la Odisea."],
  "questions": [q("¿Qué obra científica tradujo Émilie du Châtelet?", ["Los Principia de Newton", "El Quijote", "La Biblia"], 0, "Tradujo y comentó a Newton."),
                q("¿Qué tradujo Anne Dacier?", ["La Ilíada y la Odisea", "Hamlet", "María"], 0, "Era una gran helenista."),
                q("¿Qué defiende la autora en este capítulo?", ["El derecho de las mujeres al conocimiento científico", "Que las mujeres no deben estudiar", "La vida en el campo"], 0, "Gimeno de Flaquer defiende la instrucción femenina.")],
  "reviewNotes": "Ensayo de fines del siglo XIX, con lenguaje de su época; valioso como defensa temprana de la educación científica de las mujeres."}),
 'gimeno-beatriz-galindo-e-isidra-guzman': ('21404', '13', {
  "title": "Beatriz Galindo y María Isidra Guzmán (Mujeres: vidas paralelas)", "creator": "Concepción Gimeno de Flaquer", "authorDeath": 1919,
  "gradeMin": 9, "gradeMax": 11, "categories": ["Biografías", "Mujeres en la historia", "Educación"],
  "description": "Retrato de dos sabias españolas: Beatriz Galindo, la Latina, maestra de Isabel la Católica, y María Isidra Guzmán, primera mujer doctora de la Universidad de Alcalá (1785).",
  "timeline": [{"year": 1465, "event": "Hacia esta fecha nace Beatriz Galindo."}, {"year": 1534, "event": "Muere Beatriz Galindo en Madrid."}, {"year": 1768, "event": "Nace María Isidra Guzmán y de la Cerda en Madrid."}, {"year": 1785, "event": "María Isidra recibe el doctorado en la Universidad de Alcalá, con 17 años."}],
  "funFacts": ["A Beatriz Galindo la llamaban la Latina por su dominio del latín; un barrio de Madrid conserva ese nombre.", "María Isidra Guzmán se doctoró a los 17 años."],
  "questions": [q("¿Por qué llamaban a Beatriz Galindo la Latina?", ["Por su dominio del latín", "Porque nació en América", "Porque bailaba"], 0, "Era una gran latinista."),
                q("¿De quién fue maestra Beatriz Galindo?", ["De la reina Isabel la Católica", "De Cervantes", "De Bolívar"], 0, "Fue consejera y maestra de la reina."),
                q("¿Qué logró María Isidra Guzmán en 1785?", ["Doctorarse en la Universidad de Alcalá", "Ser reina", "Viajar a la Luna"], 0, "Fue la primera doctora de esa universidad.")],
  "reviewNotes": "Ensayo de fines del siglo XIX con tono elogioso y religioso propio de la época."}),
 'gimeno-dos-escritoras-realistas': ('21404', '15', {
  "title": "Dos escritoras realistas: María de Zayas y Fernán Caballero (Mujeres: vidas paralelas)", "creator": "Concepción Gimeno de Flaquer", "authorDeath": 1919,
  "gradeMin": 10, "gradeMax": 11, "categories": ["Biografías", "Mujeres en la historia", "Literatura española"],
  "description": "Ensayo sobre el realismo literario y dos novelistas españolas: María de Zayas, del siglo XVII, y Fernán Caballero (Cecilia Böhl de Faber), autora de La gaviota.",
  "timeline": [{"year": 1590, "event": "Hacia esta fecha nace María de Zayas en Madrid."}, {"year": 1637, "event": "María de Zayas publica sus Novelas amorosas y ejemplares."}, {"year": 1849, "event": "Fernán Caballero publica La gaviota."}, {"year": 1877, "event": "Muere Fernán Caballero en Sevilla."}],
  "funFacts": ["Fernán Caballero era el seudónimo de una mujer, Cecilia Böhl de Faber.", "María de Zayas defendió en sus novelas la inteligencia de las mujeres frente a sus detractores."],
  "questions": [q("¿Quién se escondía detrás del seudónimo Fernán Caballero?", ["Cecilia Böhl de Faber", "Benito Pérez Galdós", "Rosalía de Castro"], 0, "Era una escritora que usó nombre masculino."),
                q("¿En qué siglo escribió María de Zayas?", ["En el siglo XVII", "En el siglo XXI", "En el siglo X"], 0, "Fue contemporánea de Lope de Vega."),
                q("¿Por qué crees que algunas escritoras usaban seudónimos masculinos?", ["Para ser tomadas en serio en una época con prejuicios contra las mujeres", "Porque era obligatorio por ley", "Porque no sabían su nombre"], 0, "El seudónimo las protegía de prejuicios.")],
  "reviewNotes": "Ensayo de crítica literaria del siglo XIX; menciona de pasada el naturalismo de Zola con desaprobación moral. La gaviota está en el catálogo."}),
}

TTS_NOTE = ('Narración con voz sintética abierta (Piper, voz es_ES-carlfm-x_low, modelo MIT, dataset de dominio público); '
            'inteligible pero robótica, revisar pronunciación de nombres propios. ')
entries = []
for slug, (bid, sec, m) in LV2.items():
    b = json.load(open(os.path.join(LV, bid + '.json')))['books'][0]
    s = [x for x in b['sections'] if x['section_number'] == sec][0]
    url = s['listen_url'].replace('://www.archive.org/', '://archive.org/')
    out_rel = f'audiobiografias/librivox-{bid}-{slug}.mp3'
    shutil.copyfile(os.path.join(RAW, os.path.basename(url)), os.path.join(CAT, out_rel))
    entries.append({
        'file': out_rel, 'cover': None, 'title': m['title'], 'creator': m['creator'], 'type': 'AUDIOBIOGRAPHY',
        'description': m['description'], 'gradeMin': m['gradeMin'], 'gradeMax': m['gradeMax'], 'categories': m['categories'], 'language': 'es',
        'narrator': ', '.join(r['display_name'] for r in s['readers']) + ' (voluntarios de LibriVox)', 'durationSeconds': None, 'status': 'PUBLISHED',
        'license': {'rightsHolder': 'Dominio público', 'licenseName': 'Dominio público en Colombia (Ley 23 de 1982); grabación LibriVox de dominio público',
                    'licenseUrl': 'https://librivox.org/pages/public-domain/', 'authorizedDevices': 30, 'offlineAllowed': True,
                    'validFrom': None, 'validUntil': None, 'territory': 'CO'},
        'source': {'provider': 'LibriVox', 'id': bid, 'url': b['url_librivox'], 'retrievedAt': RETRIEVED,
                   'sections': f'sección {sec}: «{s["title"]}» ({url})', 'textSource': b.get('url_text_source')},
        'rights': {'authorDeathYear': m['authorDeath'], 'translator': None, 'translatorDeathYear': None,
                   'basis': f'Texto: autora fallecida en {m["authorDeath"]} (dominio público en Colombia). Grabación: LibriVox, dedicada al dominio público.'},
        'sha256': None, 'sizeBytes': None, 'reviewNotes': m['reviewNotes'] + ' Modificaciones: ninguna (copia directa del archivo de 64 kbps). Contenido revisado mediante transcripción automática.',
        'text': None, 'timeline': m['timeline'], 'funFacts': m['funFacts'], 'questions': m['questions'],
    })

for bdat in BIOS2:
    paras = [f'Audiobiografía de {bdat["name"]}. Biblioteca Macondo.'] + bdat['body']
    paras.append('Datos curiosos. ' + ' '.join(bdat['funFacts']))
    paras.append('Preguntas para pensar. ' + ' '.join(x['prompt'] for x in bdat['questions']))
    paras.append('Fin de la audiobiografía. Biblioteca Macondo, Comfasucre.')
    out_rel = f'audiobiografias/macondo-{bdat["slug"]}.mp3'
    if tts: tts.synth(paras, os.path.join(CAT, out_rel), f'Audiobiografía: {bdat["name"]}', 'Biblioteca Macondo (Comfasucre)')
    nw = len(' '.join(paras).split())
    entries.append({
        'file': out_rel, 'cover': None, 'title': f'Audiobiografía: {bdat["name"]}', 'creator': 'Biblioteca Macondo – Comfasucre (texto original)',
        'type': 'AUDIOBIOGRAPHY', 'description': bdat['description'], 'gradeMin': bdat['gradeMin'], 'gradeMax': bdat['gradeMax'],
        'categories': bdat['categories'], 'language': 'es', 'narrator': 'Voz sintética Piper es_ES-carlfm-x_low', 'durationSeconds': None, 'status': 'PUBLISHED',
        'license': {'rightsHolder': 'Comfasucre – Biblioteca Macondo (contenido propio)',
                    'licenseName': 'Contenido propio; voz sintética Piper es_ES-carlfm-x_low (modelo MIT, dataset de dominio público)',
                    'licenseUrl': None, 'authorizedDevices': 30, 'offlineAllowed': True, 'validFrom': None, 'validUntil': None, 'territory': 'CO'},
        'source': {'provider': 'Macondo Digital (contenido propio)', 'id': bdat['slug'], 'url': None, 'retrievedAt': RETRIEVED},
        'rights': {'authorDeathYear': None, 'translator': None, 'translatorDeathYear': None,
                   'basis': 'Guion original escrito para el proyecto; hechos históricos de dominio común. Voz: Piper es_ES-carlfm-x_low.'},
        'sha256': None, 'sizeBytes': None,
        'reviewNotes': ((bdat['reviewNotes'] + ' ') if bdat.get('reviewNotes') else '') + TTS_NOTE + f'Guion de {nw} palabras narradas.',
        'text': '\n\n'.join(paras), 'timeline': bdat['timeline'], 'funFacts': bdat['funFacts'], 'questions': bdat['questions'],
    })

# ---------------------------------------------------------------- verificación
report, bad = [], 0
for e in entries:
    p = os.path.join(CAT, e['file'])
    head = open(p, 'rb').read(3)
    magic = head == b'ID3' or (head[0] == 0xFF and (head[1] & 0xE0) == 0xE0)
    pr = json.loads(subprocess.run(['ffprobe', '-v', 'error', '-print_format', 'json', '-show_format', '-show_streams', p], capture_output=True, check=True).stdout)
    st = [s for s in pr['streams'] if s['codec_type'] == 'audio'][0]
    dur = float(pr['format']['duration']); br = int(pr['format'].get('bit_rate', 0))
    dec_err = subprocess.run(['ffmpeg', '-v', 'error', '-i', p, '-f', 'null', '-'], capture_output=True).stderr.strip()
    h = hashlib.sha256(open(p, 'rb').read()).hexdigest(); size = os.path.getsize(p)
    ok = magic and st['codec_name'] == 'mp3' and dur > 30 and 56000 <= br <= 100000 and not dec_err
    bad += not ok
    e['durationSeconds'] = int(round(dur)); e['sha256'] = h; e['sizeBytes'] = size
    report.append({'file': e['file'], 'magic': magic, 'bit_rate': br, 'channels': st.get('channels'), 'duration': round(dur, 1), 'sha256': h, 'size': size, 'decode_errors': bool(dec_err), 'ok': ok})
json.dump(entries, open(os.path.join(CAT, 'audiobiografias-lote2.manifest.json'), 'w'), ensure_ascii=False, indent=2)
json.dump(report, open(os.path.join(ROOT, '_tmp', 'biores', 'verify-lote2.json'), 'w'), ensure_ascii=False, indent=1)
for r in report:
    print(('OK ' if r['ok'] else 'FALLA ') + f"{r['file']}  {r['duration']}s  {r['bit_rate']//1000}kbps  ch={r['channels']}  {r['size']}B  {r['sha256'][:12]}")
print(f'{len(report)} archivos, {bad} con fallas; total {sum(r["duration"] for r in report)/3600:.2f} h, {sum(r["size"] for r in report)/1e6:.1f} MB')
sys.exit(1 if bad else 0)
