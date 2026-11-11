"""Muestras de voz con Kokoro-82M (hexgrad/Kokoro-82M, Apache 2.0) -> WAV maestro (24 kHz mono).

Uso (dentro del contenedor o venv con `kokoro`, `misaki[es]`, `soundfile` y espeak-ng instalado):
    python voz-muestras-kokoro.py --voice ef_dora --out salida.wav [--text-file parrafos.txt] [--speed 1.0]
Voces en español (lang_code 'e'): ef_dora (femenina), em_alex y em_santa (masculinas).

- El texto se divide en párrafos (líneas en blanco); Kokoro parte cada párrafo en frases.
- Entre frases 0.35 s de silencio, entre párrafos 0.55 s, 0.6 s al inicio.
- Imprime tiempo de carga, tiempo de síntesis en CPU y duración.
El MP3 se hace fuera (ffmpeg -ac 1 -ar 44100 -c:a libmp3lame -b:a 64k).
Variables útiles: HF_HOME (caché del modelo, ~330 MB: kokoro-v1_0.pth + voces .pt).
"""
import argparse, os, time
import numpy as np
import soundfile as sf

TEXTO = ("En la playa de Coveñas, Sara encontró una semilla brillante entre las conchas. "
         "—¿Qué serás tú? —le preguntó en voz baja. La sembró en una matera, la regó cada mañana y esperó. "
         "Una semana después, una hojita verde se asomó al sol. "
         "Sara sonrió: a veces lo más pequeño guarda la sorpresa más grande.")
SR = 24000


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--voice', default='ef_dora')
    ap.add_argument('--out', required=True)
    ap.add_argument('--text-file')
    ap.add_argument('--speed', type=float, default=1.0)
    a = ap.parse_args()

    if a.text_file:
        raw = open(a.text_file, encoding='utf-8').read()
        paragraphs = [' '.join(p.split()) for p in raw.split('\n\n') if p.strip()]
    else:
        paragraphs = [TEXTO]

    t0 = time.perf_counter()
    import torch
    torch.set_num_threads(max(1, os.cpu_count() or 1))
    from kokoro import KPipeline
    pipe = KPipeline(lang_code='e', repo_id='hexgrad/Kokoro-82M')
    t_load = time.perf_counter() - t0

    sil = lambda s: np.zeros(int(SR * s), dtype=np.float32)
    parts = [sil(0.6)]
    t1 = time.perf_counter()
    for p in paragraphs:
        # split_pattern: Kokoro trocea por saltos de línea; además limitamos frases largas con el patrón por defecto
        for _gs, _ps, audio in pipe(p, voice=a.voice, speed=a.speed, split_pattern=r'(?<=[.!?…])\s+'):
            parts.append(np.asarray(audio, dtype=np.float32))
            parts.append(sil(0.35))
        parts.append(sil(0.55))
    t_synth = time.perf_counter() - t1
    audio = np.concatenate(parts)
    sf.write(a.out, audio, SR, subtype='PCM_16')
    dur = len(audio) / SR
    print(f'modelo=Kokoro-82M voz={a.voice} sr={SR} carga={t_load:.2f}s sintesis={t_synth:.2f}s '
          f'duracion={dur:.2f}s rtf={t_synth / dur:.3f}')


if __name__ == '__main__':
    main()
