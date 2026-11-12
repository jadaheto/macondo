/**
 * Contrato compartido de Macondo Digital (API <-> Web).
 * Cualquier cambio aquí debe reflejarse en apps/api y apps/web y en docs/ARCHITECTURE.md.
 */
import { z } from 'zod';

export const RESOURCE_TYPES = ['BOOK', 'AUDIOBOOK', 'AUDIOBIOGRAPHY', 'AUDIOSUMMARY', 'GALLERY'] as const;
export const ResourceTypeSchema = z.enum(RESOURCE_TYPES);
export type ResourceType = z.infer<typeof ResourceTypeSchema>;

export const RESOURCE_TYPE_LABELS: Record<ResourceType, string> = {
  BOOK: 'Libro digital',
  AUDIOBOOK: 'Audiolibro',
  AUDIOBIOGRAPHY: 'Audiobiografía',
  AUDIOSUMMARY: 'Audioresumen',
  GALLERY: 'Galería interactiva',
};

/**
 * Metas de capacidad (no archivos adquiridos). Total 570 recursos + 100 retos lectores.
 * Fijadas por el usuario el 2026-10-31 (antes: 229 = 100/59/30/20/20).
 */
export const CAPACITY_TARGETS: Record<ResourceType, number> = {
  BOOK: 300,
  AUDIOBOOK: 100,
  AUDIOBIOGRAPHY: 50,
  AUDIOSUMMARY: 20,
  GALLERY: 100,
};
/** Meta explícita de retos lectores (no son recursos de archivo; no suman a CAPACITY_TARGETS). */
export const CHALLENGE_TARGET = 100;

export const FILE_FORMATS = ['EPUB', 'PDF', 'MP3', 'IMAGE_SET', 'NONE'] as const;
export const FileFormatSchema = z.enum(FILE_FORMATS);
export type FileFormat = z.infer<typeof FileFormatSchema>;

export const RESOURCE_STATUSES = ['DRAFT', 'PUBLISHED', 'RETIRED'] as const;
export const ResourceStatusSchema = z.enum(RESOURCE_STATUSES);
export type ResourceStatus = z.infer<typeof ResourceStatusSchema>;

export const ROLES = ['ADMIN', 'LIBRARIAN'] as const;
export const RoleSchema = z.enum(ROLES);
export type Role = z.infer<typeof RoleSchema>;

export const GradeSchema = z.number().int().min(1).max(11);

export type GradeBand = '1-3' | '4-5' | '6-8' | '9-11';
export function gradeBand(grade: number): GradeBand {
  if (grade <= 3) return '1-3';
  if (grade <= 5) return '4-5';
  if (grade <= 8) return '6-8';
  return '9-11';
}

/** Licencia de contenido. Licencia de software != licencia de contenidos. */
export const LicenseSchema = z.object({
  rightsHolder: z.string().min(1).max(200),
  licenseName: z.string().min(1).max(200), // p.ej. "Dominio público", "CC BY 4.0", "Contrato #123"
  licenseUrl: z.string().url().max(500).nullable().optional(),
  authorizedDevices: z.number().int().min(0).max(10000), // nº de dispositivos autorizados
  offlineAllowed: z.boolean(),
  validFrom: z.string().datetime().nullable().optional(),
  validUntil: z.string().datetime().nullable().optional(), // null = sin vencimiento declarado
  territory: z.string().max(100).default('CO'),
});
export type License = z.infer<typeof LicenseSchema>;

/** Pregunta de comprensión (formato de trivia de retos, galerías y audiobiografías). */
export const TriviaQuestionSchema = z.object({
  prompt: z.string().min(1).max(500),
  options: z.array(z.string().min(1).max(300)).min(2).max(6),
  answer: z.number().int().min(0),
  explanation: z.string().max(1000).default(''),
}).refine((q) => q.answer < q.options.length, { message: 'answer debe ser un índice válido de options', path: ['answer'] });
export type TriviaQuestion = z.infer<typeof TriviaQuestionSchema>;

/** Campos extra opcionales de un recurso (audiobiografías/audioresúmenes; ver catalogo-dp/FORMATO.md). */
export const ResourceExtraSchema = z.object({
  text: z.string().max(50000).optional(),
  relatedTitle: z.string().max(300).nullable().optional(),
  relatedCreator: z.string().max(200).nullable().optional(),
  timeline: z.array(z.object({ year: z.number().int().min(-3000).max(2100), event: z.string().min(1).max(500) })).max(60).optional(),
  funFacts: z.array(z.string().min(1).max(600)).max(30).optional(),
  questions: z.array(TriviaQuestionSchema).max(30).optional(),
  /** Cuento del Taller de cuentos del que se creó el recurso (ADR-018). */
  cuentoId: z.string().max(64).optional(),
});
export type ResourceExtra = z.infer<typeof ResourceExtraSchema>;

/** Objeto base (sin refine): úsese para derivar esquemas parciales (PATCH). */
export const ResourceInputBaseSchema = z.object({
  title: z.string().min(1).max(300),
  creator: z.string().min(1).max(200),
  type: ResourceTypeSchema,
  description: z.string().max(5000).default(''),
  gradeMin: GradeSchema,
  gradeMax: GradeSchema,
  categories: z.array(z.string().min(1).max(60)).max(20).default([]),
  language: z.string().max(10).default('es'),
  narrator: z.string().max(200).nullable().optional(),
  durationSeconds: z.number().int().min(0).nullable().optional(),
  license: LicenseSchema,
  extra: ResourceExtraSchema.nullable().optional(),
});
export const ResourceInputSchema = ResourceInputBaseSchema
  .refine((r) => r.gradeMin <= r.gradeMax, { message: 'gradeMin debe ser <= gradeMax', path: ['gradeMin'] });
export type ResourceInput = z.infer<typeof ResourceInputSchema>;

/** PATCH parcial de recurso: objeto base en parcial; la licencia también es parcial. */
export const ResourcePatchSchema = ResourceInputBaseSchema
  .omit({ license: true })
  .partial()
  .extend({ license: LicenseSchema.partial().optional() })
  .strict();
export type ResourcePatch = z.infer<typeof ResourcePatchSchema>;

export interface ResourceDTO {
  id: string;
  title: string;
  creator: string;
  type: ResourceType;
  description: string;
  gradeMin: number;
  gradeMax: number;
  categories: string[];
  language: string;
  narrator: string | null;
  durationSeconds: number | null;
  format: FileFormat;
  hasFile: boolean;
  hasCover: boolean;
  fileSha256: string | null;
  fileSizeBytes: number | null;
  status: ResourceStatus;
  license: License;
  /** Datos extra (línea de tiempo, datos curiosos, preguntas, texto, obra relacionada) o null. */
  extra: ResourceExtra | null;
  /** Calculado por la API: licencia vigente hoy y recurso publicado */
  accessible: boolean;
  createdAt: string;
  updatedAt: string;
}

export const CatalogQuerySchema = z.object({
  q: z.string().max(100).optional(),
  type: ResourceTypeSchema.optional(),
  grade: z.coerce.number().int().min(1).max(11).optional(),
  category: z.string().max(60).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(24),
});
export type CatalogQuery = z.infer<typeof CatalogQuerySchema>;

export interface Paginated<T> { items: T[]; total: number; page: number; pageSize: number }

export const LoginSchema = z.object({ email: z.string().email(), password: z.string().min(8).max(200) });
/** Cambio de contraseña del usuario autenticado (personal de biblioteca). */
export const PASSWORD_MIN_LENGTH = 10;
export const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1).max(200),
    newPassword: z
      .string()
      .min(PASSWORD_MIN_LENGTH, `La nueva contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres`)
      .max(200)
      .refine((p) => /[A-Za-z]/.test(p) && /\d/.test(p), 'La nueva contraseña debe combinar letras y números'),
  })
  .refine((b) => b.currentPassword !== b.newPassword, { message: 'La nueva contraseña debe ser distinta de la actual', path: ['newPassword'] });
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;
export interface LoginResponse { accessToken: string; user: { id: string; email: string; name: string; role: Role } }

export const TvSlideKindSchema = z.enum(['BOOK_OF_WEEK', 'FEATURED_AUTHOR', 'FUN_FACT', 'GALLERY', 'AGENDA', 'CHALLENGE', 'MESSAGE', 'TUTORIAL']);
export type TvSlideKind = z.infer<typeof TvSlideKindSchema>;
export const TvSlideInputSchema = z.object({
  kind: TvSlideKindSchema,
  title: z.string().min(1).max(200),
  body: z.string().max(2000).default(''),
  resourceId: z.string().nullable().optional(),
  order: z.number().int().min(0).default(0),
  durationSeconds: z.number().int().min(3).max(600).default(20),
  startsAt: z.string().datetime().nullable().optional(),
  endsAt: z.string().datetime().nullable().optional(),
  active: z.boolean().default(true),
});
export type TvSlideInput = z.infer<typeof TvSlideInputSchema>;
export interface TvSlideDTO extends TvSlideInput {
  id: string;
  resource?: (Pick<ResourceDTO, 'id' | 'title' | 'creator' | 'type' | 'hasCover'> & { description?: string }) | null;
}

/** Los 6 bloques de la programación de Macondo TV (orden de la rotación) y su etiqueta en pantalla. */
export const TV_BLOCKS = ['BOOK_OF_WEEK', 'AGENDA', 'FUN_FACT', 'FEATURED_AUTHOR', 'CHALLENGE', 'TUTORIAL'] as const;
export type TvBlock = (typeof TV_BLOCKS)[number];
export const TV_BLOCK_LABELS: Record<TvBlock, string> = {
  BOOK_OF_WEEK: 'Libro recomendado de la semana',
  AGENDA: 'Agenda de actividades culturales',
  FUN_FACT: 'Curiosidades literarias',
  FEATURED_AUTHOR: 'Autor colombiano o sucreño destacado',
  CHALLENGE: 'Frases y retos de lectura',
  TUTORIAL: 'Tutorial: kiosco y tablets',
};
/** Cada tipo de diapositiva cae en uno de los 6 bloques (GALLERY → curiosidades; MESSAGE → agenda/avisos). */
export const TV_KIND_BLOCK: Record<TvSlideKind, TvBlock> = {
  BOOK_OF_WEEK: 'BOOK_OF_WEEK',
  AGENDA: 'AGENDA',
  MESSAGE: 'AGENDA',
  FUN_FACT: 'FUN_FACT',
  GALLERY: 'FUN_FACT',
  FEATURED_AUTHOR: 'FEATURED_AUTHOR',
  CHALLENGE: 'CHALLENGE',
  TUTORIAL: 'TUTORIAL',
};
export const TV_DEFAULT_SLIDE_SECONDS = 20;

/** Manifest offline: lista de recursos descargables con versión y hash para verificar integridad. */
export interface OfflineAsset { url: string; sha256: string; sizeBytes: number; mime: string }
export interface OfflineManifestEntry {
  id: string; title: string; type: ResourceType; format: FileFormat;
  sha256: string; sizeBytes: number; version: string; fileUrl: string; coverUrl: string | null;
  licenseValidUntil: string | null;
  /** IMAGE_SET: imágenes individuales (cada una con su sha256) y URL del JSON de la galería. */
  assets?: OfflineAsset[];
  galleryUrl?: string;
}
export interface OfflineManifest { generatedAt: string; version: string; entries: OfflineManifestEntry[] }

/** Reglas de acceso a contenido: puro, testeable, usado por API (y web para mensajes). */
export function isLicenseActive(license: Pick<License, 'validFrom' | 'validUntil'>, now: Date = new Date()): boolean {
  if (license.validFrom && new Date(license.validFrom) > now) return false;
  if (license.validUntil && new Date(license.validUntil) < now) return false;
  return true;
}
export function isResourceAccessible(r: { status: ResourceStatus; license: Pick<License, 'validFrom' | 'validUntil'> }, now = new Date()): boolean {
  return r.status === 'PUBLISHED' && isLicenseActive(r.license, now);
}
export function canDownloadOffline(r: { status: ResourceStatus; hasFile: boolean; license: Pick<License, 'validFrom' | 'validUntil' | 'offlineAllowed' | 'authorizedDevices'> }, now = new Date()): boolean {
  return isResourceAccessible(r, now) && r.hasFile && r.license.offlineAllowed && r.license.authorizedDevices > 0;
}

/** Anchos permitidos de miniatura de portada (`GET /api/resources/:id/cover?w=`). Sin `w` → original. */
export const COVER_THUMB_WIDTHS = [240, 480] as const;
export type CoverThumbWidth = (typeof COVER_THUMB_WIDTHS)[number];
/** Ancho de miniatura para cuadrículas (catálogo, kiosco, offline) y para fichas/TV. */
export const COVER_GRID_WIDTH: CoverThumbWidth = 240;
export const COVER_LARGE_WIDTH: CoverThumbWidth = 480;

/** Rutas de la API REST (prefijo /api). */
export const API_ROUTES = {
  health: '/api/health',
  login: '/api/auth/login',
  password: '/api/auth/password',                 // POST ChangePasswordInput (autenticado) -> { ok: true }
  me: '/api/auth/me',
  catalog: '/api/resources',                       // GET ?q&type&grade&category&page&pageSize -> Paginated<ResourceDTO> (solo PUBLISHED)
  resource: (id: string) => `/api/resources/${id}`, // GET -> ResourceDTO
  resourceFile: (id: string) => `/api/resources/${id}/file`,   // GET stream (Range) si accessible; 403 si licencia no vigente
  resourceCover: (id: string, w?: CoverThumbWidth) => `/api/resources/${id}/cover${w ? `?w=${w}` : ''}`, // GET imagen (w=240|480 → miniatura WebP)
  resourceGallery: (id: string) => `/api/resources/${id}/gallery`,                       // GET -> GalleryDTO si accessible; 403 si licencia no vigente
  resourceGalleryImage: (id: string, index: number) => `/api/resources/${id}/gallery/${index}`, // GET imagen
  challenges: '/api/challenges',                   // GET ?band&resourceId -> ChallengeDTO[] (solo activos)
  offlineManifest: '/api/offline/manifest',        // GET -> OfflineManifest (solo canDownloadOffline)
  tvSchedule: '/api/tv/schedule',                  // GET -> TvSlideDTO[] activos y vigentes ahora, ordenados
  adminResources: '/api/admin/resources',          // GET (todos los estados), POST ResourceInput
  adminResource: (id: string) => `/api/admin/resources/${id}`, // PATCH parcial, DELETE -> RETIRED (no borra)
  adminResourceStatus: (id: string) => `/api/admin/resources/${id}/status`, // POST {status}
  adminResourceFile: (id: string) => `/api/admin/resources/${id}/file`,     // POST multipart 'file'
  adminResourceCover: (id: string) => `/api/admin/resources/${id}/cover`,   // POST multipart 'file'
  adminTvSlides: '/api/admin/tv/slides',           // GET, POST TvSlideInput
  adminTvSlide: (id: string) => `/api/admin/tv/slides/${id}`, // PATCH, DELETE
  adminStats: '/api/admin/stats',                  // GET agregados (conteos por tipo/estado/grado, metas de capacidad)
  adminAudit: '/api/admin/audit',                  // GET últimas acciones administrativas (solo ADMIN)
  adminChallenges: '/api/admin/challenges',        // GET todos (activos e inactivos)
  adminChallengesImport: '/api/admin/challenges/import', // POST ChallengeImport[] (idempotente por id)
  adminChallengeActive: (id: string) => `/api/admin/challenges/${id}/active`, // POST {active}
  adminResourceNarrate: (id: string) => `/api/admin/resources/${id}/narrar`, // POST NarrateInput -> ResourceDTO (MP3 sintetizado en el servidor)
  adminTtsStatus: '/api/admin/tts/estado',         // GET -> TtsStatus
  // Taller de cuentos (ADR-018)
  cuentos: '/api/cuentos',                          // POST CuentoOpciones -> CuentoCreadoDTO (crea el trabajo; 429 si se supera el límite)
  cuento: (id: string) => `/api/cuentos/${id}`,     // GET -> CuentoDTO (estado + contenido + audio)
  cuentoAudio: (id: string) => `/api/cuentos/${id}/audio`, // GET stream MP3 (Range) cuando el audio está listo
  cuentoImagen: (id: string) => `/api/cuentos/${id}/imagen`, // GET JPEG de la ilustración (ADR-020) cuando está lista y no está oculta
  adminCuentoImagen: (id: string) => `/api/admin/cuentos/${id}/imagen`, // POST { oculta } -> CuentoAdminDTO (la bibliotecaria oculta/muestra la ilustración)
  cuentosDisponible: '/api/cuentos/disponible',     // GET -> CuentosDisponibleDTO
  adminCuentos: '/api/admin/cuentos',               // GET ?status -> CuentoAdminDTO[]
  adminCuento: (id: string) => `/api/admin/cuentos/${id}`, // GET -> CuentoAdminDTO
  adminCuentoRevisar: (id: string) => `/api/admin/cuentos/${id}/revisar`, // POST CuentoRevisar -> CuentoAdminDTO (APROBAR crea recursos)
} as const;

/* ───────────────────────── Narración sintética (TTS en el servidor, ADR-017) ───────────────────────── */

/** Crédito que se escribe en `narrator` al regrabar con la voz de la biblioteca (voz Piper davefx, datos CC0). */
export const TTS_VOICE_CREDIT = 'Voz sintética Piper es_ES-davefx-medium (datos CC0)';
/** Nombre corto de la voz para mostrar en el panel. */
export const TTS_VOICE_NAME = 'Piper davefx';
export const TTS_LIMITS = {
  /** Máximo de caracteres por narración (≈ 40 min de audio). */
  maxChars: 40_000,
  /** Tamaño orientativo de cada trozo enviado a Piper (Piper divide en frases por su cuenta). */
  chunkChars: 4_000,
} as const;

/** Estado del motor de narración (`GET /api/admin/tts/estado`). `ok` = binario y voz presentes. */
export interface TtsStatus {
  enabled: boolean;
  engine: string;
  voice: string;
  ok: boolean;
  /** Motivo cuando `ok` es false (p. ej. «binario no encontrado»). */
  detail: string | null;
}

/** Cuerpo de `POST /api/admin/resources/:id/narrar`. Sin `text` se usa `extra.text` del recurso. */
export const NarrateInputSchema = z.object({
  text: z.string().min(1).max(TTS_LIMITS.maxChars).optional(),
  /** Velocidad: 1 = la de la voz; >1 más lento. */
  lengthScale: z.number().min(0.5).max(2).optional(),
  /** Silencio entre frases, en segundos. */
  sentenceSilence: z.number().min(0).max(2).optional(),
}).strict();
export type NarrateInput = z.infer<typeof NarrateInputSchema>;

export const ALLOWED_UPLOADS: Record<string, { format: FileFormat; mime: string[]; magic?: string }> = {
  epub: { format: 'EPUB', mime: ['application/epub+zip'], magic: '504b0304' },
  pdf: { format: 'PDF', mime: ['application/pdf'], magic: '25504446' },
  mp3: { format: 'MP3', mime: ['audio/mpeg', 'audio/mp3'] }, // magic: 'ID3' (494433) o frame sync 0xFFE*
  zip: { format: 'IMAGE_SET', mime: ['application/zip', 'application/x-zip-compressed'], magic: '504b0304' }, // solo recursos GALLERY
};

/* ───────────────────────── Galerías (IMAGE_SET) ───────────────────────── */

export const GALLERY_LIMITS = {
  maxEntries: 60,
  maxUncompressedBytes: 300 * 1024 * 1024,
  /** Proporción máxima descomprimido/comprimido por entrada (anti zip-bomb). */
  maxCompressionRatio: 100,
  maxItems: 60,
} as const;

const urlOrNull = z.string().url().max(1000).nullable().optional();

/** Una imagen dentro de gallery.json (ver catalogo-dp/FORMATO.md). */
export const GalleryManifestItemSchema = z.object({
  file: z.string().regex(/^[A-Za-z0-9][\w .()-]{0,150}\.(jpe?g|png|webp)$/i, 'file debe ser un nombre de imagen JPG/PNG/WebP sin carpetas'),
  alt: z.string().min(1).max(500),
  caption: z.string().max(1500).default(''),
  credit: z.string().min(1).max(300),
  license: z.string().min(1).max(120),
  licenseUrl: urlOrNull,
  sourceUrl: urlOrNull,
});
export const GalleryActivitySchema = z.object({ kind: z.literal('trivia'), questions: z.array(TriviaQuestionSchema).min(1).max(30) });
export type GalleryActivity = z.infer<typeof GalleryActivitySchema>;

/** gallery.json completo. */
export const GalleryManifestSchema = z.object({
  slug: z.string().regex(/^[a-z0-9][a-z0-9-]{0,79}$/).optional(),
  title: z.string().min(1).max(300),
  description: z.string().max(5000).default(''),
  items: z.array(GalleryManifestItemSchema).min(1).max(GALLERY_LIMITS.maxItems),
  activity: GalleryActivitySchema.nullable().optional(),
});
export type GalleryManifest = z.infer<typeof GalleryManifestSchema>;

export interface GalleryItemDTO {
  url: string; alt: string; caption: string; credit: string; license: string;
  licenseUrl: string | null; sourceUrl: string | null;
  mime: string; sha256: string; sizeBytes: number;
}
export interface GalleryDTO { title: string; description: string; items: GalleryItemDTO[]; activity: GalleryActivity | null }

/* ───────────────────────── Retos lectores ───────────────────────── */

export const GRADE_BANDS = ['1-3', '4-5', '6-8', '9-11'] as const;
export const GradeBandSchema = z.enum(GRADE_BANDS);
export const CHALLENGE_KINDS = ['trivia', 'sequence', 'match'] as const;
export type ChallengeKind = (typeof CHALLENGE_KINDS)[number];

const challengeBase = {
  id: z.string().regex(/^[a-z0-9][a-z0-9-]{0,79}$/, 'id debe ser un slug (minúsculas, números y guiones)'),
  title: z.string().min(1).max(200),
  source: z.string().max(500).default(''),
  bands: z.array(GradeBandSchema).min(1).max(4),
  resource: z.object({ title: z.string().min(1).max(300), creator: z.string().min(1).max(200) }).nullable().optional(),
  text: z.string().max(5000).default(''),
};
export const MatchPairSchema = z.object({ left: z.string().min(1).max(200), right: z.string().min(1).max(400) });
export type MatchPair = z.infer<typeof MatchPairSchema>;

/** Un reto de catalogo-dp/retos/retos.json. Campos no aplicables al tipo se ignoran. */
export const ChallengeImportSchema = z.discriminatedUnion('kind', [
  z.object({ ...challengeBase, kind: z.literal('trivia'), questions: z.array(TriviaQuestionSchema).min(1).max(30) }),
  z.object({ ...challengeBase, kind: z.literal('sequence'), steps: z.array(z.string().min(1).max(400)).min(2).max(15) }),
  z.object({ ...challengeBase, kind: z.literal('match'), pairs: z.array(MatchPairSchema).min(2).max(12) }),
]);
export type ChallengeImport = z.infer<typeof ChallengeImportSchema>;
export const ChallengeImportArraySchema = z.array(ChallengeImportSchema).min(1).max(1000);
export const ChallengeQuerySchema = z.object({ band: GradeBandSchema.optional(), resourceId: z.string().max(64).optional() });
export const ChallengeActiveSchema = z.object({ active: z.boolean() });

type ChallengeCommon = { id: string; title: string; source: string; bands: GradeBand[]; text: string;
  resource: { id: string; title: string; creator: string; type: ResourceType } | null; active: boolean };
export type ChallengeDTO = ChallengeCommon & (
  | { kind: 'trivia'; questions: TriviaQuestion[] }
  | { kind: 'sequence'; steps: string[] }
  | { kind: 'match'; pairs: MatchPair[] }
);
export interface ChallengeImportResult { created: number; updated: number; unresolved: string[]; total: number }

/* ───────────────────────── Administración ───────────────────────── */

/** Estadísticas SOLO agregadas: sin identidades de estudiantes ni rankings nominales. */
export interface AdminStatsDTO {
  generatedAt: string;
  totals: { resources: number; published: number; capacityTarget: number };
  byStatus: Record<ResourceStatus, number>;
  byType: Array<{
    type: ResourceType; label: string; target: number; total: number;
    byStatus: Record<ResourceStatus, number>; publishedProgress: number;
  }>;
  /** Recursos PUBLICADOS que cubren cada grado (gradeMin <= g <= gradeMax). */
  gradeCoverage: Array<{ grade: number; published: number }>;
  licenses: { publishedWithActiveLicense: number; publishedWithInactiveLicense: number; offlineAllowed: number };
  files: { withFile: number; withoutFile: number; totalBytes: number };
  /** Aperturas de archivo agregadas por día (últimos 30 días), sin identidad. */
  usageLast30Days: { fileOpens: number };
  /** Retos activos (no son recursos de archivo). */
  challenges?: { active: number; total: number; target: number };
  /** Taller de cuentos (ADR-018): conteos agregados por estado; sin nombres de autores. */
  cuentos?: { pendientes: number; aprobados: number; rechazados: number; total: number };
}

export interface AuditEntryDTO {
  id: string; action: string; entity: string; entityId: string | null; details: unknown; createdAt: string;
  actor: { id: string; email: string; name: string; role: Role } | null;
}

/* ───────────────────────── Taller de cuentos (ADR-018) ───────────────────────── */

/** Bandas que pueden usar el taller (configurable con CUENTOS_BANDAS; por defecto 1-3 y 4-5). */
export const CUENTO_BANDAS_DEFAULT: GradeBand[] = ['1-3', '4-5'];

export const CUENTO_TIPOS = ['nino', 'animal', 'robot', 'leyenda'] as const;
export type CuentoTipo = (typeof CUENTO_TIPOS)[number];
export const CUENTO_LUGARES = ['covenas', 'mojana', 'sincelejo', 'espacio'] as const;
export type CuentoLugar = (typeof CUENTO_LUGARES)[number];
export const CUENTO_VALORES = ['amistad', 'valentia', 'curiosidad', 'cuidado'] as const;
export type CuentoValor = (typeof CUENTO_VALORES)[number];

export interface CuentoOpcionInfo { id: string; emoji: string; titulo: string; detalle: string }
/** Opciones cerradas del asistente (texto exacto de la interfaz). Solo estos ids viajan al proveedor de IA. */
export const CUENTO_OPCIONES: {
  tipos: Record<CuentoTipo, CuentoOpcionInfo>;
  lugares: Record<CuentoLugar, CuentoOpcionInfo>;
  valores: Record<CuentoValor, CuentoOpcionInfo>;
} = {
  tipos: {
    nino: { id: 'nino', emoji: '👧👦', titulo: 'Una niña o un niño', detalle: 'alguien como tú, con una mochila llena de ideas' },
    animal: { id: 'animal', emoji: '🦊', titulo: 'Un animal ingenioso', detalle: 'un zorro, una iguana o un manatí que siempre encuentra la salida' },
    robot: { id: 'robot', emoji: '🤖', titulo: 'Un robot curioso', detalle: 'recién llegado, quiere entenderlo todo' },
    leyenda: { id: 'leyenda', emoji: '🦋', titulo: 'Un ser de leyenda', detalle: 'una criatura de los cuentos de la abuela' },
  },
  lugares: {
    covenas: { id: 'covenas', emoji: '🏖️', titulo: 'Playas de Coveñas', detalle: 'arena tibia, cangrejos y un mar que guarda secretos' },
    mojana: { id: 'mojana', emoji: '🌿', titulo: 'Ciénagas de la Mojana', detalle: 'agua, garzas y caminos que cambian con la lluvia' },
    sincelejo: { id: 'sincelejo', emoji: '🏘️', titulo: 'Sincelejo', detalle: 'la plaza, las calles y la banda que ensaya para las fiestas' },
    espacio: { id: 'espacio', emoji: '🚀', titulo: 'Una estación en el espacio', detalle: 'desde allá arriba se ve todo Sucre' },
  },
  valores: {
    amistad: { id: 'amistad', emoji: '🤝', titulo: 'Juntos llegamos más lejos', detalle: 'amistad y trabajo en equipo' },
    valentia: { id: 'valentia', emoji: '💪', titulo: 'Atreverse da miedo, y se puede', detalle: 'valentía y confianza' },
    curiosidad: { id: 'curiosidad', emoji: '🔍', titulo: 'Preguntar es el primer paso', detalle: 'curiosidad y ganas de aprender' },
    cuidado: { id: 'cuidado', emoji: '🌱', titulo: 'Cuidar lo que nos rodea', detalle: 'el agua, los animales y el entorno' },
  },
};

/** Nombres (autor y protagonista): letras (con tildes/ñ), espacios, apóstrofo y guion; 2–30 caracteres. */
export const CUENTO_NOMBRE_RE = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ][A-Za-zÁÉÍÓÚÜÑáéíóúüñ' -]{0,28}[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]$/;
export const CUENTO_NOMBRE_MAX = 30;
export const CuentoNombreSchema = z.string().trim().min(2).max(CUENTO_NOMBRE_MAX).regex(CUENTO_NOMBRE_RE, 'Solo letras, espacios, apóstrofo y guion');

/** Longitud del cuento por banda (palabras) y de cada pieza; el proveedor se valida contra esto. */
export const CUENTO_LIMITES = {
  palabras: { '1-3': { min: 180, max: 320 }, '4-5': { min: 350, max: 600 } } as Record<string, { min: number; max: number }>,
  /** Tolerancia al validar (el modelo no cuenta exacto): ±20 % sobre el rango. */
  tolerancia: 0.2,
  sinopsisPalabras: 40,
  preguntas: 3,
  opcionesPorPregunta: 3,
  glosario: { min: 2, max: 4 },
  parrafos: { min: 3, max: 14 },
} as const;

/** Entrada pública: solo opciones cerradas + nombres validados. `autorNombre` NUNCA se envía al proveedor. */
export const CuentoOpcionesSchema = z.object({
  banda: GradeBandSchema,
  autorNombre: CuentoNombreSchema.optional().nullable(),
  protagonista: CuentoNombreSchema,
  tipo: z.enum(CUENTO_TIPOS),
  lugar: z.enum(CUENTO_LUGARES),
  valor: z.enum(CUENTO_VALORES),
  /** Identificador aleatorio del dispositivo (localStorage); el servidor guarda solo un hash para el límite por hora. */
  deviceId: z.string().min(8).max(80).regex(/^[A-Za-z0-9_-]+$/),
}).strict();
export type CuentoOpciones = z.infer<typeof CuentoOpcionesSchema>;

export const CuentoPreguntaSchema = z.object({
  pregunta: z.string().min(5).max(300),
  opciones: z.array(z.string().min(1).max(160)).length(CUENTO_LIMITES.opcionesPorPregunta),
  respuesta: z.number().int().min(0).max(CUENTO_LIMITES.opcionesPorPregunta - 1),
  explicacion: z.string().max(400).default(''),
});
/** JSON estricto que debe devolver el modelo (y que produce el modo plantilla). */
export const CuentoGeneradoSchema = z.object({
  titulo: z.string().min(3).max(90),
  sinopsis: z.string().min(10).max(400),
  parrafos: z.array(z.string().min(10).max(1500)).min(CUENTO_LIMITES.parrafos.min).max(CUENTO_LIMITES.parrafos.max),
  preguntas: z.array(CuentoPreguntaSchema).length(CUENTO_LIMITES.preguntas),
  glosario: z.array(z.object({ palabra: z.string().min(2).max(40), significado: z.string().min(5).max(300) })).min(CUENTO_LIMITES.glosario.min).max(CUENTO_LIMITES.glosario.max),
  valorRecordatorio: z.string().min(5).max(300),
});
export type CuentoGenerado = z.infer<typeof CuentoGeneradoSchema>;

export const CUENTO_STATUSES = ['GENERATING', 'GENERATED', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'FAILED'] as const;
export type CuentoStatus = (typeof CUENTO_STATUSES)[number];
export const CUENTO_STATUS_LABELS: Record<CuentoStatus, string> = {
  GENERATING: 'Escribiéndose',
  GENERATED: 'Texto listo (audio en proceso)',
  PENDING_REVIEW: 'Pendiente de revisión',
  APPROVED: 'Aprobado y publicado',
  REJECTED: 'Rechazado',
  FAILED: 'Falló',
};
export const CUENTO_MODOS = ['ia', 'plantilla'] as const;
export type CuentoModo = (typeof CUENTO_MODOS)[number];

export interface CuentosDisponibleDTO { habilitado: boolean; bandas: GradeBand[]; modo: CuentoModo }
export interface CuentoCreadoDTO { id: string; status: CuentoStatus }
/** Vista pública de un cuento: sin hash de dispositivo ni datos de revisión internos. */
export interface CuentoDTO {
  id: string;
  status: CuentoStatus;
  modo: CuentoModo;
  banda: GradeBand;
  titulo: string;
  autorNombre: string | null;
  protagonista: string;
  tipo: CuentoTipo;
  lugar: CuentoLugar;
  valor: CuentoValor;
  contenido: CuentoGenerado | null;
  audio: { listo: boolean; url: string | null; durationSeconds: number | null; pendiente: boolean };
  /**
   * Ilustración generada con IA a partir de las opciones cerradas (ADR-020). `listo` = hay imagen y no está oculta;
   * `pendiente` = se está dibujando (seguir consultando). Si no hay proveedor o falló, ambas en false: se usa la portada tipográfica.
   */
  imagen: { listo: boolean; url: string | null; pendiente: boolean };
  /** Mensaje para el niño cuando falló (sin detalles técnicos). */
  error: string | null;
  createdAt: string;
}
export interface CuentoAdminDTO extends CuentoDTO {
  reviewNote: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  /** Recursos creados al aprobar (libro y, si hubo audio, audiolibro). */
  resourceIds: string[];
  /** Latencia y tokens del proveedor (solo cifras; nunca el prompt). */
  proveedor: { ms: number | null; tokensEntrada: number | null; tokensSalida: number | null } | null;
  /** Ilustración: existe el archivo aunque esté oculta; motivo del fallo (técnico, solo panel); proveedor usado. */
  imagenAdmin: { existe: boolean; oculta: boolean; error: string | null; proveedor: string | null; ms: number | null };
}
/** Decisión de la bibliotecaria sobre la ilustración (auditada). */
export const CuentoImagenSchema = z.object({ oculta: z.boolean() }).strict();
export type CuentoImagenInput = z.infer<typeof CuentoImagenSchema>;
export const CuentoRevisarSchema = z.object({
  decision: z.enum(['APROBAR', 'RECHAZAR']),
  nota: z.string().trim().max(500).optional(),
}).strict();
export type CuentoRevisar = z.infer<typeof CuentoRevisarSchema>;
export const CuentoAdminQuerySchema = z.object({ status: z.enum(CUENTO_STATUSES).optional() });

/** Créditos fijos de los recursos creados al aprobar un cuento (CONTENT-LICENSING). */
export const CUENTO_LICENSE = {
  rightsHolder: 'Comfasucre – Biblioteca Macondo (Taller de cuentos)',
  licenseName: 'Contenido creado en el Taller de cuentos de la biblioteca',
  categories: ['cuento', 'cuento original', 'taller de cuentos'],
} as const;

/** Grados de los recursos creados a partir de una banda del taller. */
export function cuentoGrades(banda: GradeBand): [number, number] {
  switch (banda) {
    case '1-3': return [1, 3];
    case '4-5': return [4, 5];
    case '6-8': return [6, 8];
    default: return [9, 11];
  }
}

/** Cuenta palabras como lo hace el validador (separadas por espacios). */
export function cuentoPalabras(c: Pick<CuentoGenerado, 'parrafos'>): number {
  return c.parrafos.join(' ').split(/\s+/).filter(Boolean).length;
}

const svgEsc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));
const COVER_PALETTE: Record<CuentoLugar, [string, string]> = {
  covenas: ['#0a5c66', '#1595a3'],
  mojana: ['#2f5f1c', '#76a82b'],
  sincelejo: ['#17365d', '#205b88'],
  espacio: ['#073258', '#087ea4'],
};
/** Parte el título en líneas de ≤ `max` caracteres (por palabras). */
export function cuentoTituloLineas(titulo: string, max = 18): string[] {
  const out: string[] = [];
  let line = '';
  for (const w of titulo.split(/\s+/).filter(Boolean)) {
    if ((line + ' ' + w).trim().length > max && line) { out.push(line); line = w; } else line = (line + ' ' + w).trim();
  }
  if (line) out.push(line);
  return out.slice(0, 4);
}
/**
 * Portada SVG 600×900 del cuento (misma familia visual que scripts/generate-covers.mjs: degradado de marca,
 * marco, ola y pastilla). Se renderiza en el navegador y, al aprobar, la API la convierte a PNG con sharp.
 */
export function cuentoCoverSvg(o: { titulo: string; autorNombre: string | null; lugar: CuentoLugar; tipo: CuentoTipo; conEmoji?: boolean }): string {
  const [a, b] = COVER_PALETTE[o.lugar] ?? COVER_PALETTE.sincelejo;
  const lines = cuentoTituloLineas(o.titulo);
  const size = lines.some((l) => l.length > 14) ? 54 : 64;
  // El PNG del servidor se hace sin emoji (sharp/librsvg no trae fuente de emoji); en el navegador sí se muestra.
  const emoji = o.conEmoji === false ? '' : (CUENTO_OPCIONES.tipos[o.tipo]?.emoji ?? '');
  const titleSvg = lines.map((l, i) => `<tspan x="64" dy="${i === 0 ? 0 : size * 1.1}">${svgEsc(l)}</tspan>`).join('');
  const autor = o.autorNombre ? `Escrito por ${o.autorNombre}` : 'Escrito en el Taller de cuentos';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="900" viewBox="0 0 600 900" role="img" aria-label="Portada: ${svgEsc(o.titulo)}">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>
<rect width="600" height="900" fill="url(#g)"/>
<circle cx="560" cy="820" r="210" fill="none" stroke="rgba(255,255,255,0.07)" stroke-width="40"/>
<rect x="28" y="28" width="544" height="844" rx="18" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="2"/>
<text x="64" y="86" fill="#fff" fill-opacity="0.85" font-family="Outfit, Trebuchet MS, Verdana, sans-serif" font-size="16" font-weight="600" letter-spacing="2.2">MACONDO DIGITAL · TALLER DE CUENTOS</text>
<text x="64" y="${260}" fill="#fff" font-family="Outfit, Trebuchet MS, Verdana, sans-serif" font-size="${size}" font-weight="700">${titleSvg}</text>
<text x="64" y="700" fill="#fff" fill-opacity="0.95" font-family="Outfit, Trebuchet MS, Verdana, sans-serif" font-size="28">${svgEsc(autor)}</text>
${emoji ? `<text x="500" y="620" font-size="96" text-anchor="middle">${svgEsc(emoji)}</text>` : ''}
<rect x="64" y="792" width="236" height="44" rx="22" fill="rgba(255,255,255,0.95)"/>
<text x="182" y="821" fill="${a}" font-family="Outfit, Trebuchet MS, Verdana, sans-serif" font-size="17" font-weight="700" letter-spacing="1.4" text-anchor="middle">CUENTO ORIGINAL</text>
<text x="536" y="821" fill="#fff" fill-opacity="0.9" font-family="Outfit, Trebuchet MS, Verdana, sans-serif" font-size="18" font-weight="500" text-anchor="end">Biblioteca Macondo</text>
</svg>`;
}
