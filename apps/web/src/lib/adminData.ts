import {
  CAPACITY_TARGETS, CHALLENGE_TARGET, type ChallengeDTO, type ChallengeImport, ChallengeImportArraySchema, type ChallengeKind, type GradeBand,
  RESOURCE_TYPES, RESOURCE_STATUSES, type ResourceDTO, type ResourceStatus, type ResourceType,
} from '@macondo/shared';

/**
 * Normalizadores defensivos: el contrato no fija la forma exacta de /admin/resources (lista o
 * paginado), /admin/stats ni /admin/audit. Ver informe de contrato.
 */
export function normalizeList<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (payload && typeof payload === 'object') {
    const p = payload as { items?: unknown; data?: unknown };
    if (Array.isArray(p.items)) return p.items as T[];
    if (Array.isArray(p.data)) return p.data as T[];
  }
  return [];
}

export interface NormalizedStats {
  byType: Record<ResourceType, number>;
  byStatus: Record<ResourceStatus, number>;
  byGrade: Record<number, number>;
  targets: Record<ResourceType, number>;
  total: number;
  /** En colección por tipo, sin retirados (borrador + publicado). Base de las metas de capacidad. */
  activeByType: Record<ResourceType, number>;
  /** Total en colección sin retirados. */
  activeTotal: number;
  /** Publicados por tipo (si la API lo informa). */
  publishedByType: Record<ResourceType, number> | null;
  /** Retos lectores activos / importados frente a su meta (si la API lo informa). */
  challenges?: { active: number; total: number; target: number } | null;
  /** Taller de cuentos: pendientes de revisión / aprobados (si la API lo informa). */
  cuentos?: { pendientes: number; aprobados: number; rechazados: number; total: number } | null;
  /** Recursos sin archivo cargado (si la API lo informa). */
  withoutFile: number | null;
  /** Publicados cuya licencia no está vigente hoy (si la API lo informa). */
  inactiveLicenses: number | null;
  /** 'published' si la API cuenta solo publicados por grado (gradeCoverage). */
  gradeBasis: 'all' | 'published';
}

function toRecord(v: unknown, keyField: string): Record<string, number> {
  const out: Record<string, number> = {};
  if (Array.isArray(v)) {
    for (const row of v) {
      if (row && typeof row === 'object') {
        const r = row as Record<string, unknown>;
        const k = r[keyField] ?? r.key ?? r.name;
        const c = r.count ?? r._count ?? r.total ?? r.value ?? r.published;
        if (k != null && typeof c === 'number') out[String(k)] = c;
      }
    }
  } else if (v && typeof v === 'object') {
    for (const [k, c] of Object.entries(v as Record<string, unknown>)) {
      if (typeof c === 'number') out[k] = c;
      else if (c && typeof c === 'object' && typeof (c as { count?: unknown }).count === 'number') out[k] = (c as { count: number }).count;
    }
  }
  return out;
}

function zeroTypes(): Record<ResourceType, number> {
  return Object.fromEntries(RESOURCE_TYPES.map((t) => [t, 0])) as Record<ResourceType, number>;
}
function zeroStatus(): Record<ResourceStatus, number> {
  return Object.fromEntries(RESOURCE_STATUSES.map((s) => [s, 0])) as Record<ResourceStatus, number>;
}

export function statsFromResources(resources: ResourceDTO[]): NormalizedStats {
  const byType = zeroTypes();
  const byStatus = zeroStatus();
  const byGrade: Record<number, number> = {};
  for (const r of resources) {
    byType[r.type] = (byType[r.type] ?? 0) + 1;
    byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;
    for (let g = r.gradeMin; g <= r.gradeMax; g++) byGrade[g] = (byGrade[g] ?? 0) + 1;
  }
  const publishedByType = zeroTypes();
  const activeByType = zeroTypes();
  for (const r of resources) {
    if (r.status === 'PUBLISHED') publishedByType[r.type] += 1;
    if (r.status !== 'RETIRED') activeByType[r.type] += 1;
  }
  return {
    byType, byStatus, byGrade, targets: { ...CAPACITY_TARGETS }, total: resources.length,
    activeByType, activeTotal: Object.values(activeByType).reduce((a, b) => a + b, 0),
    publishedByType, withoutFile: resources.filter((r) => !r.hasFile).length, inactiveLicenses: null, gradeBasis: 'all',
  };
}

export function normalizeStats(payload: unknown, fallback: ResourceDTO[] | null): NormalizedStats | null {
  if (!payload || typeof payload !== 'object') return fallback ? statsFromResources(fallback) : null;
  const p = payload as Record<string, unknown>;
  const byTypeRaw = toRecord(p.byType ?? p.types, 'type');
  if (Object.keys(byTypeRaw).length === 0 && fallback) return statsFromResources(fallback);
  const byType = { ...zeroTypes(), ...byTypeRaw } as Record<ResourceType, number>;
  const byStatus = { ...zeroStatus(), ...toRecord(p.byStatus ?? p.statuses, 'status') } as Record<ResourceStatus, number>;
  const gradeRaw = toRecord(p.byGrade ?? p.grades ?? p.gradeCoverage, 'grade');
  const byGrade: Record<number, number> = {};
  for (const [k, v] of Object.entries(gradeRaw)) byGrade[Number(k)] = v;
  const targetsRaw = toRecord(p.capacityTargets ?? p.targets, 'type');
  const targets = { ...CAPACITY_TARGETS, ...targetsRaw } as Record<ResourceType, number>;
  const total = typeof p.total === 'number' ? p.total : Object.values(byType).reduce((a, b) => a + b, 0);
  let publishedByType: Record<ResourceType, number> | null = null;
  // Sin desglose por estado no se puede excluir a los retirados: se usa el total por tipo.
  const activeByType = { ...byType };
  if (Array.isArray(p.byType)) {
    publishedByType = zeroTypes();
    for (const row of p.byType as Record<string, unknown>[]) {
      const st = row?.byStatus as Record<string, unknown> | undefined;
      const t = row?.type as ResourceType;
      if (t in publishedByType && typeof st?.PUBLISHED === 'number') publishedByType[t] = st.PUBLISHED;
      if (t in activeByType && typeof st?.RETIRED === 'number') activeByType[t] = Math.max(0, (byType[t] ?? 0) - st.RETIRED);
    }
  }
  const activeTotal = Object.values(activeByType).reduce((a, b) => a + b, 0);
  const num = (v: unknown) => (typeof v === 'number' ? v : null);
  const files = p.files as Record<string, unknown> | undefined;
  const lic = p.licenses as Record<string, unknown> | undefined;
  return {
    byType, byStatus, byGrade, targets, total, activeByType, activeTotal, publishedByType,
    withoutFile: num(files?.withoutFile), inactiveLicenses: num(lic?.publishedWithInactiveLicense),
    challenges: challengesOf(p.challenges),
    cuentos: cuentosOf(p.cuentos),
    gradeBasis: p.byGrade == null && p.grades == null && p.gradeCoverage != null ? 'published' : 'all',
  };
}

/** Tamaño legible en español (1,2 MB). */
export function formatBytes(bytes: number | null | undefined): string {
  if (bytes == null || !Number.isFinite(bytes) || bytes < 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let v = bytes / 1024;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toLocaleString('es-CO', { maximumFractionDigits: v < 10 ? 1 : 0 })} ${units[i]}`;
}

export type UploadKind = 'file' | 'gallery' | 'cover';
export const UPLOAD_RULES: Record<UploadKind, { exts: string[]; maxMb: number; label: string }> = {
  file: { exts: ['epub', 'pdf', 'mp3'], maxMb: 200, label: 'EPUB, PDF o MP3' },
  gallery: { exts: ['zip'], maxMb: 200, label: 'ZIP de galería (imágenes JPG/PNG/WebP + gallery.json)' },
  cover: { exts: ['jpg', 'jpeg', 'png', 'webp'], maxMb: 10, label: 'JPG, PNG o WebP' },
};

/** Validación local (extensión y tamaño). Devuelve el motivo de rechazo o null. */
export function localUploadProblem(file: { name: string; size: number }, kind: UploadKind): string | null {
  const rule = UPLOAD_RULES[kind];
  const ext = file.name.includes('.') ? file.name.split('.').pop()!.toLowerCase() : '';
  if (!rule.exts.includes(ext)) return `«${file.name}»: formato no permitido. Usa ${rule.label}.`;
  if (file.size === 0) return `«${file.name}»: el archivo está vacío.`;
  if (file.size > rule.maxMb * 1024 * 1024) return `«${file.name}»: pesa ${formatBytes(file.size)} y supera el máximo de ${rule.maxMb} MB.`;
  return null;
}

/** Traduce el rechazo del servidor (413/415/400…) a un mensaje claro por archivo. */
export function uploadErrorMessage(err: { status?: number | null; message?: string; details?: unknown }, fileName: string, kind: UploadKind): string {
  const rule = UPLOAD_RULES[kind];
  const d = err.details as { message?: unknown } | null | undefined;
  const server = typeof d?.message === 'string' ? d.message.trim().replace(/\.+$/, '') : undefined;
  switch (err.status) {
    case 413:
      return `«${fileName}»: el servidor lo rechazó por tamaño. El máximo es ${rule.maxMb} MB${kind === 'cover' ? ' para portadas' : ''}.`;
    case 415:
      return `«${fileName}»: el servidor no lo aceptó como ${rule.label}${server ? ` (${server})` : ''}. Verifica que el archivo no esté dañado ni renombrado.`;
    case 400:
      return `«${fileName}»: ${server ?? 'la solicitud de carga no es válida.'}`;
    default:
      return `«${fileName}»: ${err.message || 'no se pudo subir el archivo.'}`;
  }
}

export interface AuditRow {
  id: string;
  at: string | null;
  actor: string;
  action: string;
  target: string;
}
export function normalizeAudit(payload: unknown): AuditRow[] {
  return normalizeList<Record<string, unknown>>(payload).map((r, i) => {
    const user = r.user as Record<string, unknown> | undefined;
    // La API devuelve `actor` como objeto { id, email, name, role }; también se aceptan formas planas.
    const actorObj = r.actor && typeof r.actor === 'object' ? (r.actor as Record<string, unknown>) : undefined;
    const str = (v: unknown) => (typeof v === 'string' ? v : v == null || typeof v === 'object' ? '' : String(v));
    const actorName = str(actorObj?.name ?? user?.name);
    const actorEmail = str(r.actorEmail ?? r.userEmail ?? actorObj?.email ?? user?.email ?? (typeof r.actor === 'string' ? r.actor : '') ?? r.userId);
    return {
      id: str(r.id) || String(i),
      at: str(r.createdAt ?? r.at ?? r.timestamp) || null,
      actor: actorName && actorEmail ? `${actorName} (${actorEmail})` : actorEmail || actorName || (r.actorId == null && !actorObj ? 'Sistema' : '—'),
      action: str(r.action) || '—',
      target: [str(r.entity ?? r.entityType), str(r.entityId ?? r.resourceId)].filter(Boolean).join(' · ') || '—',
    };
  });
}

/** Convierte 'YYYY-MM-DD' a ISO datetime (inicio o fin del día, UTC-5 Colombia). */
export function dateInputToIso(v: string, endOfDay = false): string | null {
  if (!v) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
  return new Date(`${v}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}-05:00`).toISOString();
}
export function isoToDateInput(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  // Mostrar en hora de Colombia (UTC-5, sin horario de verano).
  const co = new Date(d.getTime() - 5 * 3600_000);
  return co.toISOString().slice(0, 10);
}
export function datetimeLocalToIso(v: string): string | null {
  if (!v) return null;
  const d = new Date(`${v}:00-05:00`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}
export function isoToDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return new Date(d.getTime() - 5 * 3600_000).toISOString().slice(0, 16);
}

function challengesOf(v: unknown): { active: number; total: number; target: number } | null {
  if (!v || typeof v !== 'object') return null;
  const c = v as Record<string, unknown>;
  if (typeof c.active !== 'number' || typeof c.total !== 'number') return null;
  return { active: c.active, total: c.total, target: typeof c.target === 'number' ? c.target : CHALLENGE_TARGET };
}

function cuentosOf(v: unknown): { pendientes: number; aprobados: number; rechazados: number; total: number } | null {
  if (!v || typeof v !== 'object') return null;
  const c = v as Record<string, unknown>;
  const n = (k: string) => (typeof c[k] === 'number' ? (c[k] as number) : 0);
  if (typeof c.pendientes !== 'number') return null;
  return { pendientes: n('pendientes'), aprobados: n('aprobados'), rechazados: n('rechazados'), total: n('total') };
}

/* ───────────────────────── Retos (pestaña admin) ───────────────────────── */

export const CHALLENGE_KIND_LABELS: Record<ChallengeKind, string> = { trivia: 'Trivia', sequence: 'Secuencia', match: 'Relacionar' };

export interface ChallengeFilters {
  band?: GradeBand | '';
  kind?: ChallengeKind | '';
  /** '' = todos; 'true' solo activos; 'false' solo inactivos. */
  active?: '' | 'true' | 'false';
  q?: string;
}

/** Filtro local de retos (la API admin devuelve todos: 100–200 filas, no hace falta paginar en el servidor). */
export function filterChallenges<T extends Pick<ChallengeDTO, 'id' | 'title' | 'kind' | 'bands' | 'active' | 'resource'>>(rows: T[], f: ChallengeFilters): T[] {
  const term = (f.q ?? '').trim().toLowerCase();
  return rows.filter(
    (c) =>
      (!f.band || c.bands.includes(f.band)) &&
      (!f.kind || c.kind === f.kind) &&
      (!f.active || c.active === (f.active === 'true')) &&
      (!term || `${c.title} ${c.id} ${c.resource?.title ?? ''} ${c.resource?.creator ?? ''}`.toLowerCase().includes(term)),
  );
}

/**
 * Analiza el texto del cuadro «Importar JSON»: acepta el arreglo de `catalogo-dp/retos/retos.json` o un
 * objeto `{ retos: [...] }` / `{ challenges: [...] }`. Valida con el contrato antes de enviarlo a la API
 * para que el error señale el reto y el campo (en español) en lugar de un 400 genérico.
 */
export function parseChallengeImport(text: string): { ok: true; items: ChallengeImport[] } | { ok: false; message: string } {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, message: 'El texto no es JSON válido. Pega el contenido completo de retos.json (empieza por «[»).' };
  }
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    const o = raw as { retos?: unknown; challenges?: unknown };
    raw = Array.isArray(o.retos) ? o.retos : Array.isArray(o.challenges) ? o.challenges : raw;
  }
  if (!Array.isArray(raw)) return { ok: false, message: 'Se esperaba un arreglo de retos (o un objeto con la clave «retos»).' };
  if (raw.length === 0) return { ok: false, message: 'El arreglo está vacío: no hay retos que importar.' };
  const parsed = ChallengeImportArraySchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    const idx = typeof first?.path[0] === 'number' ? first.path[0] : null;
    const item = idx != null ? (raw[idx] as { id?: unknown } | undefined) : undefined;
    const where = idx != null ? `reto ${idx + 1}${item && typeof item.id === 'string' ? ` («${item.id}»)` : ''}` : 'lista';
    const field = first?.path.slice(1).join('.') || 'estructura';
    return { ok: false, message: `${parsed.error.issues.length} problema(s) de formato. Primero: ${where}, campo «${field}»: ${first?.message ?? 'no válido'}.` };
  }
  return { ok: true, items: parsed.data };
}

export interface SequentialResult<T> { done: number; errors: { item: T; message: string }[] }

/**
 * Ejecuta una acción por elemento, UNA A LA VEZ (cada llamada queda auditada en el servidor por
 * separado) e informa el avance. No se detiene ante un error: lo anota y sigue con el siguiente.
 */
export async function runSequential<T>(
  items: T[],
  action: (item: T, index: number) => Promise<unknown>,
  onProgress?: (done: number, total: number, current: T) => void,
  messageOf: (e: unknown) => string = (e) => (e instanceof Error ? e.message : 'Error inesperado'),
): Promise<SequentialResult<T>> {
  const result: SequentialResult<T> = { done: 0, errors: [] };
  for (let i = 0; i < items.length; i++) {
    const item = items[i]!;
    onProgress?.(i, items.length, item);
    try {
      await action(item, i);
      result.done++;
    } catch (e) {
      result.errors.push({ item, message: messageOf(e) });
    }
  }
  onProgress?.(items.length, items.length, items[items.length - 1]!);
  return result;
}

/**
 * Descarga TODAS las páginas de un listado paginado (`{items,total,pageSize}`), porque la API limita
 * `pageSize` a 100 y la colección supera ese número (570+ recursos). Pide la primera página, calcula
 * cuántas faltan y las pide en paralelo. `maxPages` evita bucles si la API devuelve un total absurdo.
 */
export async function fetchAllPages<T>(
  fetchPage: (page: number, pageSize: number) => Promise<unknown>,
  pageSize = 100,
  maxPages = 50,
): Promise<T[]> {
  const first = await fetchPage(1, pageSize);
  const items = normalizeList<T>(first);
  const total = first && typeof first === 'object' && typeof (first as { total?: unknown }).total === 'number' ? (first as { total: number }).total : items.length;
  const pages = Math.min(maxPages, Math.ceil(total / pageSize));
  if (pages <= 1) return items;
  const rest = await Promise.all(Array.from({ length: pages - 1 }, (_, i) => fetchPage(i + 2, pageSize)));
  const seen = new Set<unknown>();
  const out: T[] = [];
  for (const it of [...items, ...rest.flatMap((p) => normalizeList<T>(p))]) {
    const id = it && typeof it === 'object' ? (it as { id?: unknown }).id : undefined;
    if (id !== undefined) {
      if (seen.has(id)) continue;
      seen.add(id);
    }
    out.push(it);
  }
  return out;
}
