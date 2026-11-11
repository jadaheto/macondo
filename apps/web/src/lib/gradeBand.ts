import { gradeBand as sharedGradeBand, type GradeBand } from '@macondo/shared';

export type { GradeBand };

export const GRADE_BAND_STORAGE_KEY = 'macondo.gradeBand';
export const GRADE_BANDS: GradeBand[] = ['1-3', '4-5', '6-8', '9-11'];

export interface BandConfig {
  id: GradeBand;
  label: string;
  /** Grados incluidos (para filtrar catálogo). */
  grades: [number, number];
  /** Grado representativo para el filtro `grade` de la API. */
  defaultGrade: number;
  /** Densidad de interfaz: 'xl' (íconos grandes, poco texto) … 'compact' (más información). */
  density: 'xl' | 'lg' | 'md' | 'compact';
  /** Mostrar descripciones largas de módulos. */
  showDescriptions: boolean;
  /** Columnas del grid de módulos en pantallas medianas. */
  moduleColumns: 2 | 3;
  greeting: string;
  subtitle: string;
  catalogTitle: string;
  challengeIntro: string;
  /** Tono del texto de cada módulo. */
  moduleCopy: Record<ModuleId, string>;
}

export type ModuleId = 'biblioteca' | 'audiolibros' | 'audiobiografias' | 'audioresumenes' | 'galerias' | 'retos' | 'cuentos';

export const BAND_CONFIG: Record<GradeBand, BandConfig> = {
  '1-3': {
    id: '1-3',
    label: '1.º a 3.º',
    grades: [1, 3],
    defaultGrade: 2,
    density: 'xl',
    showDescriptions: false,
    moduleColumns: 2,
    greeting: '¡Hola! ¿Qué quieres hacer hoy?',
    subtitle: 'Toca un dibujo para empezar.',
    catalogTitle: 'Cuentos y libros',
    challengeIntro: '¡Juega y gana insignias!',
    moduleCopy: {
      biblioteca: 'Leer cuentos',
      audiolibros: 'Escuchar cuentos',
      audiobiografias: 'Personas que inspiran',
      audioresumenes: 'Historias cortitas',
      galerias: 'Ver imágenes',
      retos: 'Jugar',
      cuentos: 'Inventar un cuento',
    },
  },
  '4-5': {
    id: '4-5',
    label: '4.º y 5.º',
    grades: [4, 5],
    defaultGrade: 4,
    density: 'lg',
    showDescriptions: true,
    moduleColumns: 3,
    greeting: '¡Bienvenido, explorador!',
    subtitle: 'Elige tu próxima aventura: historias, ciencia y retos te esperan.',
    catalogTitle: 'Explora la biblioteca',
    challengeIntro: 'Pon a prueba lo que leíste y desbloquea insignias de explorador.',
    moduleCopy: {
      biblioteca: 'Aventuras, ciencia e historietas para leer',
      audiolibros: 'Historias narradas para escuchar donde quieras',
      audiobiografias: 'Conoce la vida de personajes asombrosos',
      audioresumenes: 'Lo más importante de una obra, en pocos minutos',
      galerias: 'Imágenes para explorar con zoom',
      retos: 'Trivias y secuencias para ganar insignias',
      cuentos: 'Escoge personaje, lugar y enseñanza: el cuento es tuyo',
    },
  },
  '6-8': {
    id: '6-8',
    label: '6.º a 8.º',
    grades: [6, 8],
    defaultGrade: 7,
    density: 'md',
    showDescriptions: true,
    moduleColumns: 3,
    greeting: 'Tu biblioteca, a tu ritmo',
    subtitle: 'Literatura juvenil, historia e investigación. Tú decides qué leer.',
    catalogTitle: 'Catálogo',
    challengeIntro: 'Retos de comprensión para lectores autónomos.',
    moduleCopy: {
      biblioteca: 'Literatura juvenil, historia y textos para investigar',
      audiolibros: 'Obras narradas con control de velocidad',
      audiobiografias: 'Biografías narradas con contexto histórico',
      audioresumenes: 'Síntesis de obras con ideas principales',
      galerias: 'Colecciones visuales para analizar',
      retos: 'Comprensión lectora, secuencias y personajes',
      cuentos: 'Taller de cuentos (por ahora, para primaria)',
    },
  },
  '9-11': {
    id: '9-11',
    label: '9.º a 11.º',
    grades: [9, 11],
    defaultGrade: 10,
    density: 'compact',
    showDescriptions: true,
    moduleColumns: 3,
    greeting: 'Lectura crítica y literatura universal',
    subtitle: 'Analiza, contrasta y argumenta. Recursos de apoyo para la preparación lectora de Saber 11.',
    catalogTitle: 'Catálogo general',
    challengeIntro: 'Ejercicios de lectura crítica: inferencia, intención del autor y estructura textual.',
    moduleCopy: {
      biblioteca: 'Literatura universal y textos para análisis crítico',
      audiolibros: 'Obras completas narradas',
      audiobiografias: 'Trayectorias de autores, científicos y líderes',
      audioresumenes: 'Síntesis analíticas: tesis, contexto y estructura',
      galerias: 'Fuentes visuales: arte, historia y patrimonio',
      retos: 'Práctica de lectura crítica tipo Saber 11',
      cuentos: 'Taller de cuentos (por ahora, para primaria)',
    },
  },
};

/** Bandas que ven el módulo «Taller de cuentos» en el inicio (la página comprueba además la API). */
export const CUENTOS_BANDS: GradeBand[] = ['1-3', '4-5'];
/** Módulos visibles para una banda: el taller de cuentos solo en primaria (ADR-018). */
export function moduleVisible(id: ModuleId, band: GradeBand): boolean {
  return id !== 'cuentos' || CUENTOS_BANDS.includes(band);
}

export function isGradeBand(value: unknown): value is GradeBand {
  return typeof value === 'string' && (GRADE_BANDS as string[]).includes(value);
}

/** Interpreta lo guardado en localStorage (cadena JSON o cruda) y devuelve una banda válida o null. */
export function parseStoredBand(raw: string | null | undefined): GradeBand | null {
  if (raw == null) return null;
  let v: unknown = raw;
  try {
    v = JSON.parse(raw);
  } catch {
    /* valor crudo */
  }
  return isGradeBand(v) ? v : null;
}

export function bandForGrade(grade: number): GradeBand {
  return sharedGradeBand(Math.min(11, Math.max(1, Math.round(grade))));
}

export function bandConfig(band: GradeBand | null): BandConfig {
  return BAND_CONFIG[band ?? '6-8'];
}

/** ¿Un recurso (rango de grados) es adecuado para la banda? Intersección de rangos. */
export function resourceFitsBand(r: { gradeMin: number; gradeMax: number }, band: GradeBand): boolean {
  const [min, max] = BAND_CONFIG[band].grades;
  return r.gradeMin <= max && r.gradeMax >= min;
}
