"""Muestras de voz con Piper (piper-tts) -> WAV maestro + MP3 64 kbps mono.

Sirve tanto para generar la muestra de comparación como para narración por lotes:
    venv/bin/python voz-muestras-piper.py --model voces/es_MX-claude-high.onnx \
        --out salida.wav [--mp3 salida.mp3] [--text-file parrafos.txt] \
        [--length-scale 1.0 --noise-scale 0.667 --noise-w 0.8]

- El texto se divide en párrafos (líneas en blanco); Piper los parte en frases.
- Entre frases se insertan 0.35 s de silencio, entre párrafos 0.55 s, 0.6 s al inicio.
- Si no se pasan --length-scale/--noise-*, se usan los valores del .onnx.json de la voz.
- Imprime el tiempo de síntesis en CPU y la duración del audio.
Requiere: piper-tts (probado con 1.8.0), numpy, ffmpeg en PATH (solo para el MP3).
"""
import argparse, os, subprocess, sys, time, wave
import numpy as np
from piper import PiperVoice, SynthesisConfig

TEXTO = ("En la playa de Coveñas, Sara encontró una semilla brillante entre las conchas. "
         "—¿Qué serás tú? —le preguntó en voz baja. La sembró en una matera, la regó cada mañana y esperó. "
         "Una semana después, una hojita verde se asomó al sol. "
         "Sara sonrió: a veces lo más pequeño guarda la sorpresa más grande.")


def synth(voice, paragraphs, cfg):
    sr = voice.config.sample_rate
    sil = lambda s: np.zeros(int(sr * s), dtype=np.int16)
    parts = [sil(0.6)]
    for p in paragraphs:
        for ch in voice.synthesize(p, cfg):
            parts.append(ch.audio_int16_array)
            parts.append(sil(0.35))
        parts.append(sil(0.55))
    return np.concatenate(parts), sr


def write_wav(path, audio, sr):
    with wave.open(path, 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes(audio.tobytes())


def to_mp3(wav, mp3, title='', artist='Biblioteca Macondo'):
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', wav, '-ac', '1', '-ar', '44100', '-c:a', 'libmp3lame',
                    '-b:a', '64k', '-id3v2_version', '3', '-metadata', f'title={title}', '-metadata', f'artist={artist}',
                    '-metadata', 'genre=Speech', mp3], check=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--model', required=True, help='ruta al .onnx (el .onnx.json debe estar al lado)')
    ap.add_argument('--out', required=True, help='WAV de salida')
    ap.add_argument('--mp3', help='MP3 de salida (opcional)')
    ap.add_argument('--text-file', help='archivo de texto UTF-8; párrafos separados por línea en blanco')
    ap.add_argument('--length-scale', type=float)
    ap.add_argument('--noise-scale', type=float)
    ap.add_argument('--noise-w', type=float)
    ap.add_argument('--title', default='Muestra de voz')
    a = ap.parse_args()

    if a.text_file:
        raw = open(a.text_file, encoding='utf-8').read()
        paragraphs = [' '.join(p.split()) for p in raw.split('\n\n') if p.strip()]
    else:
        paragraphs = [TEXTO]

    t0 = time.perf_counter()
    voice = PiperVoice.load(a.model)
    t_load = time.perf_counter() - t0
    cfg = SynthesisConfig(length_scale=a.length_scale, noise_scale=a.noise_scale, noise_w_scale=a.noise_w)
    t1 = time.perf_counter()
    audio, sr = synth(voice, paragraphs, cfg)
    t_synth = time.perf_counter() - t1
    write_wav(a.out, audio, sr)
    if a.mp3:
        to_mp3(a.out, a.mp3, title=a.title)
    dur = len(audio) / sr
    print(f'modelo={os.path.basename(a.model)} sr={sr} carga={t_load:.2f}s sintesis={t_synth:.2f}s '
          f'duracion={dur:.2f}s rtf={t_synth / dur:.3f}')


if __name__ == '__main__':
    main()
