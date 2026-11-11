"""Muestras de voz con MeloTTS-Spanish (myshell-ai/MeloTTS-Spanish, MIT) -> WAV maestro (44.1 kHz mono).

Uso (dentro del contenedor o venv con `melotts` instalado desde GitHub + `python -m unidic download`):
    python voz-muestras-melo.py --out salida.wav [--text-file parrafos.txt] [--speed 1.0]

- El texto se divide en párrafos (líneas en blanco); MeloTTS parte cada párrafo en frases.
- Entre párrafos 0.55 s de silencio, 0.6 s al inicio (MeloTTS ya inserta pausas entre frases).
- Imprime tiempo de carga, tiempo de síntesis en CPU y duración.
El MP3 se hace fuera (ffmpeg -ac 1 -ar 44100 -c:a libmp3lame -b:a 64k).
Variables útiles: HF_HOME (caché: checkpoint ES ~200 MB + BERT español ~500 MB).
"""
import argparse, os, time
import numpy as np
import soundfile as sf

TEXTO = ("En la playa de Coveñas, Sara encontró una semilla brillante entre las conchas. "
         "—¿Qué serás tú? —le preguntó en voz baja. La sembró en una matera, la regó cada mañana y esperó. "
         "Una semana después, una hojita verde se asomó al sol. "
         "Sara sonrió: a veces lo más pequeño guarda la sorpresa más grande.")


def main():
    ap = argparse.ArgumentParser()
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
    from melo.api import TTS
    model = TTS(language='ES', device='cpu')
    spk = model.hps.data.spk2id['ES']
    sr = model.hps.data.sampling_rate
    t_load = time.perf_counter() - t0

    sil = lambda s: np.zeros(int(sr * s), dtype=np.float32)
    parts = [sil(0.6)]
    t1 = time.perf_counter()
    for p in paragraphs:
        audio = model.tts_to_file(p, spk, output_path=None, speed=a.speed, quiet=True)
        parts.append(np.asarray(audio, dtype=np.float32))
        parts.append(sil(0.55))
    t_synth = time.perf_counter() - t1
    audio = np.concatenate(parts)
    sf.write(a.out, audio, sr, subtype='PCM_16')
    dur = len(audio) / sr
    print(f'modelo=MeloTTS-Spanish sr={sr} carga={t_load:.2f}s sintesis={t_synth:.2f}s '
          f'duracion={dur:.2f}s rtf={t_synth / dur:.3f}')


if __name__ == '__main__':
    main()
