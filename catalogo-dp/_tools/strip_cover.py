# Uso: python3 -I strip_cover.py <epub_entrada> <epub_salida>
# Retira la imagen de portada escaneada (y su página envoltorio) de un EPUB de Project Gutenberg,
# conservando todo el texto y la licencia PG. Escribe 'mimetype' primero y sin compresión.
import zipfile, re, sys, posixpath
src, dst = sys.argv[1], sys.argv[2]
zin = zipfile.ZipFile(src)
names = zin.namelist()
opf = [n for n in names if n.endswith('.opf')][0]
base = posixpath.dirname(opf)
o = zin.read(opf).decode('utf-8')
items = {}
for m in re.finditer(r'<item\b[^>]*/?>', o):
    tag = m.group(0)
    iid = re.search(r'\bid="([^"]+)"', tag).group(1)
    href = re.search(r'\bhref="([^"]+)"', tag).group(1)
    items[iid] = (href, tag)
cover_ids = set()
mc = re.search(r'<meta\b[^>]*name="cover"[^>]*content="([^"]+)"[^>]*/?>', o) or re.search(r'<meta\b[^>]*content="([^"]+)"[^>]*name="cover"[^>]*/?>', o)
if mc: cover_ids.add(mc.group(1))
for iid, (href, tag) in items.items():
    if 'cover-image' in tag or re.search(r'cover\.(jpe?g|png|gif)$', href, re.I): cover_ids.add(iid)
cover_ids = {i for i in cover_ids if i in items and re.search(r'\.(jpe?g|png|gif|svg)$', items[i][0], re.I)}
if not cover_ids: print('sin portada de imagen'); sys.exit(2)
cover_files = {posixpath.normpath(posixpath.join(base, items[i][0])) for i in cover_ids}
cover_basenames = {posixpath.basename(f) for f in cover_files}
# páginas xhtml que solo envuelven la portada
wrap_ids = set()
for iid, (href, tag) in items.items():
    if re.search(r'\.x?html?$', href):
        full = posixpath.normpath(posixpath.join(base, href))
        t = zin.read(full).decode('utf-8', 'replace')
        txt = re.sub(r'<[^>]+>', '', re.sub(r'<head.*?</head>', '', t, flags=re.S)).strip()
        if any(b in t for b in cover_basenames) and len(txt) < 40: wrap_ids.add(iid)
remove_ids = cover_ids | wrap_ids
remove_files = cover_files | {posixpath.normpath(posixpath.join(base, items[i][0])) for i in wrap_ids}
for iid in remove_ids:
    o = o.replace(items[iid][1], '')
    o = re.sub(r'<itemref\b[^>]*idref="%s"[^>]*/?>' % re.escape(iid), '', o)
o = re.sub(r'<meta\b[^>]*name="cover"[^>]*/?>', '', o)
for iid in wrap_ids:
    o = re.sub(r'<reference\b[^>]*href="%s[^"]*"[^>]*/?>' % re.escape(items[iid][0]), '', o)
zout = zipfile.ZipFile(dst, 'w')
zout.writestr(zipfile.ZipInfo('mimetype'), zin.read('mimetype'), compress_type=zipfile.ZIP_STORED)
for n in names:
    if n == 'mimetype' or posixpath.normpath(n) in remove_files: continue
    data = zin.read(n)
    if n == opf: data = o.encode('utf-8')
    elif re.search(r'\.(x?html?|ncx)$', n):
        t = data.decode('utf-8', 'replace'); t0 = t
        for b in cover_basenames:
            t = re.sub(r'<img\b[^>]*%s[^>]*/?>' % re.escape(b), '', t)
            t = re.sub(r'<image\b[^>]*%s[^>]*/?>(</image>)?' % re.escape(b), '', t)
            t = re.sub(r'<link\b[^>]*%s[^>]*/?>' % re.escape(b), '', t)
        for iid in wrap_ids:
            t = re.sub(r'<navPoint\b[^>]*>(?:(?!</navPoint>).)*?%s(?:(?!</navPoint>).)*?</navPoint>' % re.escape(posixpath.basename(items[iid][0])), '', t, flags=re.S)
        if t != t0: data = t.encode('utf-8')
    zout.writestr(zin.getinfo(n), data, compress_type=zipfile.ZIP_DEFLATED)
zout.close()
print('retirados:', sorted(remove_files))
