# Uso: python3 -I ws_front.py <epub>...  Muestra portada (title.xhtml), licencia (about.xhtml), primer capítulo y menciones de traductor/prólogo/notas.
import zipfile, re, sys, html
PAT = re.compile(r'(pr[oó]logo|introducci[oó]n|estudio|notas?|tradu\w+|versi[oó]n|ilustra\w+|edici[oó]n|anotad\w+|selecci[oó]n)\s+(de|por|del)\s+[^\n]{0,60}', re.I)
def txt(z, n): return re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', ' ', z.read(n).decode('utf-8', 'replace'))))
for p in sys.argv[1:]:
    z = zipfile.ZipFile(p); names = z.namelist()
    t = txt(z, 'OPS/title.xhtml') if 'OPS/title.xhtml' in names else ''
    a = txt(z, 'OPS/about.xhtml') if 'OPS/about.xhtml' in names else ''
    lic = re.findall(r'(Creative Commons [^\[,.]*|GNU FDL|dominio público[^.]*)', a)
    chaps = [n for n in names if re.match(r'OPS/c\d+_', n)]
    body = ' '.join(txt(z, n) for n in chaps[:3])[:12000]
    hits = list(dict.fromkeys(m.group(0) for m in PAT.finditer(body)))[:6]
    imgs = [n for n in names if re.search(r'\.(png|jpe?g|gif|svg)', n)]
    print('==', p.split('/')[-1], '| portada:', t[:160], '| lic:', lic[:3], '| caps:', len(chaps), '| imgs:', imgs, '| inicio:', body[:220], '| menciones:', hits)
