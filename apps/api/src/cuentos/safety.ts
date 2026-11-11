import { CUENTO_LIMITES, CUENTO_NOMBRE_RE, type CuentoGenerado, cuentoPalabras, type GradeBand } from '@macondo/shared';

/**
 * Controles de contenido para menores (SECURITY.md, ADR-018). Todo lo que devuelve el proveedor pasa por aquí
 * antes de guardarse; también los nombres que escribe el niño antes de salir hacia el proveedor.
 * Las listas son nuestras (español de Colombia), en minúsculas y sin tildes; se comparan sobre texto normalizado.
 */

/** Palabras/expresiones vetadas en nombres y en el cuento (groserías, insultos, sexo, drogas, armas, odio). */
const BLOCKLIST: string[] = [
  // groserías e insultos frecuentes en Colombia
  'mierda', 'puta', 'puto', 'putas', 'putos', 'hijueputa', 'hijoeputa', 'hp', 'gonorrea', 'malparido', 'malparida', 'marica', 'maricon', 'maricón',
  'carajo', 'cabron', 'cabrona', 'pendejo', 'pendeja', 'idiota', 'imbecil', 'estupido', 'estupida', 'verga', 'culo', 'culos', 'chimba', 'guevon', 'huevon',
  'joder', 'jodido', 'jodida', 'coño', 'cono', 'pene', 'vagina', 'tetas', 'nalgas', 'perra', 'perro maldito', 'zorra', 'bastardo', 'bastarda', 'maldito', 'maldita',
  // sexo, drogas, armas, violencia explícita
  'sexo', 'sexual', 'desnudo', 'desnuda', 'porno', 'violacion', 'violar', 'droga', 'drogas', 'marihuana', 'cocaina', 'cocaína', 'bazuco', 'alcohol', 'cerveza', 'aguardiente',
  'borracho', 'borracha', 'cigarrillo', 'pistola', 'revolver', 'fusil', 'escopeta', 'cuchillo', 'machete', 'bomba', 'granada', 'matar', 'mato', 'mató', 'asesino', 'asesinar',
  'sangre', 'cadaver', 'cadáver', 'muerto', 'muerta', 'suicidio', 'suicida', 'secuestro', 'secuestrar', 'guerrilla', 'paramilitar', 'narco', 'sicario', 'tortura', 'disparo', 'disparar',
  // odio y discriminación
  'negro de mierda', 'india', 'indio', 'sudaca', 'retrasado', 'retrasada', 'mongolo', 'mongólico', 'nazi', 'hitler',
  // marcas, religión y política (el cuento no las menciona)
  'coca cola', 'coca-cola', 'pepsi', 'mcdonalds', 'nike', 'adidas', 'disney', 'netflix', 'tiktok', 'youtube', 'facebook', 'instagram', 'whatsapp',
  'jesucristo', 'jesús', 'jesus', 'virgen maria', 'alá', 'ala akbar', 'biblia', 'coran', 'corán', 'satanas', 'satanás', 'diablo', 'demonio', 'infierno',
  'petro', 'uribe', 'duque', 'santos', 'trump', 'maduro', 'presidente', 'senador', 'alcalde', 'partido liberal', 'partido conservador', 'elecciones',
  // miedo / contenido que asusta
  'fantasma', 'zombi', 'zombie', 'vampiro', 'pesadilla', 'terror', 'horror', 'monstruo malvado', 'bruja malvada', 'ouija',
  // romance
  'novio', 'novia', 'beso en la boca', 'besar', 'besos', 'enamorado', 'enamorada', 'amante',
];

/** Palabras muy frecuentes del español: una proporción mínima indica que el texto está en español. */
const STOPWORDS = new Set([
  'el', 'la', 'de', 'que', 'y', 'en', 'un', 'una', 'los', 'las', 'con', 'por', 'para', 'se', 'su', 'es', 'al', 'como', 'del', 'le', 'lo', 'mas', 'pero',
  'sus', 'muy', 'era', 'habia', 'dijo', 'no', 'si', 'cuando', 'todo', 'todos', 'donde', 'hasta', 'sobre', 'entre', 'tambien', 'ya', 'eso', 'esta', 'este',
  'fue', 'ser', 'son', 'hay', 'tiene', 'tenia', 'porque', 'desde', 'asi', 'ella', 'ellos', 'nos', 'les', 'me', 'te', 'mi', 'tu', 'yo', 'o', 'ni', 'sin',
]);

/** Minúsculas, sin tildes, sin signos, espacios simples. */
export function normalizar(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9ñ\s'-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const BLOCK_NORM = Array.from(new Set(BLOCKLIST.map(normalizar).filter(Boolean)));

/** Devuelve la primera expresión vetada que aparece como palabra completa (o frase), o null. */
export function palabraVetada(texto: string): string | null {
  const n = ` ${normalizar(texto)} `;
  for (const b of BLOCK_NORM) {
    if (n.includes(` ${b} `)) return b;
  }
  return null;
}

/** Nombre de autor/protagonista: formato + lista de bloqueo. Devuelve el motivo en español o null si es válido. */
export function validarNombre(nombre: string): string | null {
  const t = nombre.trim();
  if (t.length < 2 || t.length > 30) return 'El nombre debe tener entre 2 y 30 letras.';
  if (!CUENTO_NOMBRE_RE.test(t)) return 'El nombre solo puede tener letras, espacios, apóstrofo y guion.';
  if (/(.)\1{3,}/i.test(t)) return 'El nombre no parece real (letras repetidas).';
  const veto = palabraVetada(t) ?? palabraVetada(t.replace(/[\s'-]/g, ''));
  if (veto) return 'Ese nombre no se puede usar en la biblioteca. Prueba con otro.';
  return null;
}

/** Proporción de palabras frecuentes del español (≥ 0,12 en prosa normal; una traducción al inglés queda cerca de 0). */
export function proporcionEspanol(texto: string): number {
  const words = normalizar(texto).split(' ').filter(Boolean);
  if (words.length === 0) return 0;
  const hits = words.filter((w) => STOPWORDS.has(w)).length;
  return hits / words.length;
}

export interface ValidacionCuento { ok: boolean; motivos: string[] }

/**
 * Validación posterior del cuento (ya parseado con `CuentoGeneradoSchema`): lista de bloqueo en todos los textos,
 * idioma español, longitud por banda (con tolerancia), sinopsis ≤ 40 palabras, respuestas distintas por pregunta
 * y presencia del nombre del protagonista.
 */
export function validarCuento(c: CuentoGenerado, banda: GradeBand, protagonista: string): ValidacionCuento {
  const motivos: string[] = [];
  const textos = [c.titulo, c.sinopsis, ...c.parrafos, c.valorRecordatorio, ...c.preguntas.flatMap((q) => [q.pregunta, q.explicacion, ...q.opciones]), ...c.glosario.flatMap((g) => [g.palabra, g.significado])];
  for (const t of textos) {
    const v = palabraVetada(t);
    if (v) {
      motivos.push(`contiene una expresión no permitida (${v})`);
      break;
    }
  }
  const cuerpo = c.parrafos.join(' ');
  if (proporcionEspanol(cuerpo) < 0.12) motivos.push('el texto no parece estar en español');
  const palabras = cuentoPalabras(c);
  const rango = CUENTO_LIMITES.palabras[banda];
  if (rango) {
    const min = Math.floor(rango.min * (1 - CUENTO_LIMITES.tolerancia));
    const max = Math.ceil(rango.max * (1 + CUENTO_LIMITES.tolerancia));
    if (palabras < min) motivos.push(`muy corto: ${palabras} palabras (mínimo ${rango.min})`);
    if (palabras > max) motivos.push(`muy largo: ${palabras} palabras (máximo ${rango.max})`);
  }
  if (c.sinopsis.split(/\s+/).filter(Boolean).length > CUENTO_LIMITES.sinopsisPalabras + 8) motivos.push('la sinopsis supera las 40 palabras');
  for (const [i, q] of c.preguntas.entries()) {
    if (new Set(q.opciones.map((o) => normalizar(o))).size !== q.opciones.length) motivos.push(`la pregunta ${i + 1} repite opciones`);
  }
  if (!normalizar(cuerpo).includes(normalizar(protagonista))) motivos.push('el cuento no menciona al protagonista');
  if (/https?:\/\/|www\./i.test(cuerpo)) motivos.push('contiene enlaces');
  return { ok: motivos.length === 0, motivos };
}

/** Extrae el primer objeto JSON del texto del modelo (tolera vallas ``` y texto alrededor). */
export function extraerJson(texto: string): unknown | null {
  const sinVallas = texto.replace(/```(?:json)?/gi, '').trim();
  const start = sinVallas.indexOf('{');
  const end = sinVallas.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(sinVallas.slice(start, end + 1));
  } catch {
    return null;
  }
}
