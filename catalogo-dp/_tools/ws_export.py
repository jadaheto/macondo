# Uso: python3 -I ws_export.py <lista.tsv: slug<TAB>título_página>
# Descarga secuencial (pausa 3 s) desde WS Export (epub-3, sin imágenes) a libros/wikisource-<slug>.epub
import sys, os, time, urllib.parse, zipfile, io
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ws_api import fetch
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
log = open('_tmp/ws/export.log', 'a')
for line in open(sys.argv[1]):
    if not line.strip(): continue
    slug, page = line.rstrip('\n').split('\t')
    out = f'libros/wikisource-{slug}.epub'
    if os.path.exists(out): continue
    url = 'https://ws-export.wmcloud.org/?' + urllib.parse.urlencode({'lang': 'es', 'format': 'epub-3', 'page': page, 'images': 'false'})
    try:
        b = fetch(url, binary=True)
        zipfile.ZipFile(io.BytesIO(b)).testzip()
        if len(b) > 8 * 1024 * 1024: raise RuntimeError('demasiado grande')
        open(out, 'wb').write(b); log.write(f'{slug}\tOK\t{url}\n')
    except Exception as e:
        log.write(f'{slug}\tFAIL\t{url}\t{e}\n')
    log.flush(); print(slug, file=sys.stderr)
