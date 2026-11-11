"""Síntesis de voz con Piper (voz es_ES-carlfm-x_low, dataset de dominio público) -> MP3 64 kbps mono.
Uso como módulo: synth(paragraphs, out_mp3, title, artist). Requiere el venv de _tmp/tts y ffmpeg."""
import os, subprocess, tempfile, wave
import numpy as np
from piper import PiperVoice, SynthesisConfig
HERE = os.path.dirname(os.path.abspath(__file__))
MODEL = os.path.join(HERE, '..', '_tmp', 'tts', 'voices', 'es_ES-carlfm-x_low.onnx')
_voice = None
CFG = SynthesisConfig(length_scale=1.3, noise_scale=0.6, noise_w_scale=0.7)

def voice():
    global _voice
    if _voice is None:
        _voice = PiperVoice.load(MODEL)
    return _voice

def synth(paragraphs, out_mp3, title, artist, comment='Biblioteca Macondo - Comfasucre'):
    v = voice(); sr = v.config.sample_rate
    sil = lambda s: np.zeros(int(sr * s), dtype=np.int16)
    parts = [sil(0.6)]
    for p in paragraphs:
        for ch in v.synthesize(p, CFG):
            parts.append(ch.audio_int16_array); parts.append(sil(0.35))
        parts.append(sil(0.55))
    audio = np.concatenate(parts)
    with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tf:
        wav = tf.name
    with wave.open(wav, 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes(audio.tobytes())
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', wav, '-ac', '1', '-ar', '44100', '-c:a', 'libmp3lame', '-b:a', '64k',
                    '-id3v2_version', '3', '-metadata', f'title={title}', '-metadata', f'artist={artist}',
                    '-metadata', f'comment={comment}', '-metadata', 'genre=Speech', out_mp3], check=True)
    os.unlink(wav)
    return len(audio) / sr
