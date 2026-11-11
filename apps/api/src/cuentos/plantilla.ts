import { type CuentoGenerado, CuentoGeneradoSchema, type CuentoOpciones } from '@macondo/shared';

/**
 * «Modo plantilla» (ADR-018): generador determinista con fragmentos PROPIOS en español, escritos para esta
 * biblioteca. Combina tipo de protagonista (4) × lugar (4) × valor (4) e inserta el nombre del protagonista.
 * Se usa cuando el proveedor de IA no está configurado, falla o devuelve algo inválido. No usa red.
 */

type Tipo = CuentoOpciones['tipo'];
type Lugar = CuentoOpciones['lugar'];
type Valor = CuentoOpciones['valor'];

interface TipoFrag {
  /** Presentación del protagonista. {N} = nombre. */
  intro: string;
  /** Cómo llega al lugar. {L} = nombre corto del lugar. */
  llegada: string;
  /** Cierre del día. */
  cierre: string;
  pregunta: { pregunta: string; correcta: string; otras: [string, string]; explicacion: string };
}
interface LugarFrag {
  corto: string;
  /** Descripción sensorial del lugar. {N} */
  escena: string;
  /** Detalle extra (solo 4.º y 5.º). {N} */
  extra: string;
  /** Personaje secundario del lugar (con artículo). */
  amigo: string;
  /** Lo que hay que resolver en ese lugar. */
  cosa: string;
  glosario: Array<{ palabra: string; significado: string }>;
  pregunta: { pregunta: string; correcta: string; otras: [string, string]; explicacion: string };
}
interface ValorFrag {
  /** Problema. {N} {A} = amigo, {C} = cosa. */
  problema: string;
  /** Diálogo extra (solo 4.º y 5.º). {N} {A} */
  extra: string;
  /** Solución. {N} {A} {C} */
  solucion: string;
  recordatorio: string;
  glosario: { palabra: string; significado: string };
  pregunta: { pregunta: string; correcta: string; otras: [string, string]; explicacion: string };
  tituloPrefijo: string;
}

const TIPOS: Record<Tipo, TipoFrag> = {
  nino: {
    intro: '{N} se levantó temprano, con el pelo alborotado y una mochila llena de ideas. En la mochila cabían un cuaderno, un lápiz mordido, una botella de agua y, sobre todo, muchas ganas de descubrir cosas nuevas.',
    llegada: 'Esa mañana {N} fue a {L} con la abuela, que caminaba despacio pero lo sabía todo.',
    cierre: 'Al volver a casa, {N} abrió el cuaderno y dibujó todo lo que había pasado, para no olvidarlo nunca.',
    pregunta: { pregunta: '¿Qué llevaba {N} en la mochila?', correcta: 'Un cuaderno, un lápiz y muchas ganas de descubrir cosas', otras: ['Un balón y una cometa', 'Una linterna y un mapa del tesoro'], explicacion: 'El cuento dice que en la mochila había un cuaderno, un lápiz mordido, agua y muchas ganas de descubrir cosas nuevas.' },
  },
  animal: {
    intro: '{N} era un zorro pequeño de orejas grandes y mirada despierta. Cuando algo parecía imposible, {N} ladeaba la cabeza, movía la cola y decía: «Siempre hay una salida, solo hay que buscarla».',
    llegada: 'Un día {N} siguió el olor del viento y llegó, trotando, hasta {L}.',
    cierre: 'Cuando el sol bajó, {N} regresó a su madriguera con la cola en alto y una historia nueva para contarle a las estrellas.',
    pregunta: { pregunta: '¿Qué decía {N} cuando algo parecía imposible?', correcta: '«Siempre hay una salida, solo hay que buscarla»', otras: ['«Mejor me voy a dormir»', '«Eso no es asunto mío»'], explicacion: 'Esa es la frase favorita de {N}, el zorro ingenioso.' },
  },
  robot: {
    intro: '{N} era un robot pequeño, redondo y brillante, recién llegado a Sucre. Tenía dos luces por ojos, una antena que giraba cuando pensaba y una pregunta favorita: «¿Y eso cómo funciona?».',
    llegada: 'La primera mañana, {N} rodó con sus rueditas hasta {L}, grabando todo con su cámara para entenderlo mejor.',
    cierre: 'Esa noche {N} guardó el día entero en su memoria, con una etiqueta especial: «Cosas que aprendí en Sucre».',
    pregunta: { pregunta: '¿Cuál era la pregunta favorita de {N}?', correcta: '«¿Y eso cómo funciona?»', otras: ['«¿Dónde está mi cargador?»', '«¿Ya es hora de comer?»'], explicacion: '{N} es un robot curioso: siempre quiere saber cómo funcionan las cosas.' },
  },
  leyenda: {
    intro: '{N} era un ser de leyenda, de esos que salen en los cuentos de la abuela: tenía alas de mariposa azul, una risa que sonaba a campanitas y el don de hablar con los animales. Solo lo veían las personas que miraban con atención.',
    llegada: 'Aquella tarde {N} bajó volando, suave como una hoja, hasta {L}.',
    cierre: 'Al caer la noche, {N} se elevó entre las nubes rosadas, y la abuela, desde su mecedora, sonrió como si lo supiera todo.',
    pregunta: { pregunta: '¿Quién podía ver a {N}?', correcta: 'Las personas que miraban con atención', otras: ['Solo los pescadores', 'Nadie, era invisible siempre'], explicacion: 'El cuento dice que a {N} solo lo veían quienes miraban con atención.' },
  },
};

const LUGARES: Record<Lugar, LugarFrag> = {
  covenas: {
    corto: 'la playa de Coveñas',
    escena: 'En la playa de Coveñas la arena estaba tibia y el mar brillaba como un espejo verde. Los cangrejos corrían de lado, las gaviotas gritaban en lo alto y las lanchas de los pescadores volvían llenas de olor a sal. {N} sintió que el mar guardaba un secreto.',
    extra: 'Un pescador de sombrero grande remendaba su red a la sombra de un cocotero. Más allá, unos niños jugaban a contar las olas, y una tortuga vieja descansaba junto a los mangles. {N} respiró hondo: olía a coco, a pescado frito y a sol.',
    amigo: 'Tomás, el hijo del pescador',
    cosa: 'una red enredada entre las rocas, con un cangrejito atrapado adentro',
    glosario: [{ palabra: 'lancha', significado: 'barco pequeño que usan los pescadores para salir al mar.' }, { palabra: 'mangle', significado: 'árbol que crece con las raíces dentro del agua salada, en la orilla del mar.' }],
    pregunta: { pregunta: '¿Dónde ocurre la historia?', correcta: 'En la playa de Coveñas', otras: ['En las ciénagas de la Mojana', 'En una estación en el espacio'], explicacion: 'El cuento pasa en la playa de Coveñas, en Sucre, con arena tibia y mar verde.' },
  },
  mojana: {
    corto: 'la ciénaga de la Mojana',
    escena: 'En la Mojana el agua lo cubre casi todo. Las garzas blancas caminan despacio entre los juncos, los chigüiros se bañan con la familia completa y las canoas pasan sin hacer ruido. Después de la lluvia, los caminos cambian de lugar, y {N} tuvo que mirar muy bien por dónde ir.',
    extra: 'Una señora remaba con un canasto de pescado y saludó con la mano. Las nubes se reflejaban en el agua quieta, y una bandada de patos despegó haciendo cosquillas al cielo. {N} pensó que la ciénaga era un espejo gigante lleno de vida.',
    amigo: 'Yuleidis, una niña que conocía todos los caminos del agua',
    cosa: 'una garza con la pata enredada en un hilo de pescar',
    glosario: [{ palabra: 'ciénaga', significado: 'laguna de poca profundidad, con mucha vegetación, donde viven aves y peces.' }, { palabra: 'canoa', significado: 'bote largo y angosto que se mueve con un remo.' }],
    pregunta: { pregunta: '¿Dónde ocurre la historia?', correcta: 'En las ciénagas de la Mojana', otras: ['En la playa de Coveñas', 'En Sincelejo'], explicacion: 'El cuento pasa en la Mojana, en Sucre, donde el agua cubre casi todo y viven garzas y chigüiros.' },
  },
  sincelejo: {
    corto: 'la plaza de Sincelejo',
    escena: 'En Sincelejo la plaza olía a bollo de yuca y a café recién hecho. Los vendedores gritaban sus precios, las palomas picoteaban el suelo y, desde una esquina, la banda del pueblo ensayaba un porro para las fiestas. ¡Pum, pum, pum!, sonaba el bombo, y {N} sintió que los pies querían bailar.',
    extra: 'La iglesia blanca brillaba con el sol, un señor vendía raspados de colores y los abuelos jugaban dominó bajo los almendros. Cada calle tenía un ruido distinto: motos, risas, un clarinete que repetía la misma nota una y otra vez. {N} nunca había oído tantos sonidos juntos.',
    amigo: 'Don Eusebio, el director de la banda',
    cosa: 'la partitura del porro, que el viento se había llevado hoja por hoja',
    glosario: [{ palabra: 'porro', significado: 'música alegre de la costa Caribe que se toca con bombo, clarinete y platillos.' }, { palabra: 'partitura', significado: 'hoja donde están escritas las notas de una canción.' }],
    pregunta: { pregunta: '¿Dónde ocurre la historia?', correcta: 'En Sincelejo', otras: ['En la playa de Coveñas', 'En una estación en el espacio'], explicacion: 'El cuento pasa en la plaza de Sincelejo, donde ensaya la banda para las fiestas.' },
  },
  espacio: {
    corto: 'la estación espacial Sabana',
    escena: 'La estación espacial Sabana flotaba muy alto, en silencio. Por la ventana redonda se veía todo Sucre: el mar de Coveñas como una cinta azul, la Mojana llena de espejitos de agua y, de noche, las luces de Sincelejo como un puñado de luciérnagas. {N} pegó la nariz al vidrio y se quedó sin palabras.',
    extra: 'Adentro, las cosas flotaban: una cuchara, un lápiz, una gota de agua redonda como una canica. La capitana Marelbis revisaba las pantallas y explicaba que, desde arriba, se podía cuidar la Tierra mirando los ríos y los bosques. {N} quiso aprender a leer esos mapas de colores.',
    amigo: 'la capitana Marelbis',
    cosa: 'el panel solar que se había trabado y dejaba la estación con poca energía',
    glosario: [{ palabra: 'estación espacial', significado: 'casa grande que da vueltas alrededor de la Tierra, donde viven y trabajan los astronautas.' }, { palabra: 'panel solar', significado: 'placa que convierte la luz del sol en electricidad.' }],
    pregunta: { pregunta: '¿Dónde ocurre la historia?', correcta: 'En una estación en el espacio', otras: ['En Sincelejo', 'En las ciénagas de la Mojana'], explicacion: 'El cuento pasa en la estación espacial Sabana, desde donde se ve todo Sucre.' },
  },
};

const VALORES: Record<Valor, ValorFrag> = {
  amistad: {
    tituloPrefijo: 'Juntos en',
    problema: 'De pronto, {N} vio {C}. Intentó arreglarlo a solas, con fuerza, con ingenio, con los dientes apretados. Pero no alcanzaba: cada vez que lograba una parte, otra se soltaba. Entonces apareció {A}, que había visto todo desde lejos.',
    extra: '—Yo puedo solo —dijo {N}, un poco orgulloso.\n—Claro que puedes —respondió {A}—. Pero si lo hacemos entre dos, terminamos antes y nos queda tiempo para jugar.\n{N} lo pensó un momento y soltó una risa.',
    solucion: '{N} sostuvo una punta y {A} la otra. Uno contaba «¡uno, dos, tres!» y el otro halaba. Poco a poco, lo que parecía imposible se fue acomodando. Cuando terminaron, chocaron las manos y se sentaron a mirar el cielo. {N} entendió que pedir ayuda no es rendirse: es sumar.',
    recordatorio: 'Juntos llegamos más lejos: cuando sumamos manos, lo difícil se vuelve posible.',
    glosario: { palabra: 'equipo', significado: 'grupo de personas que trabajan juntas para lograr algo.' },
    pregunta: { pregunta: '¿Qué aprendió {N} al final?', correcta: 'Que pedir ayuda no es rendirse, es sumar', otras: ['Que es mejor hacer todo a solas', 'Que hay que esperar a que otros resuelvan'], explicacion: 'El cuento termina cuando {N} entiende que, trabajando en equipo, lo difícil se vuelve posible.' },
  },
  valentia: {
    tituloPrefijo: 'Un paso valiente en',
    problema: 'De pronto, {N} vio {C}. Había que acercarse, y a {N} le temblaron un poco las rodillas. «¿Y si no puedo? ¿Y si me equivoco?», pensó. {A} se acercó despacio y no se rio: solo se quedó al lado.',
    extra: '—Yo también sentí eso la primera vez —dijo {A}—. Sentir miedo no es malo. Lo valiente es respirar hondo y dar el primer paso, aunque sea pequeñito.\n{N} cerró los ojos, contó hasta tres y volvió a mirar.',
    solucion: '{N} respiró hondo, dio un paso, luego otro. Las manos todavía temblaban, pero se movían. Con cuidado y con paciencia, fue resolviendo el problema pedacito a pedacito. Cuando terminó, el corazón le latía fuerte, pero esta vez de alegría. {N} descubrió que atreverse da miedo… y que se puede.',
    recordatorio: 'Atreverse da miedo, y se puede: el primer paso pequeñito también cuenta.',
    glosario: { palabra: 'valentía', significado: 'hacer algo importante aunque sintamos miedo.' },
    pregunta: { pregunta: '¿Qué hizo {N} cuando sintió miedo?', correcta: 'Respiró hondo y dio un paso pequeñito', otras: ['Se fue corriendo a casa', 'Esperó a que el problema se arreglara solo'], explicacion: 'El cuento muestra que {N} respiró hondo, dio el primer paso y resolvió el problema poco a poco.' },
  },
  curiosidad: {
    tituloPrefijo: 'Las preguntas de',
    problema: 'De pronto, {N} vio {C}. Nadie sabía bien qué había pasado. Algunos decían «así es la vida» y seguían de largo. Pero {N} se quedó mirando y empezó a preguntar: «¿Por qué? ¿Desde cuándo? ¿Y si probamos…?». {A} escuchó las preguntas con una sonrisa.',
    extra: '—Preguntar es el primer paso —dijo {A}—. Nadie nace sabiendo. Los que aprenden son los que no se cansan de preguntar.\n{N} sacó el cuaderno y anotó cada respuesta, incluso las que todavía no existían.',
    solucion: 'Con cada pregunta, {N} entendía un poquito más. Observó, tocó con cuidado, comparó y probó una idea, y luego otra. A la tercera, ¡funcionó! {A} aplaudió. {N} se dio cuenta de que la curiosidad es como una linterna: cuando la enciendes, los problemas dejan de dar miedo y se vuelven interesantes.',
    recordatorio: 'Preguntar es el primer paso: quien pregunta ya empezó a aprender.',
    glosario: { palabra: 'curiosidad', significado: 'ganas de saber cómo son las cosas y por qué pasan.' },
    pregunta: { pregunta: '¿Cómo logró {N} resolver el problema?', correcta: 'Haciendo preguntas, observando y probando ideas', otras: ['Pidiendo que otro lo hiciera', 'Adivinando sin mirar'], explicacion: 'El cuento muestra que {N} preguntó, observó, comparó y probó hasta que funcionó.' },
  },
  cuidado: {
    tituloPrefijo: 'Cuidar',
    problema: 'De pronto, {N} vio {C}. Alrededor había también basura que alguien había dejado: una bolsa, una botella, un pedazo de cuerda. {N} sintió un apretón en el pecho. «Esto no está bien», pensó. {A} llegó con un canasto vacío y los dos se miraron.',
    extra: '—Este lugar nos da todo: agua, sombra, comida y música —dijo {A}—. Cuidarlo es la forma de darle las gracias.\n{N} asintió despacio y se arremangó.',
    solucion: '{N} y {A} recogieron cada cosa que no pertenecía allí, con cuidado de no dañar nada vivo. Luego arreglaron lo que estaba mal, muy despacio, hasta que todo quedó libre y en su lugar. Al final, el lugar se veía más brillante, como si respirara. {N} prometió volver cada semana, con el canasto y con amigos.',
    recordatorio: 'Cuidar lo que nos rodea: el agua, los animales y el entorno nos cuidan a nosotros también.',
    glosario: { palabra: 'entorno', significado: 'todo lo que nos rodea: el agua, el aire, las plantas y los animales.' },
    pregunta: { pregunta: '¿Qué prometió {N} al final?', correcta: 'Volver cada semana a cuidar el lugar', otras: ['No volver nunca más', 'Dejar la basura donde estaba'], explicacion: 'El cuento termina con {N} prometiendo volver cada semana con el canasto y con amigos.' },
  },
};

function fill(s: string, vars: Record<string, string>): string {
  return s.replace(/\{([NLAC])\}/g, (_, k: string) => vars[k] ?? '');
}

/** Baraja determinista (índice estable) de 3 opciones: la correcta queda en la posición `pos`. */
function pregunta(p: { pregunta: string; correcta: string; otras: [string, string]; explicacion: string }, pos: 0 | 1 | 2, vars: Record<string, string>) {
  const opciones = [...p.otras] as string[];
  opciones.splice(pos, 0, p.correcta);
  return { pregunta: fill(p.pregunta, vars), opciones: opciones.map((o) => fill(o, vars)), respuesta: pos, explicacion: fill(p.explicacion, vars) };
}

/** Genera el cuento de plantilla. Siempre válido según `CuentoGeneradoSchema` (se verifica al final). */
export function generarPlantilla(o: Pick<CuentoOpciones, 'banda' | 'protagonista' | 'tipo' | 'lugar' | 'valor'>): CuentoGenerado {
  const t = TIPOS[o.tipo];
  const l = LUGARES[o.lugar];
  const v = VALORES[o.valor];
  const vars = { N: o.protagonista, L: l.corto, A: l.amigo, C: l.cosa };
  const extendido = o.banda !== '1-3';
  const parrafos = [
    fill(t.intro, vars),
    fill(t.llegada, vars),
    fill(l.escena, vars),
    ...(extendido ? [fill(l.extra, vars)] : []),
    fill(v.problema, vars),
    ...(extendido ? [fill(v.extra, vars)] : []),
    fill(v.solucion, vars),
    fill(t.cierre, vars),
  ];
  // «Juntos en la playa de Coveñas: Lía» · «Robi cuida la estación espacial Sabana»
  const titulo = o.valor === 'cuidado' ? `${o.protagonista} cuida ${l.corto}` : `${v.tituloPrefijo} ${l.corto}: ${o.protagonista}`;
  const cuento: CuentoGenerado = {
    titulo: titulo.length > 90 ? titulo.slice(0, 87) + '…' : titulo,
    sinopsis: `${o.protagonista} llega a ${l.corto} y encuentra ${l.cosa.split(',')[0]}. Con ayuda de ${l.amigo.split(',')[0]} aprende que ${v.recordatorio.split(':')[0]!.toLowerCase()}.`,
    parrafos,
    preguntas: [pregunta(l.pregunta, 0, vars), pregunta(t.pregunta, 1, vars), pregunta(v.pregunta, 2, vars)],
    glosario: [...l.glosario, v.glosario],
    valorRecordatorio: v.recordatorio,
  };
  return CuentoGeneradoSchema.parse(cuento);
}
