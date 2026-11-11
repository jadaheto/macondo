import {
  CUENTO_BANDAS_DEFAULT, CUENTO_LUGARES, CUENTO_NOMBRE_MAX, CUENTO_NOMBRE_RE, CUENTO_OPCIONES, CUENTO_TIPOS, CUENTO_VALORES,
  type CuentoDTO, type CuentoLugar, type CuentoOpciones, type CuentosDisponibleDTO, type CuentoTipo, type CuentoValor, type GradeBand,
} from '@macondo/shared';
import { readJSON, writeJSON } from './storage';

/**
 * Taller de cuentos (ADR-018), lado web: máquina de estados del asistente (pura, probada), id aleatorio de
 * dispositivo (solo para el límite por hora; sin IP ni cuenta) y lista local «Mis cuentos» (localStorage).
 */

export const DEVICE_KEY = 'macondo.cuentos.device';
export const MIS_CUENTOS_KEY = 'macondo.cuentos.mios';
export const MAX_MIS_CUENTOS = 12;

/** Textos de la interfaz (escritos para este proyecto). */
export const COPY = {
  portadaTitulo: 'Taller de cuentos',
  portadaIntro: 'Aquí el autor eres tú. Escoge quién vive la aventura, en qué rincón de Sucre ocurre y qué quieres enseñar con ella. Nosotros ponemos las palabras; tú, la imaginación.',
  paso1: 'Los creadores',
  autorPregunta: '¿Cómo te llamas?',
  protagonistaPregunta: '¿Cómo se llama tu protagonista?',
  tipoPregunta: '¿Quién es?',
  paso2: 'El lugar',
  lugarPregunta: '¿Dónde pasa la historia?',
  paso3: 'La enseñanza',
  valorPregunta: '¿Qué quieres que aprenda quien lo lea?',
  generando: 'Tu cuento se está escribiendo…',
  generandoDetalle: 'Estamos juntando tus ideas con las palabras de la biblioteca. Tarda menos de un minuto; después podrás leerlo y escucharlo.',
  plantillaAviso: 'Hoy el cuento lo armamos con nuestras plantillas.',
  notaRevision: 'Tu cuento quedó en la biblioteca para que la bibliotecaria lo revise; si lo aprueba, aparecerá en el catálogo con tu nombre de autor.',
  proximamente: 'El Taller de cuentos todavía no está disponible para tu grado. ¡Próximamente!',
  guardar: 'Guardar en esta tablet',
  otro: 'Hacer otro cuento',
  escuchar: 'Escuchar',
} as const;

export type Paso = 'portada' | 'creadores' | 'lugar' | 'ensenanza' | 'generando' | 'resultado' | 'error';

export interface WizardState {
  paso: Paso;
  autorNombre: string;
  protagonista: string;
  tipo: CuentoTipo | null;
  lugar: CuentoLugar | null;
  valor: CuentoValor | null;
  /** Mensaje de validación del paso actual. */
  aviso: string | null;
  cuentoId: string | null;
  error: string | null;
}

export type WizardAction =
  | { type: 'empezar' }
  | { type: 'autor'; value: string }
  | { type: 'protagonista'; value: string }
  | { type: 'tipo'; value: CuentoTipo }
  | { type: 'lugar'; value: CuentoLugar }
  | { type: 'valor'; value: CuentoValor }
  | { type: 'siguiente' }
  | { type: 'atras' }
  | { type: 'enviado'; id: string }
  | { type: 'fallo'; message: string }
  | { type: 'listo' }
  | { type: 'reiniciar' };

export const INITIAL_STATE: WizardState = { paso: 'portada', autorNombre: '', protagonista: '', tipo: null, lugar: null, valor: null, aviso: null, cuentoId: null, error: null };

/** Validación local de nombres (misma regla que el contrato); mensaje en español o null. */
export function validarNombreLocal(nombre: string, obligatorio: boolean): string | null {
  const t = nombre.trim();
  if (!t) return obligatorio ? 'Escribe el nombre de tu protagonista.' : null;
  if (t.length < 2) return 'El nombre necesita al menos 2 letras.';
  if (t.length > CUENTO_NOMBRE_MAX) return `El nombre puede tener hasta ${CUENTO_NOMBRE_MAX} letras.`;
  if (!CUENTO_NOMBRE_RE.test(t)) return 'Usa solo letras y espacios (también sirven el apóstrofo y el guion).';
  return null;
}

const ORDEN: Paso[] = ['portada', 'creadores', 'lugar', 'ensenanza', 'generando', 'resultado'];

export function wizardReducer(s: WizardState, a: WizardAction): WizardState {
  switch (a.type) {
    case 'empezar':
      return { ...s, paso: 'creadores', aviso: null };
    case 'autor':
      return { ...s, autorNombre: a.value.slice(0, CUENTO_NOMBRE_MAX), aviso: null };
    case 'protagonista':
      return { ...s, protagonista: a.value.slice(0, CUENTO_NOMBRE_MAX), aviso: null };
    case 'tipo':
      return { ...s, tipo: a.value, aviso: null };
    case 'lugar':
      // Elegir el lugar avanza solo: un toque menos para los más pequeños.
      return { ...s, lugar: a.value, aviso: null, paso: 'ensenanza' };
    case 'valor':
      return { ...s, valor: a.value, aviso: null };
    case 'siguiente': {
      if (s.paso === 'creadores') {
        const errAutor = validarNombreLocal(s.autorNombre, false);
        if (errAutor) return { ...s, aviso: `Tu nombre: ${errAutor}` };
        const errProta = validarNombreLocal(s.protagonista, true);
        if (errProta) return { ...s, aviso: errProta };
        if (!s.tipo) return { ...s, aviso: 'Elige quién es tu protagonista.' };
        return { ...s, paso: 'lugar', aviso: null };
      }
      if (s.paso === 'lugar') return s.lugar ? { ...s, paso: 'ensenanza', aviso: null } : { ...s, aviso: 'Elige dónde pasa la historia.' };
      if (s.paso === 'ensenanza') return s.valor ? { ...s, paso: 'generando', aviso: null, error: null } : { ...s, aviso: 'Elige qué quieres enseñar con tu cuento.' };
      return s;
    }
    case 'atras': {
      const i = ORDEN.indexOf(s.paso);
      if (s.paso === 'error') return { ...s, paso: 'ensenanza', error: null };
      return i > 0 && i <= 3 ? { ...s, paso: ORDEN[i - 1]!, aviso: null } : s;
    }
    case 'enviado':
      return { ...s, cuentoId: a.id, paso: 'generando' };
    case 'fallo':
      return { ...s, paso: 'error', error: a.message };
    case 'listo':
      return { ...s, paso: 'resultado' };
    case 'reiniciar':
      // Conserva el nombre del autor: suele hacer varios cuentos seguidos.
      return { ...INITIAL_STATE, autorNombre: s.autorNombre, paso: 'creadores' };
    default:
      return s;
  }
}

/** ¿El cuento ya se puede mostrar? (texto listo; el audio puede seguir en camino). */
export function cuentoListo(c: Pick<CuentoDTO, 'status' | 'contenido'>): boolean {
  return !!c.contenido && c.status !== 'GENERATING' && c.status !== 'FAILED';
}
/** ¿Hay que seguir consultando? (texto o audio pendientes). */
export function seguirConsultando(c: Pick<CuentoDTO, 'status' | 'audio'>): boolean {
  return c.status === 'GENERATING' || c.status === 'GENERATED' || c.audio.pendiente;
}

export function opcionesParaEnviar(s: WizardState, banda: GradeBand, deviceId: string): CuentoOpciones {
  return {
    banda,
    autorNombre: s.autorNombre.trim() || null,
    protagonista: s.protagonista.trim(),
    tipo: s.tipo!,
    lugar: s.lugar!,
    valor: s.valor!,
    deviceId,
  };
}

/** ¿La banda puede usar el taller? Con la respuesta de la API si existe; si no, las bandas por defecto. */
export function bandaHabilitada(band: GradeBand | null, disp: CuentosDisponibleDTO | null): boolean {
  if (!band) return false;
  if (disp) return disp.habilitado && disp.bandas.includes(band);
  return CUENTO_BANDAS_DEFAULT.includes(band);
}

/** Id aleatorio del dispositivo (se crea una vez). Sin red: solo sirve para el límite por hora en el servidor. */
export function deviceId(random: () => string = randomToken): string {
  const saved = readJSON<string | null>(DEVICE_KEY, null);
  if (saved && /^[A-Za-z0-9_-]{8,80}$/.test(saved)) return saved;
  const id = random();
  writeJSON(DEVICE_KEY, id);
  return id;
}
function randomToken(): string {
  const alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let out = 'd';
  try {
    const bytes = new Uint8Array(24);
    crypto.getRandomValues(bytes);
    for (const b of bytes) out += alphabet[b % alphabet.length];
  } catch {
    for (let i = 0; i < 24; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

/** Cuento guardado en esta tablet (texto completo; el audio se escucha en línea si existe). */
export interface CuentoGuardado {
  id: string;
  titulo: string;
  autorNombre: string | null;
  protagonista: string;
  tipo: CuentoTipo;
  lugar: CuentoLugar;
  valor: CuentoValor;
  banda: GradeBand;
  modo: CuentoDTO['modo'];
  contenido: NonNullable<CuentoDTO['contenido']>;
  audioUrl: string | null;
  guardadoEn: string;
}

export function listarMisCuentos(): CuentoGuardado[] {
  const raw = readJSON<unknown>(MIS_CUENTOS_KEY, []);
  if (!Array.isArray(raw)) return [];
  return raw.filter((c): c is CuentoGuardado => !!c && typeof c === 'object' && typeof (c as CuentoGuardado).id === 'string' && !!(c as CuentoGuardado).contenido);
}

/** Guarda (o actualiza) un cuento; los más recientes primero; máximo MAX_MIS_CUENTOS. Devuelve la lista. */
export function guardarMiCuento(c: CuentoDTO, now = new Date()): CuentoGuardado[] {
  if (!c.contenido) return listarMisCuentos();
  const item: CuentoGuardado = {
    id: c.id, titulo: c.titulo, autorNombre: c.autorNombre, protagonista: c.protagonista, tipo: c.tipo, lugar: c.lugar, valor: c.valor, banda: c.banda,
    modo: c.modo, contenido: c.contenido, audioUrl: c.audio.url, guardadoEn: now.toISOString(),
  };
  const list = [item, ...listarMisCuentos().filter((x) => x.id !== c.id)].slice(0, MAX_MIS_CUENTOS);
  writeJSON(MIS_CUENTOS_KEY, list);
  return list;
}

export function quitarMiCuento(id: string): CuentoGuardado[] {
  const list = listarMisCuentos().filter((x) => x.id !== id);
  writeJSON(MIS_CUENTOS_KEY, list);
  return list;
}

export function estaGuardado(id: string): boolean {
  return listarMisCuentos().some((x) => x.id === id);
}

/** Convierte un cuento guardado al DTO que usa la vista de resultado. */
export function guardadoADTO(g: CuentoGuardado): CuentoDTO {
  return {
    id: g.id, status: 'PENDING_REVIEW', modo: g.modo, banda: g.banda, titulo: g.titulo, autorNombre: g.autorNombre, protagonista: g.protagonista,
    tipo: g.tipo, lugar: g.lugar, valor: g.valor, contenido: g.contenido,
    audio: { listo: !!g.audioUrl, url: g.audioUrl, durationSeconds: null, pendiente: false }, error: null, createdAt: g.guardadoEn,
  };
}

export const TIPOS = CUENTO_TIPOS.map((id) => CUENTO_OPCIONES.tipos[id]);
export const LUGARES = CUENTO_LUGARES.map((id) => CUENTO_OPCIONES.lugares[id]);
export const VALORES = CUENTO_VALORES.map((id) => CUENTO_OPCIONES.valores[id]);
