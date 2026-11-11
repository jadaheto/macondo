# Cliente cortés para la API de es.wikisource.org: secuencial, pausa de 3 s, reintentos ante 429/5xx.
# Uso como módulo: from ws_api import api ; o CLI: python3 -I ws_api.py authorlinks "Autor:Rafael Pombo" ...
import json, sys, time, urllib.request, urllib.parse, os
UA = "MacondoDigitalBot/1.0 (https://www.comfasucre.com.co; school library catalog builder; sequential low-volume)"
_last = [0.0]
def fetch(url, binary=False, tries=6):
    for i in range(tries):
        wait = 3 - (time.time() - _last[0])
        if wait > 0: time.sleep(wait)
        _last[0] = time.time()
        try:
            req = urllib.request.Request(url, headers={'User-Agent': UA})
            with urllib.request.urlopen(req, timeout=180) as r:
                data = r.read()
                return data if binary else data.decode('utf-8')
        except urllib.error.HTTPError as e:
            if e.code in (429, 500, 502, 503, 504): time.sleep(15 * (i + 1)); continue
            raise
        except Exception:
            time.sleep(10 * (i + 1))
    raise RuntimeError('fallo tras reintentos: ' + url)
def api(**p):
    p.update(format='json', formatversion='2', maxlag='5')
    return json.loads(fetch('https://es.wikisource.org/w/api.php?' + urllib.parse.urlencode(p)))
if __name__ == '__main__':
    if sys.argv[1] == 'authorlinks':
        out = {}
        for a in sys.argv[2:]:
            d = api(action='parse', page=a, prop='links|wikitext')
            if 'error' in d: out[a] = {'error': d['error']['info']}; continue
            out[a] = {'links': [l['title'] for l in d['parse']['links'] if l['ns'] == 0 and l.get('exists', True)],
                      'wikitext': d['parse']['wikitext']}
            print(a, len(out[a]['links']), file=sys.stderr)
        json.dump(out, open(os.environ.get('OUT', '/dev/stdout'), 'w'), ensure_ascii=False)
