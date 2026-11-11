'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { PDFDocumentProxy, RenderTask } from 'pdfjs-dist';
import { fetchResourceFile } from '@/lib/fileLoader';
import { addBookmark, loadReading, removeBookmark, saveReading, type Bookmark } from '@/lib/readingProgress';
import { errorMessage } from '@/lib/api';
import { Cargando, ErrorEstado } from './StateViews';
import { Icon } from './Icon';

const ZOOMS = [0.75, 1, 1.25, 1.5, 2];

/**
 * Lector PDF (pdf.js, build legacy por compatibilidad con navegadores de Fire OS).
 * El worker se sirve desde /pdf.worker.min.mjs (copiado por scripts/copy-pdf-worker.mjs).
 */
export default function PdfReader({ resourceId, title }: { resourceId: string; title: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const docRef = useRef<PDFDocumentProxy | null>(null);
  const renderTaskRef = useRef<RenderTask | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState('');
  const [numPages, setNumPages] = useState(0);
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [pageInput, setPageInput] = useState('1');
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const ctrl = new AbortController();
    const saved = loadReading(resourceId);
    setBookmarks(saved.bookmarks);
    if (saved.zoom && ZOOMS.includes(saved.zoom)) setZoom(saved.zoom);
    setStatus('loading');
    (async () => {
      try {
        const [pdfjs, buf] = await Promise.all([
          import('pdfjs-dist/legacy/build/pdf.mjs'),
          fetchResourceFile(resourceId, ctrl.signal),
        ]);
        pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
        const doc = await pdfjs.getDocument({ data: new Uint8Array(buf), isEvalSupported: false }).promise;
        if (cancelled) {
          void doc.destroy();
          return;
        }
        docRef.current = doc;
        setNumPages(doc.numPages);
        const start = saved.page && saved.page >= 1 && saved.page <= doc.numPages ? saved.page : 1;
        setPage(start);
        setPageInput(String(start));
        setStatus('ready');
      } catch (e) {
        if (cancelled) return;
        const isApi = typeof (e as { kind?: unknown })?.kind === 'string';
        setError(isApi ? errorMessage(e) : 'No se pudo abrir el PDF: el archivo puede estar dañado.');
        setStatus('error');
      }
    })();
    return () => {
      cancelled = true;
      ctrl.abort();
      renderTaskRef.current?.cancel();
      void docRef.current?.destroy();
      docRef.current = null;
    };
  }, [resourceId, attempt]);

  useEffect(() => {
    if (status !== 'ready') return;
    const doc = docRef.current;
    const canvas = canvasRef.current;
    if (!doc || !canvas) return;
    let cancelled = false;
    (async () => {
      try {
        const p = await doc.getPage(page);
        if (cancelled) return;
        const containerWidth = containerRef.current?.clientWidth ?? 800;
        const base = p.getViewport({ scale: 1 });
        const fit = Math.min(1.5, (containerWidth - 16) / base.width);
        const viewport = p.getViewport({ scale: fit * zoom });
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        canvas.width = Math.floor(viewport.width * dpr);
        canvas.height = Math.floor(viewport.height * dpr);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        renderTaskRef.current?.cancel();
        const task = p.render({ canvasContext: ctx, viewport, transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : undefined });
        renderTaskRef.current = task;
        await task.promise;
      } catch (e) {
        if ((e as { name?: string })?.name !== 'RenderingCancelledException' && !cancelled) {
          setError('No se pudo mostrar esta página.');
        }
      }
    })();
    saveReading(resourceId, { page, zoom, percent: numPages ? page / numPages : undefined });
    return () => {
      cancelled = true;
    };
  }, [page, zoom, status, resourceId, numPages]);

  const go = useCallback(
    (n: number) => {
      if (!numPages) return;
      const target = Math.min(numPages, Math.max(1, n));
      setPage(target);
      setPageInput(String(target));
    },
    [numPages],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown') go(page + 1);
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') go(page - 1);
    };
    window.addEventListener('keyup', onKey);
    return () => window.removeEventListener('keyup', onKey);
  }, [go, page]);

  if (status === 'error') return <ErrorEstado message={error} onRetry={() => setAttempt((a) => a + 1)} title="No se pudo abrir el documento" />;

  const zoomIdx = ZOOMS.indexOf(zoom);
  return (
    <div className="flex flex-col gap-3">
      <div role="toolbar" aria-label="Herramientas del documento" className="tarjeta flex flex-wrap items-center gap-2 p-2">
        <button type="button" className="btn-secundario" onClick={() => go(page - 1)} disabled={page <= 1} aria-label="Página anterior">
          <Icon name="anterior" className="h-5 w-5" />
        </button>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            go(Number(pageInput) || 1);
          }}
          className="flex items-center gap-1"
        >
          <label htmlFor="pdf-page" className="text-sm font-semibold">Página</label>
          <input id="pdf-page" inputMode="numeric" className="campo w-20 text-center" value={pageInput} onChange={(e) => setPageInput(e.target.value.replace(/\D/g, ''))} />
          <span className="text-sm text-brand-muted">de {numPages || '…'}</span>
        </form>
        <button type="button" className="btn-secundario" onClick={() => go(page + 1)} disabled={page >= numPages} aria-label="Página siguiente">
          <Icon name="siguiente" className="h-5 w-5" />
        </button>
        <button type="button" className="btn-secundario" onClick={() => { const z = ZOOMS[Math.max(0, zoomIdx - 1)]!; setZoom(z); }} disabled={zoomIdx <= 0} aria-label="Alejar">
          <Icon name="menos" className="h-5 w-5" />
        </button>
        <span className="min-w-[3.5rem] text-center text-sm tabular-nums text-brand-muted" aria-live="polite">{Math.round(zoom * 100)}%</span>
        <button type="button" className="btn-secundario" onClick={() => { const z = ZOOMS[Math.min(ZOOMS.length - 1, zoomIdx + 1)]!; setZoom(z); }} disabled={zoomIdx >= ZOOMS.length - 1} aria-label="Acercar">
          <Icon name="mas" className="h-5 w-5" />
        </button>
        <button type="button" className="btn-secundario" onClick={() => setBookmarks(addBookmark(resourceId, { label: `Página ${page}`, page }))}>
          <Icon name="marcador" className="h-5 w-5" /> Marcar
        </button>
      </div>
      {bookmarks.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label="Marcadores">
          {bookmarks.map((b) => (
            <li key={b.id} className="flex items-center rounded-control border border-brand-border bg-brand-soft text-brand-secondary">
              <button type="button" className="min-h-touch rounded-control px-3 font-semibold" onClick={() => b.page && go(b.page)}>{b.label}</button>
              <button type="button" className="min-h-touch min-w-touch rounded-control" aria-label={`Eliminar marcador ${b.label}`} onClick={() => setBookmarks(removeBookmark(resourceId, b.id))}>
                <Icon name="cerrar" className="mx-auto h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div ref={containerRef} className="relative min-h-[420px] overflow-auto rounded-card border border-brand-border bg-brand-surface p-2 shadow-card">
        {status === 'loading' && <Cargando label="Abriendo documento…" />}
        <canvas ref={canvasRef} className={`mx-auto ${status === 'loading' ? 'hidden' : ''}`} role="img" aria-label={`${title}, página ${page} de ${numPages}`} />
      </div>
      {error && status === 'ready' && <p role="alert" className="text-brand-danger-text">{error}</p>}
    </div>
  );
}
