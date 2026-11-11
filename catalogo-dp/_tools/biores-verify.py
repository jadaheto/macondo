# -*- coding: utf-8 -*-
"""Verifica los MP3 (bytes mágicos, ffprobe: duración/bitrate/canales, sha256, tamaño), completa las entradas y escribe
catalogo-dp/audiobiografias.manifest.json y catalogo-dp/audioresumenes.manifest.json.
Uso: python3 -I catalogo-dp/_tools/biores-verify.py"""
import hashlib, json, os, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__)); CAT = os.path.dirname(HERE); ROOT = os.path.dirname(CAT)
entries = json.load(open(os.path.join(ROOT, '_tmp', 'biores', 'entries.json')))
report, bad = [], 0
for e in entries:
    p = os.path.join(CAT, e['file'])
    with open(p, 'rb') as f: head = f.read(3)
    magic_ok = head[:3] == b'ID3' or (head[0] == 0xFF and (head[1] & 0xE0) == 0xE0)
    pr = json.loads(subprocess.run(['ffprobe', '-v', 'error', '-print_format', 'json', '-show_format', '-show_streams', p],
                                   capture_output=True, check=True).stdout)
    st = [s for s in pr['streams'] if s['codec_type'] == 'audio'][0]
    dur = float(pr['format']['duration']); br = int(pr['format'].get('bit_rate', 0))
    h = hashlib.sha256(open(p, 'rb').read()).hexdigest(); size = os.path.getsize(p)
    ok = magic_ok and st['codec_name'] == 'mp3' and dur > 30 and 56000 <= br <= 100000
    bad += (not ok)
    e['durationSeconds'] = int(round(dur)); e['sha256'] = h; e['sizeBytes'] = size
    report.append({'file': e['file'], 'magic': magic_ok, 'codec': st['codec_name'], 'channels': st.get('channels'),
                   'sample_rate': st.get('sample_rate'), 'bit_rate': br, 'duration': round(dur, 1), 'sha256': h, 'size': size, 'ok': ok})
order = lambda e: (0 if e['source']['provider'] == 'LibriVox' else 1, e['gradeMin'], e['title'])
bio = sorted([e for e in entries if e['type'] == 'AUDIOBIOGRAPHY'], key=order)
summ = sorted([e for e in entries if e['type'] == 'AUDIOSUMMARY'], key=lambda e: (e['gradeMin'], e['title']))
json.dump(bio, open(os.path.join(CAT, 'audiobiografias.manifest.json'), 'w'), ensure_ascii=False, indent=2)
json.dump(summ, open(os.path.join(CAT, 'audioresumenes.manifest.json'), 'w'), ensure_ascii=False, indent=2)
json.dump(report, open(os.path.join(ROOT, '_tmp', 'biores', 'verify-report.json'), 'w'), ensure_ascii=False, indent=1)
for r in report:
    print(('OK ' if r['ok'] else 'FALLA ') + f"{r['file']}  {r['duration']}s  {r['bit_rate']//1000}kbps  ch={r['channels']}  {r['sample_rate']}Hz  {r['size']}B  {r['sha256'][:12]}")
print(f'{len(report)} archivos, {bad} con fallas; total {sum(r["duration"] for r in report)/3600:.2f} h, {sum(r["size"] for r in report)/1e6:.1f} MB')
sys.exit(1 if bad else 0)
