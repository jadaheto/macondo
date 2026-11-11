# Uso: python3 -I ws_textsize.py <epub>...  — caracteres de texto por EPUB y número de capítulos (detecta exportaciones incompletas)
import zipfile, re, sys, html
for p in sys.argv[1:]:
    z = zipfile.ZipFile(p)
    ch = [n for n in z.namelist() if re.match(r'OPS/c\d+_', n)]
    t = ''.join(re.sub(r'<[^>]+>', ' ', z.read(n).decode('utf-8', 'replace')) for n in ch)
    print(f"{len(re.sub(r'\s+', ' ', html.unescape(t))):>9} {len(ch):>4}  {p.split('/')[-1]}")
