# Descarga (64 kbps) y, si hace falta, concatena las secciones LibriVox del plan.
# Uso: python3 -I catalogo-dp/_tools/audio-build.py
# Reanudable: omite resultados ya construidos. Registra capítulos y lectores en _tmp/audio/build/.
import json, os, runpy, subprocess, sys, time, collections

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
API = os.path.join(ROOT, '_tmp', 'audio', 'api')
TMP = os.path.join(ROOT, '_tmp', 'audio')
OUT = os.path.join(ROOT, 'audiolibros')
BUILD = os.path.join(TMP, 'build')
UA = 'MacondoDigital-audio/1.0 (Comfasucre school library catalog; polite sequential downloads)'
MAX_BYTES = 300 * 1024 * 1024
PLAN = runpy.run_path(os.path.join(ROOT, '_tools', 'audio-plan.py'))['PLAN']
os.makedirs(OUT, exist_ok=True); os.makedirs(BUILD, exist_ok=True)

def log(*a):
    print(*a, flush=True)

def probe(path):
    r = subprocess.run(['ffprobe', '-v', 'error', '-show_entries',
                        'format=duration:stream=codec_name,sample_rate,channels',
                        '-of', 'json', path], capture_output=True, text=True, check=True)
    j = json.loads(r.stdout)
    st = [s for s in j.get('streams', []) if s.get('codec_name')][0]
    return float(j['format']['duration']), (st['codec_name'], st.get('sample_rate'), st.get('channels'))

def magic_ok(path):
    with open(path, 'rb') as f:
        h = f.read(3)
    return h == b'ID3' or (len(h) >= 2 and h[0] == 0xFF and (h[1] & 0xE0) == 0xE0)

def outname(e):
    return f"librivox-{e[0]}{('-' + e[2]) if e[2] else ''}.mp3"

def download(url, dest):
    if os.path.exists(dest) and os.path.getsize(dest) > 0 and magic_ok(dest):
        return
    url = url.replace('://www.archive.org/', '://archive.org/')
    if not url.endswith('_64kb.mp3'):
        raise RuntimeError('No es archivo de 64 kbps: ' + url)
    tmp = dest + '.part'
    subprocess.run(['curl', '-fL', '--retry', '3', '--retry-all-errors', '--retry-delay', '5', '-sS', '-A', UA, '-o', tmp, url], check=True)
    if not magic_ok(tmp):
        raise RuntimeError('Bytes mágicos inválidos: ' + url)
    os.replace(tmp, dest)
    time.sleep(1.5)

def build(e):
    name = outname(e)
    final = os.path.join(OUT, name)
    meta = os.path.join(BUILD, name + '.json')
    if os.path.exists(final) and os.path.exists(meta):
        log('ya existe', name); return
    book = json.load(open(os.path.join(API, f'b{e[0]}.json')))['books'][0]
    secs = {s['section_number']: s for s in book['sections']}
    work = os.path.join(TMP, f'lv{e[0]}-{e[2] or "all"}')
    os.makedirs(work, exist_ok=True)
    parts = []
    for sn in e[1]:
        s = secs[sn]
        url = s['listen_url']
        dest = os.path.join(work, url.rsplit('/', 1)[-1])
        log('  descarga', name, 's' + sn, url.rsplit('/', 1)[-1])
        download(url, dest)
        dur, params = probe(dest)
        parts.append({'section': sn, 'title': s['title'], 'readers': [r['display_name'] for r in s['readers']],
                      'url': url.replace('://www.archive.org/', '://archive.org/'), 'path': dest,
                      'duration': dur, 'params': params})
    if len(parts) == 1:
        os.replace(parts[0]['path'], final + '.tmp')
        method = 'copia directa'
    else:
        lst = os.path.join(work, 'list.txt')
        with open(lst, 'w') as f:
            for p in parts:
                f.write("file '" + p['path'].replace("'", "'\\''") + "'\n")
        same = len({p['params'] for p in parts}) == 1
        cmd = ['ffmpeg', '-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', lst, '-map', '0:a', '-map_metadata', '-1',
               '-metadata', f'title={e[3]}', '-metadata', f'artist={e[4]}', '-metadata', 'comment=LibriVox (dominio público)']
        if same:
            cmd += ['-c', 'copy']; method = 'ffmpeg concat -c copy'
        else:
            ar = collections.Counter(p['params'][1] for p in parts).most_common(1)[0][0]
            cmd += ['-c:a', 'libmp3lame', '-b:a', '64k', '-ac', '1', '-ar', str(ar)]
            method = f'ffmpeg concat + recodificación libmp3lame 64k mono {ar} Hz (parámetros de secciones distintos)'
        cmd += ['-f', 'mp3', final + '.tmp']
        subprocess.run(cmd, check=True)
    size = os.path.getsize(final + '.tmp')
    if size > MAX_BYTES:
        raise RuntimeError(f'{name} excede 300 MB ({size})')
    os.replace(final + '.tmp', final)
    chapters, t = [], 0.0
    for p in parts:
        chapters.append({'start': t, 'section': p['section'], 'title': p['title'], 'readers': p['readers'], 'url': p['url']})
        t += p['duration']
    json.dump({'file': name, 'method': method, 'chapters': chapters,
               'params': sorted({str(p['params']) for p in parts})}, open(meta, 'w'), ensure_ascii=False, indent=1)
    for p in parts:
        if os.path.exists(p['path']): os.remove(p['path'])
    for fn in os.listdir(work):
        os.remove(os.path.join(work, fn))
    os.rmdir(work)
    log('OK', name, size, method)

if __name__ == '__main__':
    fails = []
    for e in PLAN:
        try:
            build(e)
        except Exception as ex:
            log('ERROR', outname(e), ex); fails.append(outname(e))
    log('FIN. fallos:', fails)
