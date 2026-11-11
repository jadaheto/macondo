"""Transcripción de control (faster-whisper) para revisar contenido de secciones LibriVox
y la inteligibilidad de la voz TTS. Uso: venv/bin/python -I biores-transcribe.py modelo archivo.mp3 [segundos_max]
El audio se decodifica con ffmpeg (16 kHz mono) para evitar incompatibilidades de PyAV."""
import sys, subprocess
import numpy as np
from faster_whisper import WhisperModel
maxs = float(sys.argv[3]) if len(sys.argv) > 3 else None
cmd = ['ffmpeg', '-v', 'error', '-i', sys.argv[2]] + (['-t', str(maxs)] if maxs else []) + ['-ac', '1', '-ar', '16000', '-f', 's16le', '-']
pcm = subprocess.run(cmd, capture_output=True, check=True).stdout
audio = np.frombuffer(pcm, np.int16).astype(np.float32) / 32768.0
m = WhisperModel(sys.argv[1], device='cpu', compute_type='int8')
segs, info = m.transcribe(audio, language='es', beam_size=1, vad_filter=True)
print(' '.join(s.text.strip() for s in segs))
