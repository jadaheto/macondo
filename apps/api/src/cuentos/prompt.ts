import { CUENTO_LIMITES, CUENTO_OPCIONES, type CuentoOpciones, type GradeBand } from '@macondo/shared';

/**
 * Prompts fijos del Taller de cuentos (ADR-018). Al proveedor solo llegan: banda, opciones cerradas (tipo, lugar,
 * valor) y el nombre del protagonista ya validado. NUNCA el nombre del autor ni ningún otro dato del niño.
 */

export const SYSTEM_PROMPT = `Eres la escritora de cuentos de Macondo Digital, la biblioteca escolar de Comfasucre en Sucre, Colombia.
Escribes cuentos infantiles originales en español de Colombia, con un tono cálido, claro y alegre, como los que una bibliotecaria lee en voz alta.

REGLAS DE CONTENIDO (obligatorias):
- Lectores de primaria. Nada de violencia, armas, muerte, sangre, miedo, terror, romance, besos, drogas, alcohol, groserías ni burlas.
- Sin marcas comerciales, sin religión, sin política, sin personajes de televisión o videojuegos, sin enlaces.
- El escenario es un lugar real de Sucre (el que se indique) descrito con cariño y detalles sensoriales verosímiles: fauna, clima, comida, música, oficios.
- Protagonista con el nombre exacto que se indique; no inventes apellidos ni datos personales. Puedes añadir uno o dos personajes secundarios con nombres comunes en la región.
- El cuento enseña el valor pedido de forma natural, con una situación que el protagonista resuelve; termina bien y con esperanza.
- Frases cortas, vocabulario adecuado a la edad, diálogos con raya (—). Sin moralejas en tono de regaño.

FORMATO: responde ÚNICAMENTE con un objeto JSON válido (sin texto antes ni después, sin comentarios) con esta forma exacta:
{
  "titulo": "título breve y atractivo (máximo 8 palabras)",
  "sinopsis": "resumen de máximo 40 palabras",
  "parrafos": ["párrafo 1", "párrafo 2", "..."],
  "preguntas": [
    { "pregunta": "pregunta de comprensión", "opciones": ["opción A", "opción B", "opción C"], "respuesta": 0, "explicacion": "por qué es la correcta" },
    { "pregunta": "...", "opciones": ["...", "...", "..."], "respuesta": 1, "explicacion": "..." },
    { "pregunta": "...", "opciones": ["...", "...", "..."], "respuesta": 2, "explicacion": "..." }
  ],
  "glosario": [ { "palabra": "palabra nueva del cuento", "significado": "explicación sencilla" } ],
  "valorRecordatorio": "una frase que recuerde la enseñanza del cuento"
}
Exactamente 3 preguntas con 3 opciones cada una; "respuesta" es el índice (0, 1 o 2) de la opción correcta. Glosario de 2 a 4 palabras que aparezcan en el cuento.`;

const TIPO_DESC: Record<CuentoOpciones['tipo'], string> = {
  nino: 'una niña o un niño de Sucre, con una mochila llena de ideas (no indiques su género; usa el nombre)',
  animal: 'un animal ingenioso de la región (por ejemplo un zorro, una iguana, un manatí o un mono tití) que siempre encuentra la salida',
  robot: 'un robot curioso recién llegado que quiere entenderlo todo',
  leyenda: 'un ser de leyenda amable, una criatura de los cuentos de la abuela (inventado, no asusta a nadie)',
};
const LUGAR_DESC: Record<CuentoOpciones['lugar'], string> = {
  covenas: 'las playas de Coveñas (Sucre): arena tibia, cangrejos, cocoteros, lanchas de pescadores y un mar que guarda secretos',
  mojana: 'las ciénagas de la Mojana (Sucre): agua, garzas, chigüiros, canoas y caminos que cambian con la lluvia',
  sincelejo: 'Sincelejo (capital de Sucre): la plaza, las calles, el mercado y la banda que ensaya para las fiestas del 20 de enero',
  espacio: 'una estación en el espacio desde donde se ve todo Sucre: el mar de Coveñas, la Mojana, las sabanas y las luces de Sincelejo',
};
const VALOR_DESC: Record<CuentoOpciones['valor'], string> = {
  amistad: '«Juntos llegamos más lejos»: amistad y trabajo en equipo',
  valentia: '«Atreverse da miedo, y se puede»: valentía y confianza en uno mismo (sin peligros reales ni sustos)',
  curiosidad: '«Preguntar es el primer paso»: curiosidad y ganas de aprender',
  cuidado: '«Cuidar lo que nos rodea»: el agua, los animales y el entorno',
};

export function userPrompt(o: Pick<CuentoOpciones, 'banda' | 'protagonista' | 'tipo' | 'lugar' | 'valor'>): string {
  const rango = CUENTO_LIMITES.palabras[o.banda] ?? CUENTO_LIMITES.palabras['1-3']!;
  const edad = o.banda === '1-3' ? 'niñas y niños de 6 a 8 años (grados 1.º a 3.º): frases muy cortas, repeticiones y sonidos' : 'niñas y niños de 9 a 11 años (grados 4.º y 5.º): un poco más de trama y vocabulario';
  return `Escribe un cuento para ${edad}.
Protagonista: ${TIPO_DESC[o.tipo]}. Su nombre es «${o.protagonista}».
Lugar: ${LUGAR_DESC[o.lugar]}.
Enseñanza: ${VALOR_DESC[o.valor]}.
Extensión: entre ${rango.min} y ${rango.max} palabras en total en "parrafos" (cuenta las palabras), repartidas en ${o.banda === '1-3' ? '4 a 8' : '6 a 12'} párrafos.
Las opciones de "${CUENTO_OPCIONES.tipos[o.tipo].titulo}", "${CUENTO_OPCIONES.lugares[o.lugar].titulo}" y "${CUENTO_OPCIONES.valores[o.valor].titulo}" las eligió el lector: respétalas.
Responde solo con el JSON.`;
}

/** Segundo intento: recuerda las reglas rotas y exige JSON puro. */
export function userPromptEstricto(o: Pick<CuentoOpciones, 'banda' | 'protagonista' | 'tipo' | 'lugar' | 'valor'>, motivos: string[]): string {
  return `${userPrompt(o)}

ATENCIÓN: tu respuesta anterior se rechazó por: ${motivos.join('; ')}.
Corrige eso. Devuelve ÚNICAMENTE el objeto JSON con las claves exactas (titulo, sinopsis, parrafos, preguntas, glosario, valorRecordatorio), sin vallas de código ni explicaciones. Español de Colombia, sin palabras malsonantes, sin miedo ni violencia, con el nombre «${o.protagonista}» en el cuento.`;
}

export function maxTokensFor(banda: GradeBand): number {
  return banda === '1-3' ? 1800 : 2600;
}
