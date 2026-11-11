import type { ChallengeDTO } from '@macondo/shared';
import { dateInputToIso, formatBytes, isoToDateInput, localUploadProblem, normalizeAudit, normalizeList, normalizeStats, statsFromResources, uploadErrorMessage } from './adminData';

describe('normalizadores del panel admin', () => {
  it('acepta lista o paginado', () => {
    expect(normalizeList([1, 2])).toEqual([1, 2]);
    expect(normalizeList({ items: [1], total: 1 })).toEqual([1]);
    expect(normalizeList(null)).toEqual([]);
  });
  it('normaliza estadísticas en objeto o arreglo', () => {
    const s = normalizeStats({ byType: [{ type: 'BOOK', count: 3 }], byStatus: { PUBLISHED: 2, DRAFT: 1 } }, null)!;
    expect(s.byType.BOOK).toBe(3);
    expect(s.byType.GALLERY).toBe(0);
    expect(s.targets.BOOK).toBe(300); // metas del 2026-10-31
    expect(s.byStatus.PUBLISHED).toBe(2);
    expect(s.total).toBe(3);
  });
  it('fechas de licencia en hora de Colombia', () => {
    const iso = dateInputToIso('2026-12-31', true)!;
    expect(iso).toBe('2027-01-01T04:59:59.999Z');
    expect(isoToDateInput(iso)).toBe('2026-12-31');
    expect(dateInputToIso('')).toBeNull();
  });
  it('auditoría tolerante a formas distintas', () => {
    const rows = normalizeAudit([{ id: 'a', createdAt: '2026-01-01T00:00:00Z', action: 'RESOURCE_CREATE', user: { email: 'x@y.co' }, entity: 'Resource', entityId: 'r1' }]);
    expect(rows[0]).toMatchObject({ actor: 'x@y.co', action: 'RESOURCE_CREATE', target: 'Resource · r1' });
    // Forma real de la API: actor como objeto → nunca "[object Object]"
    const real = normalizeAudit([{ id: 'b', createdAt: '2026-11-01T12:00:00Z', action: 'RESOURCE_RETIRE', entity: 'Resource', entityId: 'r2', actor: { id: 'u1', email: 'admin@macondo.local', name: 'Administración Macondo', role: 'ADMIN' } }]);
    expect(real[0].actor).toBe('Administración Macondo (admin@macondo.local)');
    expect(normalizeAudit([{ id: 'c', action: 'SEED', entity: 'User', entityId: 'u', actor: null, actorId: null }])[0].actor).toBe('Sistema');
  });
  it('acepta la forma real de /admin/stats (byType arreglo, gradeCoverage, files, licenses)', () => {
    const s = normalizeStats({
      byStatus: { DRAFT: 1, PUBLISHED: 4, RETIRED: 0 },
      byType: [{ type: 'BOOK', total: 5, byStatus: { DRAFT: 1, PUBLISHED: 4, RETIRED: 0 } }],
      gradeCoverage: [{ grade: 3, published: 2 }],
      files: { withFile: 4, withoutFile: 1 },
      licenses: { publishedWithInactiveLicense: 1 },
    }, null)!;
    expect(s.byType.BOOK).toBe(5);
    expect(s.publishedByType?.BOOK).toBe(4);
    expect(s.byGrade[3]).toBe(2);
    expect(s.withoutFile).toBe(1);
    expect(s.inactiveLicenses).toBe(1);
    expect(s.gradeBasis).toBe('published');
  });
  it('las metas de capacidad excluyen recursos retirados', () => {
    const s = normalizeStats({
      byStatus: { DRAFT: 1, PUBLISHED: 4, RETIRED: 3 },
      byType: [{ type: 'BOOK', total: 8, byStatus: { DRAFT: 1, PUBLISHED: 4, RETIRED: 3 } }],
    }, null)!;
    expect(s.byType.BOOK).toBe(8);
    expect(s.activeByType.BOOK).toBe(5);
    expect(s.activeTotal).toBe(5);
    const f = statsFromResources([
      { type: 'BOOK', status: 'PUBLISHED', gradeMin: 1, gradeMax: 1, hasFile: true },
      { type: 'BOOK', status: 'RETIRED', gradeMin: 1, gradeMax: 1, hasFile: true },
    ] as never);
    expect(f.activeByType.BOOK).toBe(1);
    expect(f.activeTotal).toBe(1);
  });
  it('carga de archivos: validación local y mensajes 413/415 claros', () => {
    expect(formatBytes(1536)).toBe('1,5 KB');
    expect(localUploadProblem({ name: 'a.pdf', size: 10 }, 'file')).toBeNull();
    expect(localUploadProblem({ name: 'a.exe', size: 10 }, 'file')).toMatch('formato no permitido');
    expect(localUploadProblem({ name: 'p.png', size: 11 * 1024 * 1024 }, 'cover')).toMatch('10 MB');
    expect(uploadErrorMessage({ status: 413 }, 'x.pdf', 'file')).toMatch('200 MB');
    expect(uploadErrorMessage({ status: 415, details: { message: 'no es PDF' } }, 'x.pdf', 'file')).toMatch('no es PDF');
  });
});

describe('KPI de retos lectores', () => {
  it('lee retos activos/total y la meta (100 por defecto)', () => {
    expect(normalizeStats({ byType: [{ type: 'BOOK', count: 1 }], challenges: { active: 7, total: 9, target: 100 } }, null)!.challenges).toEqual({ active: 7, total: 9, target: 100 });
    expect(normalizeStats({ byType: [{ type: 'BOOK', count: 1 }], challenges: { active: 1, total: 1 } }, null)!.challenges?.target).toBe(100);
    expect(normalizeStats({ byType: [{ type: 'BOOK', count: 1 }] }, null)!.challenges).toBeNull();
  });
});

describe('fetchAllPages (listado admin con más de 100 recursos)', () => {
  it('pide todas las páginas y une los resultados sin duplicados', async () => {
    const all = Array.from({ length: 230 }, (_, i) => ({ id: `r${i}` }));
    const calls: number[] = [];
    const page = async (p: number, size: number) => {
      calls.push(p);
      // la página 3 repite un elemento (p. ej. si cambió el orden entre peticiones)
      const items = all.slice((p - 1) * size, p * size);
      return { items: p === 3 ? [all[0], ...items] : items, total: all.length, page: p, pageSize: size };
    };
    const { fetchAllPages } = await import('./adminData');
    const rows = await fetchAllPages<{ id: string }>(page, 100);
    expect(calls.sort()).toEqual([1, 2, 3]);
    expect(rows).toHaveLength(230);
    expect(new Set(rows.map((r) => r.id)).size).toBe(230);
  });
  it('con una sola página no hace más peticiones; acepta arreglo plano', async () => {
    const { fetchAllPages } = await import('./adminData');
    let n = 0;
    expect(await fetchAllPages(async () => { n++; return [{ id: 'a' }]; })).toHaveLength(1);
    expect(n).toBe(1);
  });
});

describe('pestaña Retos (2026-11-01)', () => {
  const rows = [
    { id: 'r1', title: 'Trivia de Pombo', kind: 'trivia', bands: ['1-3', '4-5'], active: true, resource: { id: 'x', title: 'Fábulas', creator: 'Rafael Pombo', type: 'BOOK' } },
    { id: 'r2', title: 'Ordena el cuento', kind: 'sequence', bands: ['6-8'], active: false, resource: null },
    { id: 'r3', title: 'Relaciona autores', kind: 'match', bands: ['9-11'], active: true, resource: null },
  ] as Pick<ChallengeDTO, 'id' | 'title' | 'kind' | 'bands' | 'active' | 'resource'>[];
  it('filterChallenges combina banda, tipo, activo y texto (también por recurso enlazado)', async () => {
    const { filterChallenges } = await import('./adminData');
    const all = [...rows];
    expect(filterChallenges(all, {}).map((c) => c.id)).toEqual(['r1', 'r2', 'r3']);
    expect(filterChallenges(all, { band: '4-5' }).map((c) => c.id)).toEqual(['r1']);
    expect(filterChallenges(all, { kind: 'match' }).map((c) => c.id)).toEqual(['r3']);
    expect(filterChallenges(all, { active: 'false' }).map((c) => c.id)).toEqual(['r2']);
    expect(filterChallenges(all, { active: 'true', band: '9-11' }).map((c) => c.id)).toEqual(['r3']);
    expect(filterChallenges(all, { q: 'pombo' }).map((c) => c.id)).toEqual(['r1']);
    expect(filterChallenges(all, { q: 'r2' }).map((c) => c.id)).toEqual(['r2']);
  });
  it('parseChallengeImport acepta arreglo u objeto {retos}, y explica el error en español', async () => {
    const { parseChallengeImport } = await import('./adminData');
    const ok = { id: 'trivia-pombo', kind: 'trivia', title: 'Trivia', bands: ['1-3'], questions: [{ prompt: '¿Quién?', options: ['A', 'B'], answer: 0 }] };
    expect(parseChallengeImport(JSON.stringify([ok]))).toMatchObject({ ok: true, items: [{ id: 'trivia-pombo', kind: 'trivia' }] });
    expect(parseChallengeImport(JSON.stringify({ retos: [ok] }))).toMatchObject({ ok: true });
    expect(parseChallengeImport('no json')).toMatchObject({ ok: false, message: expect.stringContaining('JSON válido') });
    expect(parseChallengeImport('{"a":1}')).toMatchObject({ ok: false, message: expect.stringContaining('arreglo') });
    expect(parseChallengeImport('[]')).toMatchObject({ ok: false, message: expect.stringContaining('vacío') });
    const bad = parseChallengeImport(JSON.stringify([ok, { ...ok, id: 'Mal ID', bands: [] }]));
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.message).toMatch(/reto 2 \(«Mal ID»\)/);
  });
  it('runSequential ejecuta uno a uno, informa avance y recoge errores sin detenerse', async () => {
    const { runSequential } = await import('./adminData');
    const order: string[] = [];
    const progress: number[] = [];
    const res = await runSequential(
      ['a', 'b', 'c'],
      async (x) => { order.push(x); if (x === 'b') throw new Error('falló b'); },
      (done, total) => progress.push(done * 10 + total),
    );
    expect(order).toEqual(['a', 'b', 'c']);
    expect(res.done).toBe(2);
    expect(res.errors).toEqual([{ item: 'b', message: 'falló b' }]);
    expect(progress).toEqual([3, 13, 23, 33]);
  });
});
