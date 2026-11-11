# Uso: python3 -I front.py <epub> [nchars]  — imprime el texto inicial tras la cabecera PG
import zipfile, re, sys, html
p=sys.argv[1]; n=int(sys.argv[2]) if len(sys.argv)>2 else 1500
z=zipfile.ZipFile(p); text=''
import xml.etree.ElementTree as ET
opf=[x for x in z.namelist() if x.endswith('.opf')][0]
o=z.read(opf).decode('utf-8','replace')
ids={m.group(1):m.group(2) for m in re.finditer(r'<item[^>]*id="([^"]+)"[^>]*href="([^"]+)"',o)}
ids.update({m.group(2):m.group(1) for m in re.finditer(r'<item[^>]*href="([^"]+)"[^>]*id="([^"]+)"',o)})
base=opf.rsplit('/',1)[0]+'/' if '/' in opf else ''
for m in re.finditer(r'<itemref[^>]*idref="([^"]+)"',o):
    h=ids.get(m.group(1))
    if not h: continue
    try: t=z.read(base+h).decode('utf-8','replace')
    except KeyError: continue
    t=re.sub(r'<[^>]+>',' ',t); text+=html.unescape(t)+'\n'
text=re.sub(r'[ \t\r]+',' ',text); text=re.sub(r'\n\s*\n+','\n',text)
i=text.find('*** START'); i=text.find('\n',i)+1 if i>=0 else 0
print(text[i:i+n])
