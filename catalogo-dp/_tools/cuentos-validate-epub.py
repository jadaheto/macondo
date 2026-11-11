"""Validación estructural de los EPUB de cuentos (sin epubcheck): magia ZIP, mimetype primero y sin comprimir,
container.xml, XML bien formado (OPF, XHTML, SVG, NCX), manifiesto OPF vs. archivos, metadatos obligatorios, tamaño < 1 MB.
Uso: python3 -I cuentos-validate-epub.py <dir-con-epub>"""
import glob, os, sys, zipfile, xml.dom.minidom as md
from xml.etree import ElementTree as ET
NS = {'opf': 'http://www.idpf.org/2007/opf', 'dc': 'http://purl.org/dc/elements/1.1/'}
bad = 0
files = sorted(glob.glob(os.path.join(sys.argv[1], '*.epub')))
for f in files:
    errs = []
    raw = open(f, 'rb').read(64)
    if raw[:4] != b'PK\x03\x04': errs.append('magia ZIP')
    if raw[30:38] != b'mimetype' or raw[38:58] != b'application/epub+zip': errs.append('mimetype no es la primera entrada literal')
    z = zipfile.ZipFile(f)
    if z.testzip() is not None: errs.append('CRC')
    info = z.infolist()
    if info[0].filename != 'mimetype' or info[0].compress_type != zipfile.ZIP_STORED: errs.append('mimetype comprimido o no primero')
    names = set(z.namelist())
    for n in names:
        if n.endswith(('.xml', '.opf', '.xhtml', '.svg', '.ncx')):
            try: md.parseString(z.read(n))
            except Exception as e: errs.append(f'XML {n}: {e}')
    c = ET.fromstring(z.read('META-INF/container.xml'))
    opf_path = c.find('.//{urn:oasis:names:tc:opendocument:xmlns:container}rootfile').get('full-path')
    opf = ET.fromstring(z.read(opf_path)); base = os.path.dirname(opf_path)
    for tag in ('identifier', 'title', 'language', 'creator', 'rights'):
        if opf.find(f'.//dc:{tag}', NS) is None: errs.append(f'falta dc:{tag}')
    if opf.find('.//dc:language', NS).text != 'es': errs.append('idioma')
    if not any(m.get('property') == 'dcterms:modified' for m in opf.iter('{%s}meta' % NS['opf'])): errs.append('falta dcterms:modified')
    items = {i.get('id'): i for i in opf.iter('{%s}item' % NS['opf'])}
    hrefs = {base + '/' + i.get('href') for i in items.values()}
    for h in hrefs:
        if h not in names: errs.append(f'falta {h}')
    extra = names - hrefs - {'mimetype', 'META-INF/container.xml', opf_path}
    if extra: errs.append(f'no declarados: {extra}')
    if not any('nav' in (i.get('properties') or '') for i in items.values()): errs.append('sin nav')
    if not any('cover-image' in (i.get('properties') or '') for i in items.values()): errs.append('sin cover-image')
    for r in opf.iter('{%s}itemref' % NS['opf']):
        if r.get('idref') not in items: errs.append('spine idref')
    size = os.path.getsize(f)
    if size >= 1024 * 1024: errs.append('>= 1 MB')
    print(('OK  ' if not errs else 'FAIL') + f' {os.path.basename(f)} {size} B ' + '; '.join(errs))
    bad += bool(errs)
print(f'total {len(files)}, con errores {bad}')
sys.exit(1 if bad else 0)
