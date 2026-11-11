import { Inject, Injectable, InternalServerErrorException, Logger, Optional, ServiceUnavailableException } from '@nestjs/common';
import type { TtsStatus } from '@macondo/shared';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { constants as fsConstants, promises as fs } from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { APP_CONFIG, type AppConfig, type TtsConfig } from '../config/env';
import { chunkText, wavDurationSeconds } from './tts-text';

export interface SynthesizeOptions {
  /** 1 = velocidad de la voz; >1 más lento. */
  lengthScale?: number;
  /** Silencio entre frases (s). */
  sentenceSilence?: number;
  /** Título que se escribe en la etiqueta ID3 del MP3. */
  title?: string;
}

export interface SynthesisResult {
  mp3: Buffer;
  durationSeconds: number;
  /** Caracteres narrados (tras normalizar) y trozos enviados a Piper. */
  chars: number;
  chunks: number;
  /** Tiempo total de síntesis + codificación (ms). */
  elapsedMs: number;
}

export interface RunResult { code: number | null; stderr: string; timedOut: boolean }
/** Token para inyectar un `ProcessRunner` alternativo (pruebas sin Piper instalado). */
export const TTS_RUNNER = Symbol('TTS_RUNNER');
/** Ejecuta un binario externo (inyectable para pruebas sin Piper instalado). */
export interface ProcessRunner {
  run(bin: string, args: string[], opts: { stdin?: string; timeoutMs: number }): Promise<RunResult>;
}

/** Sin binario/voz: 503 «Narración no disponible» (el panel lo muestra y el resto de la API sigue). */
export class TtsUnavailableError extends ServiceUnavailableException {
  constructor(detail: string) {
    super(`Narración no disponible: ${detail}`);
  }
}

const SPAWN_RUNNER: ProcessRunner = {
  run(bin, args, { stdin, timeoutMs }) {
    return new Promise<RunResult>((resolve, reject) => {
      const child = spawn(bin, args, { stdio: ['pipe', 'ignore', 'pipe'], env: { ...process.env, PYTHONUNBUFFERED: '1' } });
      let stderr = '';
      let timedOut = false;
      const timer = setTimeout(() => {
        timedOut = true;
        child.kill('SIGKILL');
      }, timeoutMs);
      child.stderr.on('data', (d: Buffer) => {
        if (stderr.length < 8000) stderr += d.toString('utf8');
      });
      child.on('error', (err) => {
        clearTimeout(timer);
        reject(err);
      });
      child.on('close', (code) => {
        clearTimeout(timer);
        resolve({ code, stderr, timedOut });
      });
      if (stdin !== undefined) {
        child.stdin.on('error', () => undefined); // EPIPE si el proceso muere antes de leer
        child.stdin.end(stdin, 'utf8');
      } else {
        child.stdin.end();
      }
    });
  },
};

async function executable(p: string): Promise<boolean> {
  try {
    await fs.access(p, fsConstants.X_OK);
    return (await fs.stat(p)).isFile();
  } catch {
    return false;
  }
}
async function readable(p: string): Promise<boolean> {
  try {
    return (await fs.stat(p)).isFile();
  } catch {
    return false;
  }
}

/** Busca un ejecutable en PATH (como `which`). */
async function whichBin(name: string): Promise<string | null> {
  for (const dir of (process.env.PATH ?? '').split(path.delimiter).filter(Boolean)) {
    const full = path.join(dir, name);
    if (await executable(full)) return full;
  }
  return null;
}

/**
 * Narración sintética en el servidor (ADR-017): Piper (`es_ES-davefx-medium`, datos CC0) corre como
 * PROCESO APARTE dentro de su venv (GPL-3; nunca se enlaza con la API) y produce un WAV temporal que
 * se codifica a MP3 64 kbps mono 44,1 kHz con `lame` (o `ffmpeg` si es lo que hay). El texto nunca sale
 * del servidor. Cola con `maxParallel` síntesis simultáneas y tiempo máximo por narración.
 */
@Injectable()
export class TtsService {
  private readonly log = new Logger(TtsService.name);
  private readonly cfg: TtsConfig;
  private running = 0;
  private readonly waiting: Array<() => void> = [];
  private encoderCache: { bin: string; kind: 'lame' | 'ffmpeg' } | null | undefined;

  private readonly runner: ProcessRunner;

  constructor(@Inject(APP_CONFIG) appConfig: AppConfig, @Optional() @Inject(TTS_RUNNER) runner?: ProcessRunner) {
    this.cfg = appConfig.tts;
    this.runner = runner ?? SPAWN_RUNNER;
  }

  /** Comprobación barata (sin lanzar Piper): binario ejecutable, modelo y su `.onnx.json`, codificador MP3. */
  async status(): Promise<TtsStatus> {
    const base = { enabled: this.cfg.enabled, engine: this.cfg.engine, voice: path.basename(this.cfg.voice, '.onnx') };
    if (!this.cfg.enabled) return { ...base, ok: false, detail: 'desactivada por configuración (TTS_ENABLED=false)' };
    if (this.cfg.engine !== 'piper') return { ...base, ok: false, detail: `motor no soportado: ${this.cfg.engine}` };
    if (!(await executable(this.cfg.piperBin))) return { ...base, ok: false, detail: `binario de Piper no encontrado (${this.cfg.piperBin})` };
    if (!(await readable(this.cfg.voice))) return { ...base, ok: false, detail: `modelo de voz no encontrado (${this.cfg.voice})` };
    if (!(await readable(`${this.cfg.voice}.json`))) return { ...base, ok: false, detail: 'falta el archivo .onnx.json de la voz' };
    const enc = await this.encoder();
    if (!enc) return { ...base, ok: false, detail: 'no hay codificador MP3 (lame o ffmpeg)' };
    return { ...base, ok: true, detail: null };
  }

  /** Texto → MP3 en memoria. Lanza TtsUnavailableError (503) o InternalServerErrorException (500). */
  async synthesize(text: string, opts: SynthesizeOptions = {}): Promise<SynthesisResult> {
    const st = await this.status();
    if (!st.ok) throw new TtsUnavailableError(st.detail ?? 'motor no disponible');
    const chunks = chunkText(text);
    if (chunks.length === 0) throw new InternalServerErrorException('No hay texto para narrar');
    const encoder = (await this.encoder())!;
    await this.acquire();
    const started = Date.now();
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'macondo-tts-'));
    try {
      const wav = path.join(dir, `${randomUUID()}.wav`);
      const mp3 = path.join(dir, `${randomUUID()}.mp3`);
      const args = ['-m', this.cfg.voice, '-f', wav, '--sentence-silence', String(opts.sentenceSilence ?? 0.35)];
      if (opts.lengthScale !== undefined) args.push('--length-scale', String(opts.lengthScale));
      const piper = await this.runner.run(this.cfg.piperBin, args, { stdin: chunks.join('\n') + '\n', timeoutMs: this.cfg.timeoutMs });
      if (piper.timedOut) throw new InternalServerErrorException('La narración tardó demasiado y se canceló');
      if (piper.code !== 0) {
        this.log.error(`piper terminó con código ${piper.code}: ${piper.stderr.slice(-800)}`);
        throw new InternalServerErrorException('La síntesis de voz falló (ver registro del servidor)');
      }
      const durationSeconds = await this.wavDuration(wav);
      if (durationSeconds === null || durationSeconds <= 0) throw new InternalServerErrorException('Piper no produjo audio');
      const encArgs = encoder.kind === 'lame'
        ? ['--quiet', '-b', '64', '-m', 'm', '--resample', '44.1', '--add-id3v2', '--tt', opts.title ?? 'Narración', '--ta', 'Biblioteca Macondo', '--tg', 'Speech', wav, mp3]
        : ['-v', 'error', '-y', '-i', wav, '-ac', '1', '-ar', '44100', '-c:a', 'libmp3lame', '-b:a', '64k', '-id3v2_version', '3',
          '-metadata', `title=${opts.title ?? 'Narración'}`, '-metadata', 'artist=Biblioteca Macondo', '-metadata', 'genre=Speech', mp3];
      const remaining = Math.max(10_000, this.cfg.timeoutMs - (Date.now() - started));
      const enc = await this.runner.run(encoder.bin, encArgs, { timeoutMs: remaining });
      if (enc.timedOut || enc.code !== 0) {
        this.log.error(`${encoder.kind} terminó con código ${enc.code}: ${enc.stderr.slice(-800)}`);
        throw new InternalServerErrorException('La codificación MP3 falló (ver registro del servidor)');
      }
      const buf = await fs.readFile(mp3);
      if (buf.length < 100) throw new InternalServerErrorException('El MP3 generado está vacío');
      const elapsedMs = Date.now() - started;
      this.log.log(`Narración: ${chunks.join(' ').length} caracteres → ${durationSeconds.toFixed(1)} s de audio en ${elapsedMs} ms (${chunks.length} trozos)`);
      return { mp3: buf, durationSeconds, chars: chunks.join(' ').length, chunks: chunks.length, elapsedMs };
    } finally {
      this.release();
      await fs.rm(dir, { recursive: true, force: true }).catch(() => undefined);
    }
  }

  private async wavDuration(file: string): Promise<number | null> {
    const fh = await fs.open(file, 'r');
    try {
      const { size } = await fh.stat();
      const head = Buffer.alloc(Math.min(4096, size));
      const { bytesRead } = await fh.read(head, 0, head.length, 0);
      return wavDurationSeconds(head.subarray(0, bytesRead), size);
    } finally {
      await fh.close();
    }
  }

  /** Codificador MP3: TTS_MP3_BIN explícito (lame o ffmpeg según el nombre) o el primero en PATH. */
  private async encoder(): Promise<{ bin: string; kind: 'lame' | 'ffmpeg' } | null> {
    if (this.encoderCache !== undefined) return this.encoderCache;
    let found: { bin: string; kind: 'lame' | 'ffmpeg' } | null = null;
    if (this.cfg.mp3Bin) {
      const kind = path.basename(this.cfg.mp3Bin).toLowerCase().includes('ffmpeg') ? 'ffmpeg' : 'lame';
      found = (await executable(this.cfg.mp3Bin)) ? { bin: this.cfg.mp3Bin, kind } : null;
    } else {
      const lame = await whichBin('lame');
      const ffmpeg = lame ? null : await whichBin('ffmpeg');
      found = lame ? { bin: lame, kind: 'lame' } : ffmpeg ? { bin: ffmpeg, kind: 'ffmpeg' } : null;
    }
    // Solo se cachea el hallazgo positivo: si instalan el codificador después, se detecta sin reiniciar.
    if (found) this.encoderCache = found;
    return found;
  }

  private acquire(): Promise<void> {
    if (this.running < this.cfg.maxParallel) {
      this.running += 1;
      return Promise.resolve();
    }
    return new Promise((resolve) => this.waiting.push(() => { this.running += 1; resolve(); }));
  }
  private release(): void {
    this.running -= 1;
    const next = this.waiting.shift();
    if (next) next();
  }

  /** Para pruebas: síntesis en curso y en espera. */
  get load(): { running: number; waiting: number } {
    return { running: this.running, waiting: this.waiting.length };
  }
}
