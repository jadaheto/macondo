import * as path from 'node:path';
import * as dotenv from 'dotenv';

/** Raíz de apps/api (funciona desde src/ y desde dist/). */
export const API_ROOT = path.resolve(__dirname, '..', '..');
export const REPO_ROOT = path.resolve(API_ROOT, '..', '..');

let loaded = false;
/** Carga el .env de la raíz del monorepo. No sobrescribe variables ya definidas. */
export function loadEnv(): void {
  if (loaded) return;
  dotenv.config({ path: path.resolve(REPO_ROOT, '.env') });
  loaded = true;
}

export interface AppConfig {
  port: number;
  jwtSecret: string;
  jwtExpiresIn: string;
  storageDriver: string;
  storageDir: string;
  maxUploadBytes: number;
  maxCoverBytes: number;
  corsOrigins: string[];
  loginThrottleLimit: number;
  loginThrottleTtlMs: number;
  /** Narración sintética en el servidor (ADR-017). Sin binario → el servicio responde 503, nunca rompe el arranque. */
  tts: TtsConfig;
  /** Taller de cuentos (ADR-018). Sin clave de DeepSeek → modo plantilla; nunca rompe el arranque. */
  cuentos: CuentosConfig;
}

export interface CuentosConfig {
  enabled: boolean;
  /** Bandas que ven el taller (CUENTOS_BANDAS=1-3,4-5). */
  bandas: string[];
  /** Cuentos por dispositivo y hora (hash del id de dispositivo; sin IP). */
  limitePorHora: number;
  /** Tope global por hora (todos los dispositivos). */
  limiteGlobalPorHora: number;
  /** Clave del proveedor: NUNCA se registra ni se expone. Vacía = modo plantilla. */
  deepseekApiKey: string;
  deepseekModel: string;
  deepseekUrl: string;
  /** Tiempo máximo por petición al proveedor (ms). */
  timeoutMs: number;
  /** Narrar automáticamente el cuento con la voz de la biblioteca (ADR-017) si el motor está disponible. */
  audio: boolean;
  /** Ilustración con IA (ADR-020). */
  imagenes: ImagenesConfig;
}

export interface ImagenesConfig {
  /** CUENTOS_IMAGENES=false desactiva la ilustración (el cuento sigue con portada tipográfica). */
  enabled: boolean;
  /** IMAGENES_PROVEEDOR: pollinations (gratuito, por defecto) | huggingface (de pago, con token) | none. */
  proveedor: 'pollinations' | 'huggingface' | 'none';
  /** Pollinations: URL base; `nologo`/`safe` se añaden siempre. Sin clave (anónimo) o con IMAGENES_POLLINATIONS_TOKEN. */
  pollinationsUrl: string;
  pollinationsToken: string;
  /** Hugging Face Inference Providers: URL del modelo de texto→imagen y token (nunca se registran). */
  huggingfaceUrl: string;
  huggingfaceToken: string;
  /** Tiempo máximo por imagen (ms) y separación mínima entre peticiones (ms; Pollinations anónimo limita a 1 cada ~15 s). */
  timeoutMs: number;
  intervaloMs: number;
}

export interface TtsConfig {
  enabled: boolean;
  engine: string;
  /** Ejecutable de Piper (venv aparte; GPL-3 como proceso independiente, nunca enlazado). */
  piperBin: string;
  /** Ruta al modelo `.onnx` (el `.onnx.json` debe estar al lado). */
  voice: string;
  /** Codificador MP3: ruta a `lame` o `ffmpeg`; vacío = buscar ambos en PATH (primero lame). */
  mp3Bin: string;
  /** Tiempo máximo de una síntesis completa (ms). */
  timeoutMs: number;
  /** Narraciones simultáneas (el resto espera en cola). */
  maxParallel: number;
}

export const APP_CONFIG = Symbol('APP_CONFIG');

function int(v: string | undefined, def: number): number {
  const n = Number.parseInt(v ?? '', 10);
  return Number.isFinite(n) && n > 0 ? n : def;
}

export function readConfig(): AppConfig {
  loadEnv();
  const env = process.env;
  const jwtSecret = env.JWT_SECRET ?? '';
  if (jwtSecret.length < 32) {
    throw new Error('JWT_SECRET debe tener al menos 32 caracteres');
  }
  const maxUploadMb = int(env.MAX_UPLOAD_MB, 200);
  return {
    port: int(env.API_PORT ?? env.PORT, 4100),
    jwtSecret,
    jwtExpiresIn: '8h',
    storageDriver: env.STORAGE_DRIVER ?? 'local',
    storageDir: path.resolve(API_ROOT, env.STORAGE_DIR ?? '../../storage'),
    maxUploadBytes: maxUploadMb * 1024 * 1024,
    maxCoverBytes: Math.min(maxUploadMb, 10) * 1024 * 1024,
    corsOrigins: (env.CORS_ORIGIN ?? 'http://localhost:3100').split(',').map((s) => s.trim()).filter(Boolean),
    loginThrottleLimit: int(env.LOGIN_THROTTLE_LIMIT, 10),
    loginThrottleTtlMs: int(env.LOGIN_THROTTLE_TTL_MS, 60_000),
    tts: {
      enabled: (env.TTS_ENABLED ?? 'true').toLowerCase() !== 'false',
      engine: env.TTS_ENGINE ?? 'piper',
      piperBin: env.TTS_PIPER_BIN ?? '/opt/piper-venv/bin/piper',
      voice: env.TTS_VOICE ?? '/opt/piper/voices/es_ES-davefx-medium.onnx',
      mp3Bin: env.TTS_MP3_BIN ?? '',
      timeoutMs: int(env.TTS_TIMEOUT_MS, 600_000),
      maxParallel: Math.min(int(env.TTS_MAX_PARALLEL, 2), 8),
    },
    cuentos: {
      enabled: (env.CUENTOS_ENABLED ?? 'true').toLowerCase() !== 'false',
      bandas: (env.CUENTOS_BANDAS ?? '1-3,4-5').split(',').map((s) => s.trim()).filter(Boolean),
      limitePorHora: int(env.CUENTOS_LIMITE_POR_HORA, 3),
      limiteGlobalPorHora: int(env.CUENTOS_LIMITE_GLOBAL_POR_HORA, 60),
      deepseekApiKey: (env.DEEPSEEK_API_KEY ?? '').trim(),
      deepseekModel: env.DEEPSEEK_MODEL?.trim() || 'deepseek-chat',
      deepseekUrl: env.DEEPSEEK_URL?.trim() || 'https://api.deepseek.com/chat/completions',
      timeoutMs: int(env.CUENTOS_TIMEOUT_MS, 60_000),
      audio: (env.CUENTOS_AUDIO ?? 'true').toLowerCase() !== 'false',
      imagenes: {
        enabled: (env.CUENTOS_IMAGENES ?? 'true').toLowerCase() !== 'false',
        proveedor: (['pollinations', 'huggingface', 'none'] as const).find((p) => p === (env.IMAGENES_PROVEEDOR ?? 'pollinations').trim().toLowerCase()) ?? 'pollinations',
        pollinationsUrl: env.IMAGENES_POLLINATIONS_URL?.trim() || 'https://image.pollinations.ai/prompt/',
        pollinationsToken: (env.IMAGENES_POLLINATIONS_TOKEN ?? '').trim(),
        huggingfaceUrl: env.IMAGENES_HF_URL?.trim() || 'https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell',
        huggingfaceToken: (env.HUGGINGFACE_TOKEN ?? env.HF_TOKEN ?? '').trim(),
        timeoutMs: int(env.IMAGENES_TIMEOUT_MS, 90_000),
        intervaloMs: int(env.IMAGENES_INTERVALO_MS, 15_000),
      },
    },
  };
}
