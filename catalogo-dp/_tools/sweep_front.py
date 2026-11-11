# Uso: python3 -I sweep_front.py <epub>...  Busca en las primeras ~25k letras del texto menciones de
# prologuistas, traductores, editores, anotadores o ilustradores para revisión manual de derechos.
import zipfile, re, sys, html, posixpath
PAT = re.compile(r'(pr[oó]logo|introducci[oó]n|estudio (preliminar|cr[ií]tico)|notas?|tradu\w+|versi[oó]n|ilustra\w+|dibujos|edici[oó]n|anotad\w+|pr[oó]logo|selecci[oó]n|arreglad\w+|corregid\w+)\s+(de|por|del)\s+[^\n]{0,70}', re.I)
for p in sys.argv[1:]:
    z = zipfile.ZipFile(p)
    opf = [n for n in z.namelist() if n.endswith('.opf')][0]; base = posixpath.dirname(opf)
    o = z.read(opf).decode('utf-8', 'replace')
    hrefs = {}
    for m in re.finditer(r'<item\b[^>]*>', o):
        t = m.group(0); i = re.search(r'id="([^"]+)"', t); h = re.search(r'href="([^"]+)"', t)
        if i and h: hrefs[i.group(1)] = h.group(1)
    text = ''
    for m in re.finditer(r'<itemref\b[^>]*idref="([^"]+)"', o):
        h = hrefs.get(m.group(1))
        if not h or not re.search(r'\.x?html?$', h): continue
        t = z.read(posixpath.normpath(posixpath.join(base, h))).decode('utf-8', 'replace')
        text += html.unescape(re.sub(r'<[^>]+>', ' ', t)) + '\n'
        if len(text) > 60000: break
    text = re.sub(r'[ \t\r]+', ' ', text)
    i = text.find('*** START'); body = text[i:i+25000] if i >= 0 else text[:25000]
    hits = []
    for m in PAT.finditer(body):
        s = m.group(0).strip().replace('\n', ' ')
        if s not in hits: hits.append(s)
    print('==', p.split('/')[-1], '|', ' || '.join(hits[:8])[:600])
