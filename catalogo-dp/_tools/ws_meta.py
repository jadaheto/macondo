# Uso: python3 -I ws_meta.py <lista_titulos> <salida.json>
# Obtiene para cada página: wikitext de cabecera, tamaño, y subpáginas (número y tamaño total).
import json, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ws_api import api
titles = [t.strip() for t in open(sys.argv[1]) if t.strip()]
out = {}
if os.path.exists(sys.argv[2]): out = json.load(open(sys.argv[2]))
for t in dict.fromkeys(titles):
    if t in out: continue
    d = api(action='query', titles=t, prop='revisions|info', rvprop='content', rvslots='main', redirects='1')
    p = d['query']['pages'][0]
    if p.get('missing'): out[t] = {'missing': True}; continue
    wt = p['revisions'][0]['slots']['main']['content']
    real = p['title']
    sub = api(action='query', generator='allpages', gapprefix=real + '/', gapnamespace='0', gaplimit='max', prop='info')
    subs = [(x['title'], x['length']) for x in sub.get('query', {}).get('pages', [])]
    out[t] = {'title': real, 'length': p['length'], 'wikitext': wt[:6000], 'nsub': len(subs), 'subsize': sum(s for _, s in subs)}
    json.dump(out, open(sys.argv[2], 'w'), ensure_ascii=False)
    print(t, p['length'], len(subs), file=sys.stderr)
