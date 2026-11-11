import { Logger } from '@nestjs/common';
import type { CuentosConfig } from '../config/env';

/** Token de inyección del proveedor de lenguaje (pruebas: proveedor falso). */
export const LLM_PROVIDER = Symbol('LLM_PROVIDER');

export interface LlmRequest {
  system: string;
  user: string;
  temperature: number;
  maxTokens: number;
}
export interface LlmResponse {
  /** Texto crudo devuelto por el modelo (se espera JSON). */
  text: string;
  /** Latencia de la llamada (ms). */
  ms: number;
  usage: { prompt: number | null; completion: number | null };
  model: string | null;
}

/**
 * Proveedor de texto. `available()` es barato (sin red). `generate` lanza `LlmUnavailableError` si el
 * proveedor no responde (red, DNS, tiempo agotado, 5xx, clave inválida): el servicio pasa a modo plantilla.
 * Contrato de privacidad: el `user` prompt solo lleva opciones cerradas y el nombre del protagonista.
 */
export interface LlmProvider {
  readonly name: string;
  available(): boolean;
  generate(req: LlmRequest): Promise<LlmResponse>;
}

export class LlmUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LlmUnavailableError';
  }
}

interface ChatCompletion {
  choices?: Array<{ message?: { content?: string | null } }>;
  usage?: { prompt_tokens?: number; completion_tokens?: number };
  model?: string;
}

/**
 * DeepSeek (Chat Completions compatible con OpenAI). La clave viaja solo en la cabecera Authorization y
 * NUNCA se registra. Tiempo máximo configurable (60 s por defecto). `response_format: json_object`.
 */
export class DeepSeekProvider implements LlmProvider {
  readonly name = 'deepseek';
  private readonly log = new Logger(DeepSeekProvider.name);

  constructor(private readonly cfg: Pick<CuentosConfig, 'deepseekApiKey' | 'deepseekModel' | 'deepseekUrl' | 'timeoutMs'>, private readonly fetchImpl: typeof fetch = fetch) {}

  available(): boolean {
    return this.cfg.deepseekApiKey.length > 0;
  }

  async generate(req: LlmRequest): Promise<LlmResponse> {
    if (!this.available()) throw new LlmUnavailableError('sin clave de DeepSeek (DEEPSEEK_API_KEY)');
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), this.cfg.timeoutMs);
    const started = Date.now();
    let res: Response;
    try {
      res = await this.fetchImpl(this.cfg.deepseekUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.cfg.deepseekApiKey}` },
        body: JSON.stringify({
          model: this.cfg.deepseekModel,
          messages: [{ role: 'system', content: req.system }, { role: 'user', content: req.user }],
          temperature: req.temperature,
          max_tokens: req.maxTokens,
          response_format: { type: 'json_object' },
          stream: false,
        }),
        signal: ctrl.signal,
      });
    } catch (e) {
      clearTimeout(timer);
      const ms = Date.now() - started;
      // Red/DNS/tiempo agotado: nunca se registran la clave ni el prompt (contiene el nombre del protagonista).
      const reason = ctrl.signal.aborted ? `tiempo agotado (${this.cfg.timeoutMs} ms)` : `error de red (${(e as Error)?.name ?? 'desconocido'})`;
      this.log.warn(`DeepSeek no disponible tras ${ms} ms: ${reason}`);
      throw new LlmUnavailableError(reason);
    }
    clearTimeout(timer);
    const ms = Date.now() - started;
    if (!res.ok) {
      // El cuerpo de error puede incluir eco de la petición: no se registra.
      this.log.warn(`DeepSeek respondió HTTP ${res.status} en ${ms} ms`);
      throw new LlmUnavailableError(`HTTP ${res.status}`);
    }
    let body: ChatCompletion;
    try {
      body = (await res.json()) as ChatCompletion;
    } catch {
      throw new LlmUnavailableError('respuesta no es JSON');
    }
    const text = body.choices?.[0]?.message?.content ?? '';
    const usage = { prompt: body.usage?.prompt_tokens ?? null, completion: body.usage?.completion_tokens ?? null };
    this.log.log(`DeepSeek ${body.model ?? this.cfg.deepseekModel}: ${ms} ms, tokens entrada=${usage.prompt ?? '?'} salida=${usage.completion ?? '?'}`);
    return { text, ms, usage, model: body.model ?? null };
  }
}

/** Proveedor nulo: siempre «no disponible» (sin clave). El servicio usa la plantilla. */
export class NoLlmProvider implements LlmProvider {
  readonly name = 'ninguno';
  available(): boolean {
    return false;
  }
  generate(): Promise<LlmResponse> {
    return Promise.reject(new LlmUnavailableError('proveedor de IA no configurado'));
  }
}
