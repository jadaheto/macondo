"""Hoja de contacto de las escenas de un archivo de datos de cuentos.
Uso: python3 -I cuentos-preview.py <cuentos-data/xxx.json> <salida.png> [slug]"""
import importlib.util, json, os, subprocess, sys, tempfile
HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location('cs', os.path.join(HERE, 'cuentos-svg.py')); cs = importlib.util.module_from_spec(spec); spec.loader.exec_module(cs)
data = json.load(open(sys.argv[1]))
if len(sys.argv) > 3:
    data = [d for d in data if d['slug'] == sys.argv[3]]
cells = []
for d in data:
    for i, sc in enumerate([d['coverScene']] + [p['scene'] for p in d['pages']]):
        cells.append(f'<div style="font:12px sans-serif">{d["slug"]} {"portada" if i == 0 else i}<br>{cs.render_scene(sc, 320, 240)}</div>')
html = '<html><body style="margin:0;display:grid;grid-template-columns:repeat(4,320px);gap:4px">' + ''.join(cells) + '</body></html>'
fd, tmp = tempfile.mkstemp(suffix='.html'); os.write(fd, html.encode()); os.close(fd)
subprocess.run(['node', os.path.join(HERE, 'cuentos-shot.js'), tmp, sys.argv[2], '1300', '400', '1'], check=True)
os.unlink(tmp); print('ok', sys.argv[2])
