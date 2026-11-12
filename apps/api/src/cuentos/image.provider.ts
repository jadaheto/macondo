import { Logger } from '@nestjs/common';
import type { ImagenesConfig } from '../config/env';

/** Token de inyección del proveedor de imágenes (pruebas: proveedor falso). */
export const IMAGE_PROVIDER = Symbol('IMAGE_PROVIDER');

export interface ImageRequest {
  /** Descripción en inglés construida SOLO con opciones cerradas (ver prompt.ts → imagePrompt). */
  prompt: string;
  width: number;
  height: number;
  /** Semilla estable por cuento (misma entrada → misma imagen si se repite). */
  seed: number;
}
export interface ImageResponse {
  /** Bytes de la imagen tal como llegó (JPEG/PNG/WebP); el servicio la normaliza a JPEG. */
  data: Buffer;
  ms: number;
  provider: string;
}

/**
 * Proveedor de texto→imagen. `available()` es barato (sin red). `generate` lanza `ImageUnavailableError` cuando
 * el proveedor no responde (red, 429, 5xx, tiempo agotado): el cuento sigue sin ilustración, con portada tipográfica.
 * Contrato de privacidad: el prompt nunca lleva el nombre del niño ni el texto del cuento.
 */
export interface ImageProvider {
  readonly name: string;
  available(): boolean;
  generate(req: ImageRequest): Promise<ImageResponse>;
}

export class ImageUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ImageUnavailableError';
  }
}

export class NoImageProvider implements ImageProvider {
  readonly name = 'none';
  available(): boolean { return false; }
  async generate(): Promise<ImageResponse> { throw new ImageUnavailableError('sin proveedor de imágenes'); }
}

async function fetchImage(fetchImpl: typeof fetch, url: string, init: RequestInit, timeoutMs: number, provider: string): Promise<ImageResponse> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  const started = Date.now();
  let res: Response;
  try {
    res = await fetchImpl(url, { ...init, signal: ctrl.signal });
  } catch (e) {
    clearTimeout(timer);
    const msg = (e as Error)?.name === 'AbortError' ? `tiempo agotado (${timeoutMs} ms)` : ((e as Error)?.message ?? String(e));
    throw new ImageUnavailableError(`${provider}: ${msg}`);
  }
  try {
    if (!res.ok) throw new ImageUnavailableError(`${provider}: HTTP ${res.status}`);
    const type = res.headers.get('content-type') ?? '';
    const data = Buffer.from(await res.arrayBuffer());
    if (!type.startsWith('image/') || data.length < 4_000) throw new ImageUnavailableError(`${provider}: respuesta no es una imagen (${type || 'sin tipo'}, ${data.length} B)`);
    return { data, ms: Date.now() - started, provider };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Pollinations.ai (FLUX), gratuito y sin clave: GET /prompt/<texto>?model=flux&width&height&seed&nologo=true&safe=true.
 * Anónimo: ~1 petición cada 15 s por IP (el servicio encola con `intervaloMs`). Con token registrado, más holgado y sin marca.
 */
export class PollinationsProvider implements ImageProvider {
  readonly name = 'pollinations';
  constructor(private readonly cfg: Pick<ImagenesConfig, 'pollinationsUrl' | 'pollinationsToken' | 'timeoutMs'>, private readonly fetchImpl: typeof fetch = fetch) {}

  available(): boolean { return true; }

  async generate(req: ImageRequest): Promise<ImageResponse> {
    const q = new URLSearchParams({ model: 'flux', width: String(req.width), height: String(req.height), seed: String(req.seed), nologo: 'true', safe: 'true', enhance: 'false' });
    const base = this.cfg.pollinationsUrl.endsWith('/') ? this.cfg.pollinationsUrl : `${this.cfg.pollinationsUrl}/`;
    const url = `${base}${encodeURIComponent(req.prompt)}?${q}`;
    const headers: Record<string, string> = { Accept: 'image/jpeg,image/*' };
    if (this.cfg.pollinationsToken) headers.Authorization = `Bearer ${this.cfg.pollinationsToken}`;
    return fetchImage(this.fetchImpl, url, { method: 'GET', headers }, this.cfg.timeoutMs, this.name);
  }
}

/**
 * Hugging Face Inference Providers (de pago por imagen; token obligatorio). POST { inputs } → bytes de imagen.
 * La URL se configura (IMAGENES_HF_URL) porque los modelos disponibles cambian; por defecto FLUX.1-schnell.
 */
export class HuggingFaceProvider implements ImageProvider {
  readonly name = 'huggingface';
  private readonly log = new Logger(HuggingFaceProvider.name);
  constructor(private readonly cfg: Pick<ImagenesConfig, 'huggingfaceUrl' | 'huggingfaceToken' | 'timeoutMs'>, private readonly fetchImpl: typeof fetch = fetch) {}

  available(): boolean { return this.cfg.huggingfaceToken.length > 0; }

  async generate(req: ImageRequest): Promise<ImageResponse> {
    if (!this.available()) throw new ImageUnavailableError('sin token de Hugging Face (HUGGINGFACE_TOKEN)');
    const body = JSON.stringify({ inputs: req.prompt, parameters: { width: req.width, height: req.height, seed: req.seed, num_inference_steps: 4 } });
    try {
      return await fetchImage(this.fetchImpl, this.cfg.huggingfaceUrl, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'image/jpeg,image/png,image/*', Authorization: `Bearer ${this.cfg.huggingfaceToken}` }, body,
      }, this.cfg.timeoutMs, this.name);
    } catch (e) {
      // Nunca registrar cabeceras ni el token; solo el motivo.
      this.log.warn(`Hugging Face no disponible: ${(e as Error).message}`);
      throw e;
    }
  }
}

/**
 * Cola de una sola fila con separación mínima entre peticiones: evita el 429 de Pollinations cuando varias
 * tablets terminan un cuento a la vez. Las imágenes salen en orden de llegada.
 */
export class ImageQueue {
  private chain: Promise<unknown> = Promise.resolve();
  private lastStart = 0;
  constructor(private readonly intervaloMs: number) {}

  run<T>(task: () => Promise<T>): Promise<T> {
    const next = this.chain.then(async () => {
      const wait = this.lastStart + this.intervaloMs - Date.now();
      if (wait > 0) await new Promise((r) => setTimeout(r, wait));
      this.lastStart = Date.now();
      return task();
    });
    this.chain = next.catch(() => undefined);
    return next;
  }
}
