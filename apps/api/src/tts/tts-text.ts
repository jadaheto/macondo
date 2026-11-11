import { TTS_LIMITS, TTS_VOICE_CREDIT } from '@macondo/shared';

/**
 * Preparación del texto para Piper (funciones puras, sin E/S).
 * Piper lee una «línea» por utterance y divide cada línea en frases por su cuenta; aquí solo se
 * normalizan espacios, se conservan los párrafos y se limita el tamaño de cada trozo.
 */

/** Normaliza espacios y saltos: párrafos separados por una línea en blanco, sin espacios dobles ni tabulaciones. */
export function normalizeText(raw: string): string {
  return raw
    .replace(/\r\n?/g, '\n')
    .replace(/[\t\f\v ]+/g, ' ')
    .split(/\n{2,}/)
    .map((p) => p.replace(/\s*\n\s*/g, ' ').replace(/ {2,}/g, ' ').trim())
    .filter(Boolean)
    .join('\n\n');
}

/** Divide un párrafo demasiado largo por límites de frase (., !, ?, ;, :) y, si no hay, por palabras. */
function splitLong(paragraph: string, max: number): string[] {
  if (paragraph.length <= max) return [paragraph];
  const out: string[] = [];
  let rest = paragraph;
  while (rest.length > max) {
    const window = rest.slice(0, max);
    let cut = -1;
    for (const re of [/[.!?…]["»”)]?\s(?=[^\s])/g, /[;:]\s(?=[^\s])/g, /,\s(?=[^\s])/g, /\s(?=[^\s])/g]) {
      let m: RegExpExecArray | null;
      while ((m = re.exec(window)) !== null) cut = m.index + m[0].length;
      if (cut > max * 0.3) break;
      cut = -1;
    }
    if (cut <= 0) cut = max; // sin espacios: corte duro
    out.push(rest.slice(0, cut).trim());
    rest = rest.slice(cut).trim();
  }
  if (rest) out.push(rest);
  return out;
}

/**
 * Trozos (≤ `max` caracteres) que se envían a Piper, uno por línea de stdin. Párrafos cortos
 * consecutivos se agrupan en una línea para que la entonación fluya; los largos se parten por frases.
 * Devuelve [] si el texto queda vacío. Lanza si supera `TTS_LIMITS.maxChars`.
 */
export function chunkText(raw: string, max: number = TTS_LIMITS.chunkChars): string[] {
  const text = normalizeText(raw);
  if (!text) return [];
  if (text.length > TTS_LIMITS.maxChars) {
    throw new RangeError(`El texto supera el máximo de ${TTS_LIMITS.maxChars} caracteres (tiene ${text.length}).`);
  }
  const chunks: string[] = [];
  let current = '';
  for (const paragraph of text.split('\n\n')) {
    for (const piece of splitLong(paragraph, max)) {
      if (current && current.length + 1 + piece.length > max) {
        chunks.push(current);
        current = piece;
      } else {
        current = current ? `${current} ${piece}` : piece;
      }
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

/**
 * Duración en segundos de un WAV PCM a partir de su cabecera RIFF (sin decodificar el audio).
 * Devuelve null si no es un WAV PCM reconocible.
 */
export function wavDurationSeconds(header: Buffer, fileSize: number): number | null {
  if (header.length < 12 || header.toString('ascii', 0, 4) !== 'RIFF' || header.toString('ascii', 8, 12) !== 'WAVE') return null;
  let off = 12;
  let byteRate = 0;
  while (off + 8 <= header.length) {
    const id = header.toString('ascii', off, off + 4);
    const size = header.readUInt32LE(off + 4);
    if (id === 'fmt ' && off + 24 <= header.length) {
      byteRate = header.readUInt32LE(off + 16);
    } else if (id === 'data') {
      if (!byteRate) return null;
      const dataBytes = size === 0xffffffff || size === 0 ? Math.max(0, fileSize - (off + 8)) : Math.min(size, fileSize - (off + 8));
      return dataBytes / byteRate;
    }
    off += 8 + size + (size % 2);
  }
  return null;
}

/**
 * Actualiza la mención a la voz sintética dentro de `licenseName` (p. ej. «…; voz sintética Piper
 * es_ES-carlfm-x_low (modelo MIT, dataset de dominio público)») para que cite la voz actual.
 * Si la licencia no menciona una voz sintética, se devuelve sin cambios: nunca se altera el titular
 * ni una licencia de contenido ajena a la narración.
 */
export function updateLicenseVoiceCredit(licenseName: string, credit: string = TTS_VOICE_CREDIT): string {
  const lower = credit.charAt(0).toLowerCase() + credit.slice(1);
  // 1) Formas Piper: «voz sintética Piper <voz> (…)», «Voz: Piper <voz>».
  const piper = /voz\s+sint[eé]tica\s+(?:de\s+)?piper\s+[\w.-]+(?:\s*\([^)]*\))?/i;
  if (piper.test(licenseName)) return licenseName.replace(piper, (m) => (m[0] === 'V' ? credit : lower));
  // 2) Formas genéricas: «voz sintética macOS solo para demo», «voz sintética (macOS, Paulina)».
  const generic = /voz\s+sint[eé]tica(?:\s*\([^)]*\))?[^;.,]*/i;
  if (generic.test(licenseName)) return licenseName.replace(generic, (m) => (m[0] === 'V' ? credit : lower)).replace(/\s+([;.,])/g, '$1');
  return licenseName;
}
