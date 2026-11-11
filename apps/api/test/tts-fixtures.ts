/** Fixtures de audio para las pruebas de narración (sin Piper): WAV de silencio y MP3 falso con cabecera ID3. */

/** WAV PCM 16 bits mono con `seconds` de silencio. */
export function silentWav(seconds: number, sampleRate = 22050): Buffer {
  const data = Buffer.alloc(Math.round(seconds * sampleRate) * 2);
  const h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + data.length, 4); h.write('WAVE', 8);
  h.write('fmt ', 12); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22);
  h.writeUInt32LE(sampleRate, 24); h.writeUInt32LE(sampleRate * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34);
  h.write('data', 36); h.writeUInt32LE(data.length, 40);
  return Buffer.concat([h, data]);
}

export const FAKE_MP3 = Buffer.concat([Buffer.from('ID3'), Buffer.from([3, 0, 0, 0, 0, 0, 0]), Buffer.alloc(600, 0x55)]);

import { writeFileSync } from 'node:fs';
import * as path from 'node:path';

/**
 * Instala en `dir` un «piper» (WAV de 0,05 s por carácter) y un «lame» (copia un MP3 falso) simulados y
 * devuelve las variables TTS_* para que `TtsService` los use. Compartido por tts.e2e y cuentos.e2e.
 */
export function installFakeTts(dir: string): Record<string, string> {
  const voice = path.join(dir, 'es_ES-prueba-medium.onnx');
  writeFileSync(voice, 'modelo');
  writeFileSync(`${voice}.json`, '{}');
  const piperJs = path.join(dir, 'fake-piper.cjs');
  writeFileSync(piperJs, `
    const fs = require('fs');
    const args = process.argv.slice(2);
    const out = args[args.indexOf('-f') + 1];
    let input = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (d) => { input += d; });
    process.stdin.on('end', () => {
      const chars = input.replace(/\\s+/g, ' ').trim().length;
      const sr = 22050, n = Math.round(chars * 0.05 * sr);
      const h = Buffer.alloc(44);
      h.write('RIFF', 0); h.writeUInt32LE(36 + n * 2, 4); h.write('WAVE', 8); h.write('fmt ', 12); h.writeUInt32LE(16, 16);
      h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22); h.writeUInt32LE(sr, 24); h.writeUInt32LE(sr * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34);
      h.write('data', 36); h.writeUInt32LE(n * 2, 40);
      fs.writeFileSync(out, Buffer.concat([h, Buffer.alloc(n * 2)]));
    });
  `);
  const piperBin = path.join(dir, 'piper');
  writeFileSync(piperBin, `#!/bin/sh\nexec "${process.execPath}" "${piperJs}" "$@"\n`, { mode: 0o755 });
  const mp3File = path.join(dir, 'fake.mp3');
  writeFileSync(mp3File, FAKE_MP3);
  const lameBin = path.join(dir, 'lame');
  writeFileSync(lameBin, `#!/bin/sh\nfor last; do :; done\ncp "${mp3File}" "$last"\n`, { mode: 0o755 });
  return { TTS_ENABLED: 'true', TTS_ENGINE: 'piper', TTS_PIPER_BIN: piperBin, TTS_VOICE: voice, TTS_MP3_BIN: lameBin };
}
