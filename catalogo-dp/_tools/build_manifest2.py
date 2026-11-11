# Uso: python3 -I build_manifest2.py (desde catalogo-dp/) — genera libros-lote2.manifest.json
import json, sys, os, re
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from selection2_pg import SEL_PG
from selection2_ws import SEL_WS
src = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'build_manifest.py')).read()
ns = {'re': re}
_code = 'NAME = {' + src.split('NAME = {', 1)[1].split('out = []')[0]   # diccionario NAME y función fmt() del lote 1
exec(_code, ns)
fmt = ns['fmt']
cat = {r['id']: r for r in json.load(open('_tmp/es_all.json'))}
ver = json.load(open('_tmp/verify_lote2.json'))
exclude = set(open('_tmp/lote2_exclude.txt').read().split()) if os.path.exists('_tmp/lote2_exclude.txt') else set()
pglog = {}
for line in open('_tmp/download.log'):
    p = line.rstrip('\n').split('\t')
    if len(p) >= 3 and p[1] == 'OK': pglog[p[0]] = p[2]
wslog = {}
for line in open('_tmp/ws/export.log'):
    p = line.rstrip('\n').split('\t')
    if len(p) >= 3 and p[1] == 'OK': wslog[p[0]] = p[2]
LIC = {'rightsHolder': None, 'authorizedDevices': 30, 'offlineAllowed': True, 'validFrom': None, 'validUntil': None, 'territory': 'CO'}
out = []
for e in SEL_PG:
    f = f"gutenberg-{e['id']}.epub"
    if f in exclude: continue
    r = cat[e['id']]; v = ver[f]; assert v['ok'], f
    authors = [a for a in r['authors'] if a['role'] == 'Author' and a['name'] != 'Anonymous']
    trans = [a for a in r['authors'] if a['role'] == 'Translator']
    others = [a for a in r['authors'] if a['role'] not in ('Author', 'Translator') and a['name'] != 'Anonymous']
    creator = ', '.join(fmt(a['name']) for a in authors) if authors else 'Anónimo'
    ady = max([a['death'] for a in authors if a['death'] is not None], default=None)
    tname, tdy = (e['tr'] if e.get('tr') else ((', '.join(fmt(a['name']) for a in trans), max(a['death'] for a in trans)) if trans else (None, None)))
    bp = ['Autor(es) fallecido(s) en ' + ', '.join(f"{fmt(a['name'])} †{a['death']}" for a in authors)] if authors else ['Obra anónima']
    if tname: bp.append(f'traducción de {tname} (†{tdy})')
    if others: bp.append('colaboradores: ' + ', '.join(f"{fmt(a['name'])} ({a['role']}, †{a['death']})" for a in others if a['death']))
    basis = '; '.join(bp) + '. Todos ≤1945: dominio público en Colombia (Ley 23 de 1982, art. 21, vida + 80 años).'
    holder = f"Dominio público ({creator}" + (f", fallecido en {ady}" if ady else '') + ")"
    out.append({'file': f'libros/{f}', 'cover': None, 'title': re.sub(r'\s+', ' ', r['title']).strip()[:300], 'creator': creator[:200], 'type': 'BOOK',
        'description': e['d'], 'gradeMin': e['g'][0], 'gradeMax': e['g'][1], 'categories': e['c'], 'language': 'es',
        'narrator': None, 'durationSeconds': None, 'status': 'DRAFT',
        'license': dict(LIC, rightsHolder=holder if len(holder) <= 200 else 'Dominio público', licenseName='Dominio público en Colombia (Ley 23 de 1982)', licenseUrl=f"https://www.gutenberg.org/ebooks/{e['id']}"),
        'source': {'provider': 'Project Gutenberg', 'id': str(e['id']), 'url': f"https://www.gutenberg.org/ebooks/{e['id']}", 'retrievedAt': '2026-10-31'},
        'rights': {'authorDeathYear': ady, 'translator': tname, 'translatorDeathYear': tdy, 'basis': basis},
        'sha256': v['sha256'], 'sizeBytes': v['size'], 'reviewNotes': e.get('n')})
for e in SEL_WS:
    f = f"wikisource-{e['slug']}.epub"
    if f in exclude or f not in ver: continue
    v = ver[f]
    # Única excepción revisada a mano: aviso «Copyright by Editorial Proa 1927» en la 3.ª ed. de Don Segundo Sombra (autor †1927).
    assert v['ok'] or (f == 'wikisource-guiraldes-don-segundo-sombra.epub' and v['header_copyright'] and v['unzip_t'] and v['ws_license']), f
    lic = ' / '.join(dict.fromkeys(x.replace('Creative Commons ', 'CC ') for x in v['ws_license']))
    tname, tdy = e.get('tr', (None, None))
    page_url = 'https://es.wikisource.org/wiki/' + e['page'].replace(' ', '_')
    bp = [f"Autor: {e['author']} " + (f"†{e['death']}" if e['death'] else '(Antigüedad)')]
    if tname: bp.append(f'traducción de {tname} (†{tdy})')
    elif 'anónima' in (e.get('n') or ''): bp.append('traducción anónima antigua')
    basis = '; '.join(bp) + '. Todos ≤1945: texto en dominio público en Colombia (Ley 23 de 1982). La edición digital de Wikisource (formato, notas, créditos) está bajo ' + lic + '; se conserva su página de créditos.'
    rn = [e.get('n')] if e.get('n') else []
    if e.get('extra_n'): rn.append(e['extra_n'])
    holder = f"Dominio público ({e['author']}" + (f", fallecido en {e['death']}" if e['death'] else '') + "); edición digital: colaboradores de Wikisource"
    out.append({'file': f'libros/{f}', 'cover': None, 'title': e.get('title') or re.sub(r'\s*\([^)]*\)$', '', e['page']), 'creator': e['author'], 'type': 'BOOK',
        'description': e['d'], 'gradeMin': e['g'][0], 'gradeMax': e['g'][1], 'categories': e['c'], 'language': 'es',
        'narrator': None, 'durationSeconds': None, 'status': 'DRAFT',
        'license': dict(LIC, rightsHolder=holder[:200], licenseName=f'Texto en dominio público en Colombia; edición digital de Wikisource ({lic})', licenseUrl=page_url),
        'source': {'provider': 'Wikisource', 'id': e['page'], 'url': page_url, 'retrievedAt': '2026-10-31'},
        'rights': {'authorDeathYear': e['death'], 'translator': tname, 'translatorDeathYear': tdy, 'basis': basis},
        'sha256': v['sha256'], 'sizeBytes': v['size'], 'reviewNotes': ' '.join(rn) if rn else None})
json.dump(out, open('libros-lote2.manifest.json', 'w'), ensure_ascii=False, indent=2)
print('entradas', len(out), 'PG', sum(1 for x in out if x['source']['provider']=='Project Gutenberg'), 'WS', sum(1 for x in out if x['source']['provider']=='Wikisource'))
