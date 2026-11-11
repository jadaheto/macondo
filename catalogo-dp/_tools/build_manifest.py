# Uso: python3 -I build_manifest.py  (desde catalogo-dp/)
# Genera libros.manifest.json a partir de selection.py, el catálogo filtrado y la verificación.
import json, sys, os, re
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from selection import SEL
cat = json.load(open('_tmp/sel_catalog.json'))
ver = json.load(open('_tmp/verify.json'))
log = {}
for line in open('_tmp/download.log'):
    p = line.rstrip('\n').split('\t')
    if len(p) >= 3 and p[1] == 'OK': log[p[0]] = p[2]
final_ids = [int(x) for x in open('_tmp/final_ids.txt').read().split()]
NAME = {
 'Homer':'Homero','Virgil':'Virgilio','Euripides':'Eurípides','Herodotus':'Heródoto','Thucydides':'Tucídides',
 'Juan Manuel, Infante of Castile':'Don Juan Manuel','Juana Inés de la Cruz, Sister':'Sor Juana Inés de la Cruz',
 'Alas, Leopoldo':'Leopoldo Alas «Clarín»','Pardo Bazán, Emilia, condesa de':'Emilia Pardo Bazán',
 'Rivas, Angel de Saavedra, duque de':'Duque de Rivas','Byron, George Gordon Byron, Baron':'Lord Byron',
 'Fénelon, François de Salignac de La Mothe-':'Fénelon','Caballero, Fernán':'Fernán Caballero',
 'Dante Alighieri':'Dante Alighieri','Voltaire':'Voltaire','Ruiz, Juan':'Juan Ruiz, Arcipreste de Hita',
 'Leonardo, da Vinci':'Leonardo da Vinci','Shakespeare, William':'William Shakespeare',
 'Álvarez, José S. (José Sixto)':'José S. Álvarez («Fray Mocho»)','Alvarez, José S. (José Sixto)':'José S. Álvarez («Fray Mocho»)',
 'Rojas, Fernando de':'Fernando de Rojas','Valle-Inclán, Ramón del':'Ramón del Valle-Inclán',
 'Hope, Anthony':'Anthony Hope','Eliot, George':'George Eliot','Queirós, Eça de':'Eça de Queirós',
 'Sue, Eugène':'Eugène Sue','Halévy, Ludovic':'Ludovic Halévy','Laval, Ramón A. (Ramón Arminio)':'Ramón A. Laval',
}
def fmt(n):
    if n in NAME: return NAME[n]
    n2 = re.sub(r'\s*\([^)]*\)', '', n).strip()
    if n2 in NAME: return NAME[n2]
    parts = [x.strip() for x in n2.split(',')]
    if len(parts) >= 2: return f"{parts[1]} {parts[0]}".strip()
    return n2
out = []
for e in SEL:
    if e['id'] not in final_ids: continue
    r = cat[str(e['id'])]; f = f"gutenberg-{e['id']}.epub"; v = ver[f]
    assert v['ok'], f
    authors = [a for a in r['authors'] if a['role'] == 'Author' and a['name'] != 'Anonymous']
    trans = [a for a in r['authors'] if a['role'] == 'Translator']
    others = [a for a in r['authors'] if a['role'] not in ('Author', 'Translator') and a['name'] != 'Anonymous']
    if e.get('creator'): creator = e['creator']
    elif authors: creator = ', '.join(fmt(a['name']) for a in authors)
    elif others and any(a['role'] in ('Compiler', 'Editor') for a in others):
        creator = 'Selección de ' + ', '.join(fmt(a['name']) for a in others if a['role'] in ('Compiler', 'Editor'))
    else: creator = 'Anónimo'
    if len(creator) > 200: creator = creator[:197] + '...'
    ady = max([a['death'] for a in authors if a['death'] is not None], default=None)
    if e.get('tr'): tname, tdy = e['tr']
    elif trans: tname = ', '.join(fmt(a['name']) for a in trans); tdy = max(a['death'] for a in trans)
    else: tname, tdy = None, None
    notes = e.get('n')
    anon_tr = bool(notes and re.search(r'[Tt]raducción (castellana )?anónima', notes))
    basis_parts = []
    if authors: basis_parts.append('Autor(es) fallecido(s) en ' + ', '.join(f"{fmt(a['name'])} †{a['death']}" for a in authors))
    else: basis_parts.append('Obra anónima o tradicional')
    if tname: basis_parts.append(f'traducción de {tname} (†{tdy})')
    elif anon_tr: basis_parts.append('traducción sin traductor identificable publicada antes de 1946 (ver reviewNotes)')
    if others:
        basis_parts.append('colaboradores: ' + ', '.join(f"{fmt(a['name'])} ({a['role']}, †{a['death']})" for a in others if a['death']))
    basis = '; '.join(basis_parts) + '. Todos ≤1945: dominio público en Colombia (Ley 23 de 1982, art. 21, vida + 80 años).'
    url = log.get(str(e['id']), '')
    rn = []
    if notes: rn.append(notes)
    if url and not url.endswith('.noimages'): rn.append('Contiene ilustraciones de la edición original.')
    if e.get('strip_cover'): rn.append('EPUB modificado por Macondo: solo se retiró la portada escaneada; texto y licencia Project Gutenberg intactos.')
    holder = f"Dominio público ({creator}" + (f", fallecido en {ady}" if ady else '') + ")"
    if len(holder) > 200: holder = 'Dominio público'
    title = re.sub(r'\s+', ' ', r['title']).strip()
    out.append({
        'file': f'libros/{f}', 'cover': None, 'title': title[:300], 'creator': creator, 'type': 'BOOK',
        'description': e['d'], 'gradeMin': e['g'][0], 'gradeMax': e['g'][1], 'categories': e['c'],
        'language': 'es', 'narrator': None, 'durationSeconds': None, 'status': 'DRAFT',
        'license': {'rightsHolder': holder, 'licenseName': 'Dominio público en Colombia (Ley 23 de 1982)',
                    'licenseUrl': f"https://www.gutenberg.org/ebooks/{e['id']}", 'authorizedDevices': 30,
                    'offlineAllowed': True, 'validFrom': None, 'validUntil': None, 'territory': 'CO'},
        'source': {'provider': 'Project Gutenberg', 'id': str(e['id']), 'url': f"https://www.gutenberg.org/ebooks/{e['id']}",
                   'retrievedAt': '2026-10-31'},
        'rights': {'authorDeathYear': ady, 'translator': tname, 'translatorDeathYear': tdy, 'basis': basis},
        'sha256': v['sha256'], 'sizeBytes': v['size'],
        'reviewNotes': ' '.join(rn) if rn else None,
    })
json.dump(out, open('libros.manifest.json', 'w'), ensure_ascii=False, indent=2)
print('entradas', len(out))
