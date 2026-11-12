/**
 * Taller de cuentos (ADR-018), unitarias sin red ni BD: plantilla (64 combinaciones × 2 bandas), controles de
 * contenido, EPUB, proveedor DeepSeek con fetch simulado y `generarTexto` con proveedores falsos.
 */
import { CUENTO_LUGARES, CUENTO_TIPOS, CUENTO_VALORES, CuentoGeneradoSchema, cuentoCoverSvg, cuentoPalabras, cuentoTituloLineas } from '@macondo/shared';
import { describe, expect, it } from 'vitest';
import type { AppConfig } from '../src/config/env';
import { CuentosService } from '../src/cuentos/cuentos.service';
import { buildCuentoEpub, textoNarracion, writeZip, zipNames } from '../src/cuentos/epub';
import { DeepSeekProvider, type LlmProvider, type LlmRequest, LlmUnavailableError, NoLlmProvider } from '../src/cuentos/llm.provider';
import { generarPlantilla } from '../src/cuentos/plantilla';
import { SYSTEM_PROMPT, userPrompt, userPromptEstricto } from '../src/cuentos/prompt';
import { extraerJson, palabraVetada, proporcionEspanol, validarCuento, validarNombre } from '../src/cuentos/safety';

const base = { banda: '1-3' as const, protagonista: 'Lía', tipo: 'nino' as const, lugar: 'covenas' as const, valor: 'amistad' as const };

function cfg(over: Partial<AppConfig['cuentos']> = {}): AppConfig {
  return {
    cuentos: { enabled: true, bandas: ['1-3', '4-5'], limitePorHora: 3, limiteGlobalPorHora: 60, deepseekApiKey: '', deepseekModel: 'deepseek-chat', deepseekUrl: 'https://api.deepseek.com/chat/completions', timeoutMs: 1000, audio: false, ...over },
  } as AppConfig;
}

/** Proveedor falso: responde con los textos indicados en orden; `null` = no disponible. */
function fakeLlm(respuestas: Array<string | Error>, available = true): LlmProvider & { calls: LlmRequest[] } {
  const calls: LlmRequest[] = [];
  return {
    name: 'falso',
    calls,
    available: () => available,
    async generate(req) {
      calls.push(req);
      const r = respuestas.shift();
      if (r === undefined) throw new Error('sin más respuestas');
      if (r instanceof Error) throw r;
      return { text: r, ms: 12, usage: { prompt: 100, completion: 200 }, model: 'falso' };
    },
  };
}

function cuentoValido(over: Record<string, unknown> = {}) {
  const c = generarPlantilla(base);
  return JSON.stringify({ ...c, ...over });
}

describe('plantilla: 4 × 4 × 4 combinaciones en las dos bandas', () => {
  it('todas producen un cuento válido que pasa los controles y nombra al protagonista', () => {
    let n = 0;
    for (const banda of ['1-3', '4-5'] as const) {
      for (const tipo of CUENTO_TIPOS) for (const lugar of CUENTO_LUGARES) for (const valor of CUENTO_VALORES) {
        const c = generarPlantilla({ banda, protagonista: 'Yuleidis', tipo, lugar, valor });
        expect(CuentoGeneradoSchema.safeParse(c).success).toBe(true);
        const v = validarCuento(c, banda, 'Yuleidis');
        expect(v.motivos, `${banda} ${tipo}/${lugar}/${valor}`).toEqual([]);
        expect(c.parrafos.join(' ')).toContain('Yuleidis');
        expect(c.preguntas).toHaveLength(3);
        expect(c.glosario.length).toBeGreaterThanOrEqual(2);
        n++;
      }
    }
    expect(n).toBe(128);
  });
  it('1-3 ronda las 250 palabras y 4-5 es más largo; es determinista', () => {
    const corto = generarPlantilla(base);
    const largo = generarPlantilla({ ...base, banda: '4-5' });
    expect(cuentoPalabras(corto)).toBeGreaterThanOrEqual(180);
    expect(cuentoPalabras(corto)).toBeLessThanOrEqual(330);
    expect(cuentoPalabras(largo)).toBeGreaterThan(cuentoPalabras(corto));
    expect(generarPlantilla(base)).toEqual(corto);
  });
});

describe('controles de contenido', () => {
  it('lista de bloqueo: palabra completa, sin tildes ni mayúsculas', () => {
    expect(palabraVetada('Un cuento tranquilo del mar')).toBeNull();
    expect(palabraVetada('era un MALPARIDO')).toBe('malparido');
    expect(palabraVetada('tomó Coca-Cola')).toBe('coca-cola');
    expect(palabraVetada('la puta')).toBe('puta');
    expect(palabraVetada('computadora')).toBeNull(); // «puta» no está como palabra completa
  });
  it('nombres: formato, repeticiones y bloqueo', () => {
    expect(validarNombre('Lía')).toBeNull();
    expect(validarNombre("Mar'ia-José")).toBeNull();
    expect(validarNombre('L')).toMatch(/entre 2 y 30/);
    expect(validarNombre('Lía123')).toMatch(/letras/);
    expect(validarNombre('<script>')).toMatch(/letras/);
    expect(validarNombre('aaaaaa')).toMatch(/no parece real/);
    expect(validarNombre('Puta')).toMatch(/no se puede usar/);
    expect(validarNombre('Mal parido')).toMatch(/no se puede usar/);
  });
  it('heurística de español', () => {
    expect(proporcionEspanol('El zorro corrió por la playa y encontró a su amigo en la arena.')).toBeGreaterThan(0.2);
    expect(proporcionEspanol('The fox ran across the beach and found his friend in the sand.')).toBeLessThan(0.12);
  });
  it('validarCuento: longitud, idioma, bloqueo, protagonista, opciones repetidas', () => {
    const ok = generarPlantilla(base);
    expect(validarCuento(ok, '1-3', 'Lía').ok).toBe(true);
    expect(validarCuento(ok, '4-5', 'Lía').motivos.join()).toMatch(/muy corto/);
    expect(validarCuento({ ...ok, parrafos: ok.parrafos.map((p) => p.replaceAll('Lía', 'Juan')) }, '1-3', 'Lía').motivos.join()).toMatch(/no menciona/);
    expect(validarCuento({ ...ok, parrafos: [...ok.parrafos, 'Y entonces llegó la pistola.'] }, '1-3', 'Lía').motivos.join()).toMatch(/no permitida/);
    const q = ok.preguntas.map((x) => ({ ...x }));
    q[0] = { ...q[0]!, opciones: ['Igual', 'igual', 'Otra'] };
    expect(validarCuento({ ...ok, preguntas: q as typeof ok.preguntas }, '1-3', 'Lía').motivos.join()).toMatch(/repite opciones/);
    const en = { ...ok, parrafos: Array(6).fill('Lía and the fox ran across the beach and found the friend in the sand with the crabs and the boats of the fishermen and the sun was warm and the sea was green and everything was fine and good.') };
    expect(validarCuento(en, '1-3', 'Lía').motivos.join()).toMatch(/español/);
  });
  it('extraerJson tolera vallas y texto alrededor', () => {
    expect(extraerJson('Aquí va:\n```json\n{"a":1}\n```\nListo')).toEqual({ a: 1 });
    expect(extraerJson('sin json')).toBeNull();
    expect(extraerJson('{"a":')).toBeNull();
  });
});

describe('prompts: privacidad', () => {
  it('solo llevan opciones cerradas y el nombre del protagonista; el sistema exige JSON y reglas de contenido', () => {
    const u = userPrompt({ ...base, protagonista: 'Lía' });
    expect(u).toContain('«Lía»');
    expect(u).toContain('Coveñas');
    expect(u).toMatch(/180 y 320 palabras/);
    expect(SYSTEM_PROMPT).toMatch(/ÚNICAMENTE con un objeto JSON/);
    expect(SYSTEM_PROMPT).toMatch(/Nada de violencia/);
    expect(userPromptEstricto(base, ['muy corto'])).toContain('muy corto');
    // No hay forma de pasar el nombre del autor: la firma no lo admite.
    expect(userPrompt.length).toBe(1);
  });
});

describe('EPUB y portada', () => {
  it('ZIP válido: mimetype primero y sin comprimir; archivos esperados; determinista', () => {
    const c = generarPlantilla(base);
    const epub = buildCuentoEpub({ id: 'abc', titulo: c.titulo, autorLinea: 'Escrito por Lía con ayuda del taller', creator: 'Lía (Taller de cuentos)', contenido: c, banda: '1-3', cover: { data: Buffer.from('89504e470d0a1a0a', 'hex'), mime: 'image/png' }, fecha: '2026-11-05' });
    expect(epub.subarray(0, 4)).toEqual(Buffer.from([0x50, 0x4b, 0x03, 0x04]));
    expect(epub.subarray(30, 38).toString()).toBe('mimetype');
    expect(epub.readUInt16LE(8)).toBe(0); // STORE
    expect(epub.subarray(38, 58).toString()).toBe('application/epub+zip');
    const names = zipNames(epub);
    expect(names[0]).toBe('mimetype');
    expect(names).toEqual(expect.arrayContaining(['META-INF/container.xml', 'OEBPS/content.opf', 'OEBPS/nav.xhtml', 'OEBPS/toc.ncx', 'OEBPS/cuento.xhtml', 'OEBPS/actividades.xhtml', 'OEBPS/creditos.xhtml', 'OEBPS/portada.xhtml', 'OEBPS/img/portada.png', 'OEBPS/css/estilo.css']));
    const again = buildCuentoEpub({ id: 'abc', titulo: c.titulo, autorLinea: 'Escrito por Lía con ayuda del taller', creator: 'Lía (Taller de cuentos)', contenido: c, banda: '1-3', cover: { data: Buffer.from('89504e470d0a1a0a', 'hex'), mime: 'image/png' }, fecha: '2026-11-05' });
    expect(again.equals(epub)).toBe(true);
    const sinPortada = buildCuentoEpub({ id: 'abc', titulo: c.titulo, autorLinea: 'x', creator: 'y', contenido: c, banda: '4-5', cover: null, fecha: '2026-11-05' });
    expect(zipNames(sinPortada)).not.toContain('OEBPS/portada.xhtml');
  });
  it('writeZip escapa correctamente y textoNarracion une título y párrafos', () => {
    const z = writeZip([{ name: 'a/ñ.txt', data: Buffer.from('hola') }]);
    expect(zipNames(z)).toEqual(['a/ñ.txt']);
    const c = generarPlantilla(base);
    expect(textoNarracion('T', c).startsWith('T\n\n')).toBe(true);
  });
  it('portada SVG: título por líneas, autor y sin emoji para el servidor', () => {
    expect(cuentoTituloLineas('Un paso valiente en playa de Coveñas: Lía')).toEqual(['Un paso valiente', 'en playa de', 'Coveñas: Lía']);
    const svg = cuentoCoverSvg({ titulo: 'Lía & los cangrejos', autorNombre: 'Lía', lugar: 'covenas', tipo: 'nino' });
    expect(svg).toContain('Lía &amp; los');
    expect(svg).toContain('Escrito por Lía');
    expect(svg).toContain('👧');
    expect(cuentoCoverSvg({ titulo: 'T', autorNombre: null, lugar: 'espacio', tipo: 'robot', conEmoji: false })).not.toContain('🤖');
  });
});

describe('DeepSeekProvider con fetch simulado', () => {
  const c = cfg({ deepseekApiKey: 'sk-prueba-secreta', timeoutMs: 200 });
  it('envía JSON mode y la clave solo en Authorization; devuelve texto, latencia y tokens', async () => {
    let seen: { url: string; init: RequestInit } | null = null;
    const fetchImpl = (async (url: string | URL | Request, init?: RequestInit) => {
      seen = { url: String(url), init: init! };
      return new Response(JSON.stringify({ model: 'deepseek-flash', choices: [{ message: { content: '{"ok":true}' } }], usage: { prompt_tokens: 10, completion_tokens: 5 } }), { status: 200 });
    }) as typeof fetch;
    const p = new DeepSeekProvider(c.cuentos, fetchImpl);
    expect(p.available()).toBe(true);
    const r = await p.generate({ system: 's', user: 'u', temperature: 0.8, maxTokens: 100 });
    expect(r.text).toBe('{"ok":true}');
    expect(r.usage).toEqual({ prompt: 10, completion: 5 });
    expect(r.model).toBe('deepseek-flash');
    const body = JSON.parse(String(seen!.init.body));
    expect(body.response_format).toEqual({ type: 'json_object' });
    expect(body.messages).toEqual([{ role: 'system', content: 's' }, { role: 'user', content: 'u' }]);
    expect(JSON.stringify(body)).not.toContain('sk-prueba');
    expect((seen!.init.headers as Record<string, string>).Authorization).toBe('Bearer sk-prueba-secreta');
  });
  it('error de red, HTTP 401/500 y tiempo agotado → LlmUnavailableError (mensaje sin clave)', async () => {
    const red = new DeepSeekProvider(c.cuentos, (async () => { throw new TypeError('fetch failed: getaddrinfo ENOTFOUND'); }) as typeof fetch);
    await expect(red.generate({ system: 's', user: 'u', temperature: 0.8, maxTokens: 10 })).rejects.toBeInstanceOf(LlmUnavailableError);
    const http = new DeepSeekProvider(c.cuentos, (async () => new Response('{"error":"bad key sk-prueba-secreta"}', { status: 401 })) as typeof fetch);
    await expect(http.generate({ system: 's', user: 'u', temperature: 0.8, maxTokens: 10 })).rejects.toThrow(/HTTP 401/);
    const lento = new DeepSeekProvider(c.cuentos, ((_: unknown, init?: RequestInit) => new Promise((_res, rej) => init!.signal!.addEventListener('abort', () => rej(new Error('aborted'))))) as typeof fetch);
    await expect(lento.generate({ system: 's', user: 'u', temperature: 0.8, maxTokens: 10 })).rejects.toThrow(/tiempo agotado/);
    expect(new DeepSeekProvider(cfg().cuentos).available()).toBe(false);
    expect(new NoLlmProvider().available()).toBe(false);
  });
});

describe('CuentosService.generarTexto (sin BD)', () => {
  const svc = (llm: LlmProvider) => new CuentosService(null as never, null as never, null as never, null as never, cfg(), llm);
  it('IA válida al primer intento → modo ia con latencia y tokens', async () => {
    const llm = fakeLlm([cuentoValido()]);
    const g = await svc(llm).generarTexto(base);
    expect(g.modo).toBe('ia');
    expect(g.intentos).toBe(1);
    expect(g.providerMs).toBe(12);
    expect(g.tokensIn).toBe(100);
    expect(llm.calls[0]!.temperature).toBe(0.8);
  });
  it('JSON inválido → reintento estricto → válido', async () => {
    const llm = fakeLlm(['esto no es json', cuentoValido()]);
    const g = await svc(llm).generarTexto(base);
    expect(g.modo).toBe('ia');
    expect(g.intentos).toBe(2);
    expect(llm.calls[1]!.user).toMatch(/se rechazó por/);
    expect(llm.calls[1]!.temperature).toBe(0.5);
    expect(g.tokensIn).toBe(200); // suma de los dos intentos
  });
  it('dos respuestas inválidas (bloqueo + inglés) → plantilla', async () => {
    const llm = fakeLlm([cuentoValido({ titulo: 'La pistola de Lía' }), cuentoValido({ parrafos: Array(6).fill('Lia and the fox ran across the beach with the crabs and the boats and the sun and the sea and the friends and the day was good and fine.') })]);
    const g = await svc(llm).generarTexto(base);
    expect(g.modo).toBe('plantilla');
    expect(g.intentos).toBe(2);
    expect(llm.calls[1]!.user).toMatch(/no permitida/);
  });
  it('proveedor no disponible o con error → plantilla sin lanzar', async () => {
    expect((await svc(new NoLlmProvider()).generarTexto(base)).modo).toBe('plantilla');
    expect((await svc(fakeLlm([new LlmUnavailableError('red')])).generarTexto(base)).modo).toBe('plantilla');
    expect((await svc(fakeLlm([new Error('explotó')])).generarTexto(base)).modo).toBe('plantilla');
  });
});
