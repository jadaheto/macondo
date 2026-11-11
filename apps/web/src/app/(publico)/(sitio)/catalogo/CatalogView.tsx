'use client';

import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { RESOURCE_TYPES, RESOURCE_TYPE_LABELS, ResourceTypeSchema, type Paginated, type ResourceDTO } from '@macondo/shared';
import { catalogUrl } from '@/lib/api';
import { useApi } from '@/components/useApi';
import { useGradeBand } from '@/components/GradeBandProvider';
import { ResourceCard } from '@/components/ResourceCard';
import { Cargando, ErrorEstado, Vacio } from '@/components/StateViews';
import { Icon } from '@/components/Icon';

const PAGE_SIZE = 24;

export function CatalogView() {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { band, config } = useGradeBand();

  const q = sp.get('q') ?? '';
  const typeParsed = ResourceTypeSchema.safeParse(sp.get('type') ?? undefined);
  const type = typeParsed.success ? typeParsed.data : undefined;
  const gradeNum = Number(sp.get('grade'));
  const grade = Number.isInteger(gradeNum) && gradeNum >= 1 && gradeNum <= 11 ? gradeNum : undefined;
  const category = sp.get('category') ?? '';
  const pageNum = Number(sp.get('page'));
  const page = Number.isInteger(pageNum) && pageNum > 1 ? pageNum : 1;

  const [text, setText] = useState(q);
  const [cat, setCat] = useState(category);

  const url = catalogUrl({ q: q || undefined, type, grade, category: category || undefined, page, pageSize: PAGE_SIZE });
  const { data, error, loading, reload } = useApi<Paginated<ResourceDTO>>(url);

  // Último query enviado al router y aún no reflejado en `sp`. Sin esto, dos cambios seguidos
  // (p. ej. tipo y grado antes de que termine la transición, habitual en una tablet lenta)
  // partían de la URL vieja y el segundo deshacía el primero.
  const pendingQuery = useRef<string | null>(null);
  useEffect(() => {
    if (pendingQuery.current === sp.toString()) pendingQuery.current = null;
  }, [sp]);

  const update = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams(pendingQuery.current ?? sp.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    if (!('page' in patch)) next.delete('page');
    const s = next.toString();
    pendingQuery.current = s;
    router.replace(s ? `${pathname}?${s}` : pathname, { scroll: false });
  };

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    update({ q: text.trim() || undefined, category: cat.trim() || undefined });
  };

  const categories = useMemo(() => {
    const set = new Set<string>();
    data?.items.forEach((r) => r.categories.forEach((c) => set.add(c)));
    return [...set].sort((a, b) => a.localeCompare(b, 'es'));
  }, [data]);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / (data.pageSize || PAGE_SIZE))) : 1;
  const title = type ? RESOURCE_TYPE_LABELS[type] : config.catalogTitle;

  return (
    <div>
      <p className="eyebrow">{band ? `Grados ${config.label} · ` : ''}Biblioteca Macondo</p>
      <h1 className="mt-1 text-3xl font-bold">{title}</h1>
      <form role="search" onSubmit={onSearch} className="tarjeta mt-4 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-end">
        <div>
          <label htmlFor="q" className="etiqueta">Buscar por título o autor</label>
          <input id="q" type="search" value={text} onChange={(e) => setText(e.target.value)} className="campo" maxLength={100} placeholder="Ej.: fábulas" />
        </div>
        <div>
          <label htmlFor="tipo" className="etiqueta">Tipo</label>
          <select id="tipo" className="campo" value={type ?? ''} onChange={(e) => update({ type: e.target.value || undefined })}>
            <option value="">Todos</option>
            {RESOURCE_TYPES.map((t) => (
              <option key={t} value={t}>{RESOURCE_TYPE_LABELS[t]}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="grado" className="etiqueta">Grado</label>
          <select id="grado" className="campo" value={grade ?? ''} onChange={(e) => update({ grade: e.target.value || undefined })}>
            <option value="">Todos</option>
            {Array.from({ length: 11 }, (_, i) => i + 1).map((g) => (
              <option key={g} value={g}>{g}.º</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="categoria" className="etiqueta">Categoría</label>
          <input id="categoria" list="categorias" className="campo" value={cat} onChange={(e) => setCat(e.target.value)} maxLength={60} placeholder="Ej.: fábulas" />
          <datalist id="categorias">
            {categories.map((c) => <option key={c} value={c} />)}
          </datalist>
        </div>
        <button type="submit" className="btn-primario sm:col-span-2 lg:col-span-1">
          <Icon name="buscar" className="h-5 w-5" /> Buscar
        </button>
      </form>

      {(q || type || grade || category) && (
        <p className="mt-3 text-sm">
          <button type="button" className="btn-fantasma underline" onClick={() => { setText(''); setCat(''); pendingQuery.current = ''; router.replace(pathname); }}>
            <Icon name="cerrar" className="h-5 w-5" /> Quitar filtros
          </button>
        </p>
      )}

      <section aria-live="polite" aria-busy={loading} className="mt-4">
        {loading && <Cargando label="Buscando recursos…" />}
        {!loading && error && <ErrorEstado message={error.message} onRetry={reload} title="No pudimos cargar el catálogo" />}
        {!loading && !error && data && data.items.length === 0 && (
          <Vacio title="No encontramos recursos">
            Prueba con otra palabra o quita algunos filtros. La colección crece a medida que la biblioteca incorpora contenidos con licencia.
          </Vacio>
        )}
        {!loading && !error && data && data.items.length > 0 && (
          <>
            <p className="mb-3 text-sm text-brand-muted">
              {data.total} {data.total === 1 ? 'recurso' : 'recursos'} · página {data.page} de {totalPages}
            </p>
            <ul className={`grid gap-4 ${config.density === 'xl' ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'}`}>
              {data.items.map((r) => <ResourceCard key={r.id} resource={r} compact={config.density === 'xl'} />)}
            </ul>
            {totalPages > 1 && (
              <nav aria-label="Paginación" className="mt-6 flex items-center justify-center gap-3">
                <button type="button" className="btn-secundario" disabled={page <= 1} onClick={() => update({ page: String(page - 1) })}>
                  <Icon name="anterior" className="h-5 w-5" /> Anterior
                </button>
                <span className="text-sm text-brand-muted">Página {page} de {totalPages}</span>
                <button type="button" className="btn-secundario" disabled={page >= totalPages} onClick={() => update({ page: String(page + 1) })}>
                  Siguiente <Icon name="siguiente" className="h-5 w-5" />
                </button>
              </nav>
            )}
          </>
        )}
      </section>
    </div>
  );
}
