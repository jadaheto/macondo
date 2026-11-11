import { TTS_LIMITS, TTS_VOICE_CREDIT } from '@macondo/shared';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { promises as fs } from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { AppConfig } from '../src/config/env';
import { chunkText, normalizeText, updateLicenseVoiceCredit, wavDurationSeconds } from '../src/tts/tts-text';
import { type ProcessRunner, TtsService, TtsUnavailableError } from '../src/tts/tts.service';

import { FAKE_MP3, silentWav } from './tts-fixtures';

function cfgWith(tts: Partial<AppConfig['tts']>): AppConfig {
  return {
    tts: { enabled: true, engine: 'piper', piperBin: '/nonexistent/piper', voice: '/nonexistent/voice.onnx', mp3Bin: '', timeoutMs: 5000, maxParallel: 2, ...tts },
  } as AppConfig;
}

describe('TTS: preparación del texto', () => {
  it('normaliza espacios y conserva párrafos', () => {
    expect(normalizeText('  Hola \t mundo.\r\n\r\n\r\nSegundo   párrafo\ncontinúa.  \n\n')).toBe('Hola mundo.\n\nSegundo párrafo continúa.');
    expect(normalizeText('\n \n')).toBe('');
  });
  it('agrupa párrafos cortos en una línea y parte los largos por frases', () => {
    expect(chunkText('')).toEqual([]);
    expect(chunkText('Uno.\n\nDos.\n\nTres.')).toEqual(['Uno. Dos. Tres.']);
    const sentence = 'Esta es una frase de prueba bastante normal para el narrador. ';
    const long = sentence.repeat(120); // ≈ 7 600 caracteres sin saltos de línea
    const chunks = chunkText(long);
    expect(chunks.length).toBeGreaterThanOrEqual(2);
    for (const c of chunks) {
      expect(c.length).toBeLessThanOrEqual(TTS_LIMITS.chunkChars);
      expect(c.endsWith('.')).toBe(true); // corta en límite de frase
    }
    expect(chunks.join(' ')).toBe(long.trim());
  });
  it('sin espacios: corte duro; por encima del máximo: error', () => {
    expect(chunkText('a'.repeat(9000), 4000).map((c) => c.length)).toEqual([4000, 4000, 1000]);
    expect(() => chunkText('b'.repeat(TTS_LIMITS.maxChars + 1))).toThrow(RangeError);
  });
  it('duración de un WAV a partir de la cabecera', () => {
    const wav = silentWav(2.5);
    expect(wavDurationSeconds(wav.subarray(0, 44), wav.length)).toBeCloseTo(2.5, 3);
    expect(wavDurationSeconds(Buffer.from('no es wav'), 9)).toBeNull();
  });
  it('actualiza la mención a la voz sintética en licenseName sin tocar el resto', () => {
    expect(updateLicenseVoiceCredit('Contenido propio; voz sintética Piper es_ES-carlfm-x_low (modelo MIT, dataset de dominio público)'))
      .toBe('Contenido propio; voz sintética Piper es_ES-davefx-medium (datos CC0)');
    expect(updateLicenseVoiceCredit('Contenido propio; voz sintética macOS solo para demo')).toBe('Contenido propio; voz sintética Piper es_ES-davefx-medium (datos CC0)');
    expect(updateLicenseVoiceCredit('Voz sintética (macOS, Paulina) — solo demostración')).toBe(TTS_VOICE_CREDIT);
    expect(updateLicenseVoiceCredit('CC BY 4.0')).toBe('CC BY 4.0');
    expect(updateLicenseVoiceCredit('Dominio público (Ley 23 de 1982, art. 21)')).toBe('Dominio público (Ley 23 de 1982, art. 21)');
  });
});

describe('TtsService con binario simulado', () => {
  let dir: string;
  let voice: string;
  let piperBin: string;
  let lameBin: string;
  beforeAll(async () => {
    dir = mkdtempSync(path.join(os.tmpdir(), 'macondo-tts-unit-'));
    voice = path.join(dir, 'voz.onnx');
    writeFileSync(voice, 'modelo');
    writeFileSync(`${voice}.json`, '{}');
    piperBin = path.join(dir, 'piper');
    lameBin = path.join(dir, 'lame');
    writeFileSync(piperBin, '#!/bin/sh\nexit 0\n', { mode: 0o755 });
    writeFileSync(lameBin, '#!/bin/sh\nexit 0\n', { mode: 0o755 });
  });
  afterAll(() => rmSync(dir, { recursive: true, force: true }));

  /** Runner falso: «piper» escribe un WAV de 0,05 s por carácter; «lame» escribe un MP3 falso en el último argumento. */
  function fakeRunner(log: string[][] = [], opts: { piperCode?: number; slowMs?: number; timeout?: boolean } = {}): ProcessRunner {
    return {
      async run(bin, args, o) {
        log.push([bin, ...args]);
        if (opts.slowMs) await new Promise((r) => setTimeout(r, opts.slowMs));
        if (opts.timeout) return { code: null, stderr: '', timedOut: true };
        if (path.basename(bin) === 'piper') {
          const out = args[args.indexOf('-f') + 1];
          const chars = (o.stdin ?? '').replace(/\s+/g, ' ').trim().length;
          await fs.writeFile(out, silentWav(chars * 0.05));
          return { code: opts.piperCode ?? 0, stderr: opts.piperCode ? 'boom' : '', timedOut: false };
        }
        await fs.writeFile(args[args.length - 1], FAKE_MP3);
        return { code: 0, stderr: '', timedOut: false };
      },
    };
  }

  it('estado: desactivado, sin binario, sin voz, sin codificador, ok', async () => {
    expect(await new TtsService(cfgWith({ enabled: false })).status()).toMatchObject({ enabled: false, ok: false, detail: expect.stringMatching(/TTS_ENABLED/) });
    expect(await new TtsService(cfgWith({})).status()).toMatchObject({ ok: false, engine: 'piper', detail: expect.stringMatching(/binario de Piper/) });
    expect(await new TtsService(cfgWith({ piperBin })).status()).toMatchObject({ ok: false, detail: expect.stringMatching(/modelo de voz/) });
    expect(await new TtsService(cfgWith({ piperBin, voice, mp3Bin: path.join(dir, 'no-existe') })).status()).toMatchObject({ ok: false, detail: expect.stringMatching(/codificador MP3/) });
    expect(await new TtsService(cfgWith({ piperBin, voice, mp3Bin: lameBin })).status()).toEqual({ enabled: true, engine: 'piper', voice: 'voz', ok: true, detail: null });
  });

  it('synthesize sin motor → 503 Narración no disponible', async () => {
    await expect(new TtsService(cfgWith({})).synthesize('Hola')).rejects.toBeInstanceOf(TtsUnavailableError);
    await expect(new TtsService(cfgWith({})).synthesize('Hola')).rejects.toThrow(/Narración no disponible/);
  });

  it('synthesize: envía los trozos por stdin, calcula la duración y codifica con lame', async () => {
    const log: string[][] = [];
    const svc = new TtsService(cfgWith({ piperBin, voice, mp3Bin: lameBin }), fakeRunner(log));
    const text = 'Primera frase.\n\nSegunda frase, con coma.';
    const res = await svc.synthesize(text, { lengthScale: 1.1, sentenceSilence: 0.4, title: 'Prueba' });
    expect(res.mp3.equals(FAKE_MP3)).toBe(true);
    expect(res.durationSeconds).toBeCloseTo(text.replace(/\s+/g, ' ').length * 0.05, 2);
    expect(res.chunks).toBe(1);
    expect(log).toHaveLength(2);
    expect(log[0]).toEqual([piperBin, '-m', voice, '-f', expect.stringMatching(/\.wav$/), '--sentence-silence', '0.4', '--length-scale', '1.1']);
    expect(log[1][0]).toBe(lameBin);
    expect(log[1]).toEqual(expect.arrayContaining(['-b', '64', '-m', 'm', '--resample', '44.1', '--tt', 'Prueba']));
    expect(svc.load).toEqual({ running: 0, waiting: 0 });
    // El directorio temporal se elimina
    expect(existsSync(path.dirname(log[0][4]))).toBe(false);
  });

  it('ffmpeg como codificador alternativo (según el nombre del binario)', async () => {
    const ffmpegBin = path.join(dir, 'ffmpeg');
    writeFileSync(ffmpegBin, '#!/bin/sh\nexit 0\n', { mode: 0o755 });
    const log: string[][] = [];
    const svc = new TtsService(cfgWith({ piperBin, voice, mp3Bin: ffmpegBin }), fakeRunner(log));
    await svc.synthesize('Hola mundo.');
    expect(log[1]).toEqual(expect.arrayContaining(['-c:a', 'libmp3lame', '-b:a', '64k', '-ac', '1', '-ar', '44100']));
  });

  it('piper falla o se agota el tiempo → 500 con mensaje en español', async () => {
    const svc = new TtsService(cfgWith({ piperBin, voice, mp3Bin: lameBin }), fakeRunner([], { piperCode: 1 }));
    await expect(svc.synthesize('Hola')).rejects.toThrow(/síntesis de voz falló/);
    const slow = new TtsService(cfgWith({ piperBin, voice, mp3Bin: lameBin }), fakeRunner([], { timeout: true }));
    await expect(slow.synthesize('Hola')).rejects.toThrow(/tardó demasiado/);
    expect(svc.load).toEqual({ running: 0, waiting: 0 });
  });

  it('cola: como máximo 2 síntesis simultáneas', async () => {
    const svc = new TtsService(cfgWith({ piperBin, voice, mp3Bin: lameBin, maxParallel: 2 }), fakeRunner([], { slowMs: 60 }));
    const all = Promise.all([1, 2, 3, 4].map((i) => svc.synthesize(`Texto ${i}.`)));
    await new Promise((r) => setTimeout(r, 20));
    expect(svc.load).toEqual({ running: 2, waiting: 2 });
    await all;
    expect(svc.load).toEqual({ running: 0, waiting: 0 });
  });
});

/**
 * Integración real: solo si existe la voz (TTS_VOICE) y el binario (TTS_PIPER_BIN); si no, se omite.
 *   TTS_PIPER_BIN=catalogo-dp/_tmp/tts/venv/bin/piper TTS_VOICE=catalogo-dp/_tmp/tts-muestras/piper-voices/es_ES-davefx-medium.onnx npx vitest run test/tts.test.ts
 */
const realVoice = process.env.TTS_VOICE ?? '';
const realPiper = process.env.TTS_PIPER_BIN ?? '';
const hasReal = !!realVoice && existsSync(realVoice) && !!realPiper && existsSync(realPiper);
describe.skipIf(!hasReal)('TTS integración real (Piper + codificador MP3 instalados)', () => {
  it('sintetiza una frase corta a MP3 con duración plausible', async () => {
    const svc = new TtsService(cfgWith({ piperBin: realPiper, voice: realVoice, mp3Bin: process.env.TTS_MP3_BIN ?? '', timeoutMs: 120_000 }));
    expect(await svc.status()).toMatchObject({ ok: true });
    const res = await svc.synthesize('En la playa de Coveñas, Sara encontró una semilla brillante entre las conchas.', { title: 'Integración' });
    expect(res.durationSeconds).toBeGreaterThan(2);
    expect(res.durationSeconds).toBeLessThan(15);
    expect(res.mp3.length).toBeGreaterThan(10_000);
    const head = res.mp3.subarray(0, 3).toString('latin1');
    expect(head === 'ID3' || (res.mp3[0] === 0xff && (res.mp3[1] & 0xe0) === 0xe0)).toBe(true);
    // Si hay ffprobe, se contrasta la duración del MP3 con la del WAV.
    try {
      const probe = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', '-'], { input: res.mp3 }).toString().trim();
      expect(Math.abs(Number(probe) - res.durationSeconds)).toBeLessThan(0.6);
    } catch {
      /* sin ffprobe en el host */
    }
  }, 120_000);
});
