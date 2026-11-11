# Uso: python3 -I verify.py <dir_libros> <salida.json> [lista_archivos.txt]
# Verifica cada EPUB: bytes mágicos PK\x03\x04, integridad (unzip -t), mimetype application/epub+zip,
# calcula sha256/tamaño, cuenta imágenes y busca avisos de copyright/licencia no estándar.
import os, sys, json, hashlib, subprocess, zipfile, re
d, outp = sys.argv[1], sys.argv[2]
res = {}
only = set(open(sys.argv[3]).read().split()) if len(sys.argv) > 3 else None   # lista opcional de archivos
for f in sorted(os.listdir(d)):
    if only is not None and f not in only: continue
    if not f.endswith('.epub'): continue
    p = os.path.join(d, f); r = {'file': f}
    b = open(p, 'rb').read()
    r['magic'] = b[:4].hex() == '504b0304'
    r['sha256'] = hashlib.sha256(b).hexdigest(); r['size'] = len(b)
    t = subprocess.run(['unzip', '-tq', p], capture_output=True, text=True)
    r['unzip_t'] = t.returncode == 0
    try:
        z = zipfile.ZipFile(p)
        r['mimetype'] = z.read('mimetype').decode().strip() == 'application/epub+zip'
        r['first_is_mimetype'] = z.namelist()[0] == 'mimetype'
        r['images'] = [n for n in z.namelist() if re.search(r'\.(jpe?g|png|gif|svg)$', n, re.I)]
        txt = ''
        for n in z.namelist():
            if re.search(r'\.x?html?$', n): txt += z.read(n).decode('utf-8', 'replace')
        plain = re.sub(r'<[^>]+>', ' ', txt)
        i = plain.find('*** START')
        head = plain[:i] if i > 0 else plain[:5000]
        r['pg_license'] = 'www.gutenberg.org/license' in plain or 'Project Gutenberg License' in plain
        r['header_copyright'] = bool(re.search(r'copyright(ed)?\s+(project gutenberg|by|\(c\)|©)', head, re.I))
        r['ws_about'] = 'OPS/about.xhtml' in z.namelist()
        if r['ws_about']:
            ab = re.sub(r'<[^>]+>', ' ', z.read('OPS/about.xhtml').decode('utf-8', 'replace'))
            r['ws_license'] = re.findall(r'Creative Commons [A-Z\-]+ [0-9.]+|GNU FDL', ab)
        r['us_only_notice'] = bool(re.search(r'not located in the United States, you will have to check the laws', plain))
    except Exception as ex:
        r['error'] = str(ex)
    lic_ok = r.get('pg_license') if f.startswith('gutenberg-') else bool(r.get('ws_license'))
    r['ok'] = bool(r['magic'] and r['unzip_t'] and r.get('mimetype') and r.get('first_is_mimetype', True) and r['size'] <= 8*1024*1024 and lic_ok and not r.get('header_copyright'))
    res[f] = r
json.dump(res, open(outp, 'w'), indent=1)
bad = [k for k, v in res.items() if not v['ok']]
print('verificados', len(res), 'fallidos', bad, 'total_bytes', sum(v['size'] for v in res.values()))
