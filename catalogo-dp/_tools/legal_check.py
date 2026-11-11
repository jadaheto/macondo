# Verifica cada entrada de selection.py contra el catálogo: todos los autores/traductores/colaboradores
# acreditados deben haber muerto <=1945. Años aproximados ("?") se aceptan solo si <=1900.
# Obras antiguas sin fechas (Apuleyo, Longo, Lucrecio) se aceptan explícitamente.
import json, sys, re, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from selection import SEL
cat={r['id']:r for r in json.load(open(sys.argv[1]))}
ANCIENT={'Apuleius','Longus','Lucrecio Caro, Tito','Anonymous'}
out={}; bad=[]
for e in SEL:
    r=cat.get(e['id'])
    if not r: bad.append((e['id'],'no está en catálogo es')); continue
    probs=[]
    for a in r['authors']:
        if a['name'] in ANCIENT: continue
        if a['role']=='Illustrator' and e.get('strip_cover'): continue  # portada escaneada retirada del EPUB
        if a['death'] is None: probs.append(f"{a['name']} sin año de muerte")
        elif a['uncertain'] and a['death']>1900: probs.append(f"{a['name']} año incierto {a['death']}")
        elif a['death']>1945: probs.append(f"{a['name']} †{a['death']}")
    if probs: bad.append((e['id'],probs))
    out[e['id']]=r
print('seleccionadas',len(SEL),'problemas',bad)
json.dump({str(k):v for k,v in out.items()},open(sys.argv[2],'w'),ensure_ascii=False)
