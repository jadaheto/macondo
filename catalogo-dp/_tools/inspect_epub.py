# Uso: python3 -I inspect_epub.py <epub>...  Muestra imágenes, líneas con "tradu"/"versión"/fecha y nota de licencia.
import zipfile, re, sys, html
for p in sys.argv[1:]:
    z=zipfile.ZipFile(p)
    imgs=[n for n in z.namelist() if re.search(r'\.(jpe?g|png|gif|svg)$',n,re.I)]
    text=''
    for n in sorted(z.namelist()):
        if re.search(r'\.x?html?$',n):
            t=z.read(n).decode('utf-8','replace')
            t=re.sub(r'<[^>]+>',' ',t); t=html.unescape(t); text+=t+'\n'
    text=re.sub(r'[ \t\r]+',' ',text)
    i=text.find('*** START'); body=text[i:i+6000] if i>=0 else text[:6000]
    hits=[l.strip() for l in body.split('\n') if re.search(r'tradu|versi[oó]n|traslad|ilustr|\b1[89]\d\d\b|\b20\d\d\b',l,re.I) and len(l.strip())<200]
    cr=re.findall(r'[^\n]{0,80}[Cc]opyright[^\n]{0,80}',text[:i if i>0 else 3000])
    tr_any=[m for m in re.findall(r'[^\n]{0,60}(?:traducci[oó]n|traducid[ao]|traductor|vertid[ao] al)[^\n]{0,80}',text,re.I)][:6]
    print('=====',p,'imgs:',imgs[:6],len(imgs))
    print(' header-copyright:',cr[:2])
    for h in hits[:14]: print('  |',h[:160])
    for h in tr_any: print('  T>',h.strip()[:160])
