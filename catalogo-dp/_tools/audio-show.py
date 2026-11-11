# Muestra secciones de un libro LibriVox descargado (metadatos extendidos).
import json, sys, os
base = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '_tmp', 'audio', 'api')
for id in sys.argv[1:]:
    b = json.load(open(os.path.join(base, f'b{id}.json')))['books'][0]
    print(f"=== {id} {b['title']} | {[ (a['first_name']+' '+a['last_name'],a['dod']) for a in b['authors']]} | src={b.get('url_text_source')} | {b['url_librivox']}")
    for s in b['sections']:
        rd = ', '.join(r['display_name'] for r in s['readers'])
        au = s.get('author')
        print(f"  {s['section_number']:>3} {int(s['playtime'] or 0):>6}s {s['title'][:70]} | {rd} | {(s['listen_url'] or 'NONE').rsplit('/',1)[-1]}")
