"""Construye los cuentos originales de Biblioteca Macondo: ilustraciones SVG, portadas PNG (Chromium/Playwright),
EPUB 3 y manifiesto catalogo-dp/cuentos.manifest.json.

Uso: python3 -I catalogo-dp/_tools/cuentos-build.py
Datos: catalogo-dp/_tools/cuentos-data/*.json (g1, g2, g3a, g3b). Dibujos: cuentos-svg.py. Portadas: cuentos-covers.js.
"""
import base64, hashlib, html, importlib.util, json, os, re, subprocess, sys, tempfile, uuid, zipfile

HERE = os.path.dirname(os.path.abspath(__file__))
CAT = os.path.dirname(HERE)
REPO = os.path.dirname(CAT)
OUT = os.path.join(CAT, 'cuentos')
COVERS = os.path.join(OUT, 'portadas')
FONT = os.path.join(REPO, 'apps/web/public/brand/fonts/web/outfit-latin-20261003.woff2')
TODAY = '2026-10-31'
MODIFIED = '2026-10-31T00:00:00Z'
CREATOR = 'Biblioteca Macondo – Comfasucre (cuento original)'
RIGHTS = 'Contenido original de Comfasucre – Biblioteca Macondo'
REVIEW = 'Cuento original redactado con asistencia de IA; requiere revisión pedagógica y de estilo antes de publicar.'
WORDS = {1: (120, 250), 2: (250, 450), 3: (450, 800)}
ACCENT = {1: '#4e7a1f', 2: '#127f8b', 3: '#205b88'}
ZDATE = (2026, 10, 31, 0, 0, 0)

spec = importlib.util.spec_from_file_location('cs', os.path.join(HERE, 'cuentos-svg.py'))
cs = importlib.util.module_from_spec(spec); spec.loader.exec_module(cs)
E = html.escape


def load():
    stories = []
    for f in ('g1.json', 'g2.json', 'g3a.json', 'g3b.json'):
        p = os.path.join(HERE, 'cuentos-data', f)
        if os.path.exists(p):
            stories += json.load(open(p, encoding='utf-8'))
    errs = []
    slugs, titles = set(), set()
    for s in stories:
        sl = s['slug']
        if not re.fullmatch(r'[a-z0-9]+(-[a-z0-9]+)*', sl): errs.append(f'{sl}: slug inválido')
        if sl in slugs or s['title'] in titles: errs.append(f'{sl}: slug/título duplicado')
        slugs.add(sl); titles.add(s['title'])
        n = sum(len(t.split()) for pg in s['pages'] for t in pg['text'])
        s['_words'] = n
        lo, hi = WORDS[s['grade']]
        if not lo <= n <= hi: errs.append(f'{sl}: {n} palabras fuera de {lo}-{hi}')
        if not 2 <= len(s['pages']) <= 4: errs.append(f'{sl}: {len(s["pages"])} páginas')
        if len(s['questions']) != 3: errs.append(f'{sl}: preguntas != 3')
        for q in s['questions']:
            if len(q['options']) != 3 or not 0 <= q['answer'] < 3: errs.append(f'{sl}: pregunta mal formada')
        if s['grade'] >= 2 and len(s.get('glossary', [])) < 3: errs.append(f'{sl}: glosario corto')
        if not s['gradeMin'] <= s['grade'] <= s['gradeMax']: errs.append(f'{sl}: banda de grado')
    if errs:
        sys.exit('ERRORES:\n' + '\n'.join(errs))
    return stories


# ------------------------------------------------------------------ portada
FONT_B64 = base64.b64encode(open(FONT, 'rb').read()).decode()


def cover_html(s):
    t = s['title']
    n = len(t)
    size = 62 if n <= 16 else 54 if n <= 24 else 48 if n <= 32 else 42
    svg = cs.render_scene(s['coverScene'], 532, 399, s['title'])
    acc = ACCENT[s['grade']]
    return f'''<!doctype html><html lang="es"><head><meta charset="utf-8"><style>
@font-face{{font-family:Outfit;src:url(data:font/woff2;base64,{FONT_B64}) format("woff2");font-weight:100 900}}
*{{box-sizing:border-box;margin:0;padding:0}}
html,body{{width:600px;height:900px;overflow:hidden}}
body{{font-family:Outfit,sans-serif;background:linear-gradient(160deg,#17365d 0%,#205b88 55%,#1595a3 100%)}}
.card{{position:absolute;inset:18px;border-radius:24px;background:#fff8ec;display:flex;flex-direction:column;align-items:center;padding:20px 16px 0}}
.pill{{background:{acc};color:#fff;font-weight:700;font-size:21px;letter-spacing:.3px;padding:7px 20px;border-radius:999px}}
.ill{{margin-top:16px;width:532px;height:399px;border-radius:20px;overflow:hidden;box-shadow:0 6px 18px rgba(23,54,93,.25);border:4px solid #fff}}
.ill svg{{display:block;width:100%;height:100%}}
.title{{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:10px 18px;color:#17365d;font-weight:800;font-size:{size}px;line-height:1.08;letter-spacing:-.5px}}
.tag{{display:block;margin-top:14px;font-size:20px;font-weight:500;letter-spacing:.2px;color:#127f8b}}
.foot{{width:calc(100% + 32px);border-radius:0 0 24px 24px;background:#17365d;color:#fff;display:flex;align-items:center;justify-content:center;gap:12px;height:74px}}
.dot{{width:16px;height:16px;border-radius:50%;background:#76a82b;box-shadow:22px 0 0 #1595a3}}
.brand{{font-weight:700;font-size:27px;margin-left:24px}}
.sub{{font-weight:400;font-size:16px;opacity:.85;border-left:1px solid rgba(255,255,255,.5);padding-left:12px}}
</style></head><body><div class="card"><div class="pill">Cuento · Grado {s["grade"]}</div>
<div class="ill">{svg}</div><div class="title"><span>{E(t)}</span><span class="tag">Cuento original · Caribe colombiano</span></div>
<div class="foot"><span class="dot"></span><span class="brand">Biblioteca Macondo</span><span class="sub">Comfasucre</span></div></div></body></html>'''


# ------------------------------------------------------------------ EPUB
CSS = '''body{font-family:"Outfit","Trebuchet MS",Verdana,sans-serif;margin:0 4%;color:#24364b;background:#fffdf8}
h1{font-size:1.9em;line-height:1.2;color:#17365d;text-align:center;margin:.6em 0 .4em}
h2{font-size:1.5em;color:#17365d;margin:1em 0 .5em}
p{font-size:1.4em;line-height:1.6;margin:0 0 .7em}
.g1 p{font-size:1.6em;line-height:1.7}
figure{margin:0 0 1em;text-align:center}
figure img{width:100%;max-width:800px;height:auto;border-radius:12px}
.cover{margin:0;padding:0;text-align:center}
.cover img{max-width:100%;max-height:100%}
ol.q li,ul.g li{font-size:1.3em;line-height:1.6;margin-bottom:.8em}
ol.q ul{list-style:lower-alpha;margin-top:.3em}
ol.q ul li{font-size:.9em;margin-bottom:.2em}
.small{font-size:1em;color:#587086}
'''


def xhtml(title, body, cls=''):
    return (f'<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE html>\n<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="es" lang="es">\n'
            f'<head><meta charset="UTF-8"/><title>{E(title)}</title><link rel="stylesheet" type="text/css" href="css/estilo.css"/></head>\n'
            f'<body{f" class={chr(34)}{cls}{chr(34)}" if cls else ""}>\n{body}\n</body>\n</html>\n')


def build_epub(s, cover_png, path):
    slug, title, grade = s['slug'], s['title'], s['grade']
    uid = 'urn:uuid:' + str(uuid.uuid5(uuid.NAMESPACE_URL, 'https://macondo.comfasucre/cuentos/' + slug))
    cls = 'g1' if grade == 1 else ''
    files = {}
    files['OEBPS/css/estilo.css'] = CSS
    files['OEBPS/img/portada.png'] = open(cover_png, 'rb').read()
    files['OEBPS/portada.xhtml'] = xhtml(title, f'<section epub:type="cover" class="cover"><img src="img/portada.png" alt="Portada: {E(title)}"/></section>')
    pages = []
    for i, pg in enumerate(s['pages'], 1):
        files[f'OEBPS/img/ilustracion-{i}.svg'] = '<?xml version="1.0" encoding="UTF-8"?>\n' + cs.render_scene(pg['scene'], 800, 600, pg.get('alt'))
        head = f'<h1>{E(title)}</h1>\n' if i == 1 else ''
        paras = '\n'.join(f'<p>{E(t)}</p>' for t in pg['text'])
        files[f'OEBPS/pagina-{i}.xhtml'] = xhtml(title, f'<section epub:type="bodymatter chapter">\n{head}<figure><img src="img/ilustracion-{i}.svg" alt="{E(pg.get("alt", ""))}"/></figure>\n{paras}\n</section>', cls)
        pages.append(f'pagina-{i}.xhtml')
    qs = '\n'.join(f'<li>{E(q["prompt"])}<ul>' + ''.join(f'<li>{E(o)}</li>' for o in q['options']) + '</ul></li>' for q in s['questions'])
    gl = ''
    if s.get('glossary'):
        gl = '<h2>Palabras nuevas</h2>\n<ul class="g">' + ''.join(f'<li><b>{E(w["word"])}</b>: {E(w["meaning"])}</li>' for w in s['glossary']) + '</ul>'
    files['OEBPS/actividades.xhtml'] = xhtml(title, f'<section epub:type="backmatter">\n<h2>Para conversar</h2>\n<ol class="q">{qs}</ol>\n{gl}\n</section>', cls)
    cred = (f'<section epub:type="colophon">\n<h2>Créditos</h2>\n<p class="small"><b>{E(title)}</b></p>\n'
            f'<p class="small">Texto e ilustraciones: {E(CREATOR)}.</p>\n<p class="small">{E(RIGHTS)}. Todos los derechos reservados. Comfasucre, Sucre (Colombia), {TODAY[:4]}.</p>\n'
            f'<p class="small">Ilustraciones vectoriales originales hechas para esta colección. Texto redactado con asistencia de inteligencia artificial y sujeto a revisión pedagógica.</p>\n</section>')
    files['OEBPS/creditos.xhtml'] = xhtml(title, cred)
    spine = ['portada.xhtml'] + pages + ['actividades.xhtml', 'creditos.xhtml']
    nav_items = [('pagina-1.xhtml', title), ('actividades.xhtml', 'Para conversar' + (' y palabras nuevas' if gl else '')), ('creditos.xhtml', 'Créditos')]
    files['OEBPS/nav.xhtml'] = xhtml(title, '<nav epub:type="toc" id="toc"><h2>Contenido</h2><ol>' + ''.join(f'<li><a href="{h}">{E(t)}</a></li>' for h, t in nav_items) + '</ol></nav>\n'
                                     '<nav epub:type="landmarks" hidden=""><ol><li><a epub:type="cover" href="portada.xhtml">Portada</a></li><li><a epub:type="bodymatter" href="pagina-1.xhtml">Cuento</a></li></ol></nav>')
    files['OEBPS/toc.ncx'] = ('<?xml version="1.0" encoding="UTF-8"?>\n<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1"><head>'
                              f'<meta name="dtb:uid" content="{uid}"/></head><docTitle><text>{E(title)}</text></docTitle><navMap>'
                              + ''.join(f'<navPoint id="np{i}" playOrder="{i}"><navLabel><text>{E(t)}</text></navLabel><content src="{h}"/></navPoint>' for i, (h, t) in enumerate(nav_items, 1))
                              + '</navMap></ncx>\n')
    man = ['<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>',
           '<item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>',
           '<item id="css" href="css/estilo.css" media-type="text/css"/>',
           '<item id="cover-img" href="img/portada.png" media-type="image/png" properties="cover-image"/>']
    for h in spine:
        man.append(f'<item id="{h.split(".")[0]}" href="{h}" media-type="application/xhtml+xml"/>')
    for i in range(1, len(pages) + 1):
        man.append(f'<item id="ilu{i}" href="img/ilustracion-{i}.svg" media-type="image/svg+xml"/>')
    desc = E(s['synopsis'])
    subjects = ''.join(f'<dc:subject>{E(c)}</dc:subject>' for c in s['categories'])
    opf = (f'<?xml version="1.0" encoding="UTF-8"?>\n<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="uid" xml:lang="es">\n'
           f'<metadata xmlns:dc="http://purl.org/dc/elements/1.1/">\n<dc:identifier id="uid">{uid}</dc:identifier>\n<dc:title>{E(title)}</dc:title>\n'
           f'<dc:language>es</dc:language>\n<dc:creator id="cre">{E(CREATOR)}</dc:creator>\n<dc:publisher>Comfasucre – Biblioteca Macondo</dc:publisher>\n'
           f'<dc:rights>{E(RIGHTS)}</dc:rights>\n<dc:description>{desc}</dc:description>\n{subjects}\n<dc:date>{TODAY}</dc:date>\n'
           f'<meta property="dcterms:modified">{MODIFIED}</meta>\n<meta name="cover" content="cover-img"/>\n</metadata>\n'
           f'<manifest>\n' + '\n'.join(man) + '\n</manifest>\n<spine toc="ncx">\n'
           + '\n'.join(f'<itemref idref="{h.split(".")[0]}"' + (' linear="yes"' if True else '') + '/>' for h in spine) + '\n</spine>\n</package>\n')
    files['OEBPS/content.opf'] = opf
    container = ('<?xml version="1.0" encoding="UTF-8"?>\n<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">'
                 '<rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>\n')
    with zipfile.ZipFile(path, 'w') as z:
        z.writestr(zipfile.ZipInfo('mimetype', ZDATE), 'application/epub+zip', compress_type=zipfile.ZIP_STORED)
        for name, data in [('META-INF/container.xml', container)] + sorted(files.items()):
            zi = zipfile.ZipInfo(name, ZDATE); zi.compress_type = zipfile.ZIP_DEFLATED
            z.writestr(zi, data if isinstance(data, bytes) else data.encode('utf-8'))


def sha(p):
    return hashlib.sha256(open(p, 'rb').read()).hexdigest()


def main():
    stories = load()
    os.makedirs(COVERS, exist_ok=True)
    tmp = tempfile.mkdtemp(prefix='cuentos-')
    jobs = []
    for s in stories:
        h = os.path.join(tmp, s['slug'] + '.html')
        open(h, 'w', encoding='utf-8').write(cover_html(s))
        jobs.append([h, os.path.join(COVERS, s['slug'] + '.png')])
    jl = os.path.join(tmp, 'jobs.json'); json.dump(jobs, open(jl, 'w'))
    subprocess.run(['node', os.path.join(HERE, 'cuentos-covers.js'), jl], check=True)
    manifest = []
    for s in stories:
        png = os.path.join(COVERS, s['slug'] + '.png')
        ep = os.path.join(OUT, s['slug'] + '.epub')
        build_epub(s, png, ep)
        text = s['title'] + '\n\n' + '\n\n'.join(t for pg in s['pages'] for t in pg['text'])
        manifest.append({
            'file': f'cuentos/{s["slug"]}.epub', 'cover': f'cuentos/portadas/{s["slug"]}.png',
            'title': s['title'], 'creator': CREATOR, 'type': 'BOOK', 'description': s['synopsis'],
            'gradeMin': s['gradeMin'], 'gradeMax': s['gradeMax'], 'categories': s['categories'], 'language': 'es',
            'narrator': None, 'durationSeconds': None, 'status': 'DRAFT',
            'license': {'rightsHolder': 'Comfasucre – Biblioteca Macondo', 'licenseName': 'Contenido original de Comfasucre (todos los derechos reservados)',
                        'licenseUrl': None, 'authorizedDevices': 30, 'offlineAllowed': True, 'validFrom': None, 'validUntil': None, 'territory': 'CO'},
            'source': {'provider': 'Biblioteca Macondo – Comfasucre (cuento original)', 'id': s['slug'], 'url': None, 'retrievedAt': TODAY},
            'rights': {'authorDeathYear': None, 'translator': None, 'translatorDeathYear': None,
                       'basis': 'Obra original creada para Biblioteca Macondo (texto con asistencia de IA e ilustraciones vectoriales propias); titular: Comfasucre.'},
            'sha256': sha(ep), 'sizeBytes': os.path.getsize(ep),
            'reviewNotes': REVIEW,
            'theme': s['theme'], 'grade': s['grade'], 'wordCount': s['_words'],
            'text': text, 'questions': s['questions'], 'glossary': s.get('glossary', []),
        })
    json.dump(manifest, open(os.path.join(CAT, 'cuentos.manifest.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
    print('cuentos:', len(manifest))


if __name__ == '__main__':
    main()
