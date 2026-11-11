'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Book, NavItem, Rendition } from 'epubjs';
import { fetchResourceFile } from '@/lib/fileLoader';
import { addBookmark, loadReading, removeBookmark, saveReading, type Bookmark } from '@/lib/readingProgress';
import { errorMessage } from '@/lib/api';
import { Cargando, ErrorEstado } from './StateViews';
import { Icon } from './Icon';

const FONT_SIZES = [90, 100, 115, 130, 150, 175];

/** Lector EPUB paginado (epub.js). Solo cliente. Progreso y marcadores en localStorage. */
export default function EpubReader({ resourceId, title }: { resourceId: string; title: string }) {
  const viewerRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<Book | null>(null);
  const renditionRef = useRef<Rendition | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState('');
  const [toc, setToc] = useState<NavItem[]>([]);
  const [showToc, setShowToc] = useState(false);
  const [showMarks, setShowMarks] = useState(false);
  const [fontSize, setFontSize] = useState(100);
  const [percent, setPercent] = useState<number | null>(null);
  const [cfi, setCfi] = useState<string | null>(null);
  const [chapter, setChapter] = useState('');
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const ctrl = new AbortController();
    const saved = loadReading(resourceId);
    setBookmarks(saved.bookmarks);
    if (saved.fontSize) setFontSize(saved.fontSize);
    setStatus('loading');

    (async () => {
      try {
        const [{ default: ePub }, buf] = await Promise.all([import('epubjs'), fetchResourceFile(resourceId, ctrl.signal)]);
        if (cancelled || !viewerRef.current) return;
        const book = ePub(buf);
        bookRef.current = book;
        const rendition = book.renderTo(viewerRef.current, {
          width: '100%',
          height: '100%',
          flow: 'paginated',
          spread: 'none',
          allowScriptedContent: false,
        });
        renditionRef.current = rendition;
        rendition.themes.default({
          // Texto del libro: serif de lectura sobre blanco; colores de la marca (#24364b / #205b88).
          body: { 'font-family': 'Georgia, serif', 'line-height': '1.6', color: '#24364b', background: '#ffffff' },
          a: { color: '#205b88' },
        });
        rendition.themes.fontSize(`${saved.fontSize ?? 100}%`);
        rendition.on('relocated', (loc: { start: { cfi: string; href: string; percentage?: number } }) => {
          setCfi(loc.start.cfi);
          let pct: number | undefined;
          try {
            pct = book.locations.length() > 0 ? book.locations.percentageFromCfi(loc.start.cfi) : loc.start.percentage;
          } catch {
            pct = undefined;
          }
          if (typeof pct === 'number') setPercent(pct);
          saveReading(resourceId, { cfi: loc.start.cfi, ...(typeof pct === 'number' ? { percent: pct } : {}) });
          const item = book.navigation?.get(loc.start.href);
          setChapter(item?.label?.trim() ?? '');
        });
        rendition.on('keyup', (e: KeyboardEvent) => {
          if (e.key === 'ArrowRight') void rendition.next();
          if (e.key === 'ArrowLeft') void rendition.prev();
        });
        book.loaded.navigation.then((nav) => !cancelled && setToc(nav.toc)).catch(() => undefined);
        await rendition.display(saved.cfi || undefined);
        if (cancelled) return;
        setStatus('ready');
        // Generar ubicaciones para el porcentaje (en segundo plano; puede tardar en libros largos).
        book.ready.then(() => book.locations.generate(1600)).catch(() => undefined);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error && !(e as { kind?: string }).kind ? 'No se pudo abrir el libro: el archivo puede estar dañado.' : errorMessage(e));
        setStatus('error');
      }
    })();

    return () => {
      cancelled = true;
      ctrl.abort();
      try {
        renditionRef.current?.destroy();
        bookRef.current?.destroy();
      } catch {
        /* ignorar */
      }
      renditionRef.current = null;
      bookRef.current = null;
    };
  }, [resourceId, attempt]);

  const next = useCallback(() => void renditionRef.current?.next(), []);
  const prev = useCallback(() => void renditionRef.current?.prev(), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keyup', onKey);
    return () => window.removeEventListener('keyup', onKey);
  }, [next, prev]);

  const changeFont = (dir: 1 | -1) => {
    const idx = FONT_SIZES.indexOf(fontSize);
    const nextSize = FONT_SIZES[Math.min(FONT_SIZES.length - 1, Math.max(0, (idx < 0 ? 1 : idx) + dir))]!;
    setFontSize(nextSize);
    renditionRef.current?.themes.fontSize(`${nextSize}%`);
    saveReading(resourceId, { fontSize: nextSize });
  };

  const mark = () => {
    if (!cfi) return;
    const label = `${chapter || 'Página'}${percent != null ? ` · ${Math.round(percent * 100)}%` : ''}`;
    setBookmarks(addBookmark(resourceId, { label, cfi }));
  };

  if (status === 'error') {
    return <ErrorEstado message={error} onRetry={() => setAttempt((a) => a + 1)} title="No se pudo abrir el libro" />;
  }

  return (
    <div className="flex flex-col gap-3">
      <div role="toolbar" aria-label="Herramientas de lectura" className="tarjeta flex flex-wrap items-center gap-2 p-2">
        <button type="button" className="btn-secundario" onClick={() => setShowToc((v) => !v)} aria-expanded={showToc} aria-controls="toc-panel" disabled={toc.length === 0}>
          <Icon name="indice" className="h-5 w-5" /> Índice
        </button>
        <button type="button" className="btn-secundario" onClick={() => changeFont(-1)} aria-label="Reducir tamaño de letra">
          <Icon name="menos" className="h-5 w-5" /> A
        </button>
        <span className="min-w-[4rem] text-center text-sm tabular-nums text-brand-muted" aria-live="polite">Letra {fontSize}%</span>
        <button type="button" className="btn-secundario" onClick={() => changeFont(1)} aria-label="Aumentar tamaño de letra">
          <Icon name="mas" className="h-5 w-5" /> A
        </button>
        <button type="button" className="btn-secundario" onClick={mark} disabled={!cfi}>
          <Icon name="marcador" className="h-5 w-5" /> Marcar página
        </button>
        <button type="button" className="btn-fantasma" onClick={() => setShowMarks((v) => !v)} aria-expanded={showMarks} aria-controls="marks-panel">
          <Icon name="marcador" className="h-5 w-5" /> Marcadores ({bookmarks.length})
        </button>
        {percent != null && <span className="ml-auto rounded-full bg-brand-soft px-3 py-1 text-sm font-semibold text-brand-secondary">{Math.round(percent * 100)}% leído</span>}
      </div>

      {showToc && (
        <nav id="toc-panel" aria-label="Índice del libro" className="tarjeta max-h-72 overflow-auto p-3">
          <ol className="space-y-1">
            {toc.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className="min-h-touch w-full rounded-control px-3 text-left transition-colors duration-brand hover:bg-brand-soft"
                  onClick={() => {
                    void renditionRef.current?.display(item.href);
                    setShowToc(false);
                  }}
                >
                  {item.label.trim()}
                </button>
              </li>
            ))}
          </ol>
        </nav>
      )}

      {showMarks && (
        <div id="marks-panel" className="tarjeta p-3">
          {bookmarks.length === 0 ? (
            <p className="text-sm text-brand-muted">Aún no tienes marcadores en este libro.</p>
          ) : (
            <ul className="space-y-1">
              {bookmarks.map((b) => (
                <li key={b.id} className="flex items-center gap-2">
                  <button type="button" className="min-h-touch flex-1 rounded-control px-3 text-left transition-colors duration-brand hover:bg-brand-soft" onClick={() => b.cfi && void renditionRef.current?.display(b.cfi)}>
                    {b.label}
                  </button>
                  <button type="button" className="btn-fantasma" aria-label={`Eliminar marcador ${b.label}`} onClick={() => setBookmarks(removeBookmark(resourceId, b.id))}>
                    <Icon name="cerrar" className="h-5 w-5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="relative">
        {status === 'loading' && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-brand-surface">
            <Cargando label="Abriendo libro…" />
          </div>
        )}
        <div className="flex items-stretch gap-2">
          <button type="button" className="btn-secundario self-center px-2 sm:px-5" onClick={prev} aria-label="Página anterior">
            <Icon name="anterior" className="h-7 w-7" />
          </button>
          <div
            ref={viewerRef}
            className="h-[70vh] min-h-[420px] min-w-0 flex-1 overflow-hidden rounded-card border border-brand-border bg-brand-surface shadow-card"
            aria-label={`Contenido de ${title}`}
          />
          <button type="button" className="btn-secundario self-center px-2 sm:px-5" onClick={next} aria-label="Página siguiente">
            <Icon name="siguiente" className="h-7 w-7" />
          </button>
        </div>
        {chapter && <p className="mt-2 text-center text-sm text-brand-muted">{chapter}</p>}
      </div>
    </div>
  );
}
