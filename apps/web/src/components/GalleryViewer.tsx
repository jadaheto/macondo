'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { GalleryDTO, GalleryItemDTO } from '@macondo/shared';
import { Icon } from './Icon';
import { TriviaQuiz } from './ChallengePlayers';
import { clampZoom, nextIndex, swipeDirection } from '@/lib/gallery';

/** Atribución visible (requisito de CC BY / BY-SA): autor, licencia con enlace y fuente. */
export function Attribution({ item, className = '' }: { item: GalleryItemDTO; className?: string }) {
  return (
    <p className={`text-sm ${className}`}>
      <span>Imagen: {item.credit}</span>
      <span aria-hidden="true"> · </span>
      {item.licenseUrl ? (
        <a href={item.licenseUrl} target="_blank" rel="noopener noreferrer" className="underline">{item.license}</a>
      ) : (
        <span>{item.license}</span>
      )}
      {item.sourceUrl && (
        <>
          <span aria-hidden="true"> · </span>
          <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline">Fuente</a>
        </>
      )}
    </p>
  );
}

export function GalleryViewer({ gallery }: { gallery: GalleryDTO }) {
  const [open, setOpen] = useState<number | null>(null);
  const thumbs = useRef<(HTMLButtonElement | null)[]>([]);

  const close = useCallback(() => {
    setOpen((i) => {
      if (i != null) setTimeout(() => thumbs.current[i]?.focus(), 0);
      return null;
    });
  }, []);

  return (
    <div>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4" aria-label="Imágenes de la galería">
        {gallery.items.map((it, i) => (
          <li key={it.url}>
            <button
              ref={(el) => { thumbs.current[i] = el; }}
              type="button"
              onClick={() => setOpen(i)}
              className="tarjeta group block w-full overflow-hidden text-left transition duration-brand hover:-translate-y-0.5 hover:shadow-card-hover"
              aria-label={`Ampliar imagen ${i + 1} de ${gallery.items.length}: ${it.alt}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={it.url} alt={it.alt} loading="lazy" decoding="async" className="aspect-square w-full bg-brand-soft object-cover" />
              {it.caption && <span className="line-clamp-2 block p-2 text-sm text-brand-text">{it.caption}</span>}
            </button>
          </li>
        ))}
      </ul>

      <section aria-labelledby="creditos" className="mt-8 rounded-card border border-brand-border bg-brand-soft p-4">
        <h2 id="creditos" className="text-lg font-bold">Créditos de las imágenes</h2>
        <ol className="mt-2 list-decimal space-y-1 pl-6">
          {gallery.items.map((it) => (
            <li key={it.url}><Attribution item={it} /></li>
          ))}
        </ol>
      </section>

      {gallery.activity && gallery.activity.questions.length > 0 && (
        <section aria-labelledby="actividad" className="mt-8">
          <h2 id="actividad" className="flex items-center gap-2 text-2xl font-bold"><Icon name="trivia" className="h-7 w-7 text-brand-secondary" /> Actividad: ¿qué aprendiste?</h2>
          <TriviaQuiz questions={gallery.activity.questions} idPrefix="galeria" />
        </section>
      )}

      {open != null && <Lightbox items={gallery.items} index={open} onIndex={setOpen} onClose={close} />}
    </div>
  );
}

const MAX_ZOOM = 5;

function Lightbox({ items, index, onIndex, onClose }: { items: GalleryItemDTO[]; index: number; onIndex: (i: number) => void; onClose: () => void }) {
  const item = items[index]!;
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dialogRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{ startDist: number; startScale: number; startX: number; startY: number; panX: number; panY: number; moved: boolean } | null>(null);
  const lastTap = useRef(0);

  const go = useCallback((d: 1 | -1) => onIndex(nextIndex(index, d, items.length)), [index, items.length, onIndex]);
  const zoomTo = useCallback((s: number) => {
    const z = clampZoom(s, MAX_ZOOM);
    setScale(z);
    if (z === 1) setPan({ x: 0, y: 0 });
  }, []);

  // Al cambiar de imagen: zoom y desplazamiento a cero.
  useEffect(() => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  }, [index]);

  // Foco inicial, bloqueo de scroll del fondo.
  useEffect(() => {
    closeRef.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Rueda del ratón / trackpad (listener no pasivo para poder evitar el scroll).
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setScale((s) => {
        const z = clampZoom(s * (e.deltaY < 0 ? 1.15 : 1 / 1.15), MAX_ZOOM);
        if (z === 1) setPan({ x: 0, y: 0 });
        return z;
      });
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { e.preventDefault(); onClose(); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
    else if (e.key === '+' || e.key === '=') { e.preventDefault(); zoomTo(scale + 0.5); }
    else if (e.key === '-') { e.preventDefault(); zoomTo(scale - 0.5); }
    else if (e.key === '0') { e.preventDefault(); zoomTo(1); }
    else if (e.key === 'Tab') {
      // Trampa de foco simple dentro del diálogo
      const f = dialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), a[href]');
      if (!f || f.length === 0) return;
      const first = f[0]!;
      const last = f[f.length - 1]!;
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  };

  const dist = () => {
    const [a, b] = [...pointers.current.values()];
    return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0;
  };
  const onPointerDown = (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    gesture.current = { startDist: dist(), startScale: scale, startX: e.clientX, startY: e.clientY, panX: pan.x, panY: pan.y, moved: false };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId) || !gesture.current) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const g = gesture.current;
    if (pointers.current.size >= 2) {
      g.moved = true;
      if (g.startDist > 0) zoomTo(g.startScale * (dist() / g.startDist));
      else g.startDist = dist();
    } else if (scale > 1) {
      g.moved = true;
      setPan({ x: g.panX + (e.clientX - g.startX) / scale, y: g.panY + (e.clientY - g.startY) / scale });
    } else if (Math.abs(e.clientX - g.startX) > 8) {
      g.moved = true;
    }
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const g = gesture.current;
    const wasPinch = pointers.current.size >= 2;
    pointers.current.delete(e.pointerId);
    if (!g) return;
    if (!wasPinch && scale === 1) {
      const dir = swipeDirection(e.clientX - g.startX, e.clientY - g.startY);
      if (dir) { go(dir); gesture.current = null; return; }
    }
    if (!g.moved) {
      const now = Date.now();
      if (now - lastTap.current < 300) zoomTo(scale > 1 ? 1 : 2.5); // doble toque
      lastTap.current = now;
    }
    if (pointers.current.size === 0) gesture.current = null;
    else {
      // Queda un dedo tras pellizcar: reiniciar el gesto desde ahí
      const [p] = [...pointers.current.values()];
      gesture.current = { startDist: 0, startScale: scale, startX: p!.x, startY: p!.y, panX: pan.x, panY: pan.y, moved: true };
    }
  };

  const captionId = `lb-caption-${index}`;
  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Imagen ${index + 1} de ${items.length}`}
      aria-describedby={captionId}
      onKeyDown={onKeyDown}
      tabIndex={-1}
      className="fixed inset-0 z-[100] flex flex-col bg-black text-white outline-none"
    >
      <div className="relative z-10 flex items-center gap-2 bg-black p-2">
        <span className="whitespace-nowrap px-2 text-sm tabular-nums" aria-live="polite">{index + 1} / {items.length}</span>
        <div role="toolbar" aria-label="Zoom" className="ml-auto flex items-center gap-1">
          <button type="button" className="btn border-white/30 bg-white/10 text-white enabled:hover:bg-white/20" onClick={() => zoomTo(scale - 0.5)} disabled={scale <= 1} aria-label="Alejar"><Icon name="menos" /></button>
          <span className="w-14 text-center text-sm tabular-nums">{Math.round(scale * 100)}%</span>
          <button type="button" className="btn border-white/30 bg-white/10 text-white enabled:hover:bg-white/20" onClick={() => zoomTo(scale + 0.5)} disabled={scale >= MAX_ZOOM} aria-label="Acercar"><Icon name="mas" /></button>
          <button type="button" className="btn border-white/30 bg-white/10 text-white enabled:hover:bg-white/20" onClick={() => zoomTo(1)} disabled={scale === 1} aria-label="Tamaño original"><Icon name="refrescar" /></button>
        </div>
        <button ref={closeRef} type="button" className="btn border-white/30 bg-white/10 text-white enabled:hover:bg-white/20" onClick={onClose} aria-label="Cerrar visor"><Icon name="cerrar" /></button>
      </div>

      <div className="relative min-h-0 flex-1">
        <div
          ref={stageRef}
          className="flex h-full w-full touch-none select-none items-center justify-center overflow-hidden"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          style={{ cursor: scale > 1 ? 'grab' : 'zoom-in' }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={item.url}
            src={item.url}
            alt={item.alt}
            draggable={false}
            className="max-h-full max-w-full object-contain transition-transform duration-75"
            style={{ transform: `scale(${scale}) translate(${pan.x}px, ${pan.y}px)` }}
          />
        </div>
        {items.length > 1 && (
          <>
            <button type="button" onClick={() => go(-1)} aria-label="Imagen anterior" className="btn absolute left-2 top-1/2 -translate-y-1/2 border-white/30 bg-black/50 text-white enabled:hover:bg-black/70">
              <Icon name="anterior" className="h-8 w-8" />
            </button>
            <button type="button" onClick={() => go(1)} aria-label="Imagen siguiente" className="btn absolute right-2 top-1/2 -translate-y-1/2 border-white/30 bg-black/50 text-white enabled:hover:bg-black/70">
              <Icon name="siguiente" className="h-8 w-8" />
            </button>
          </>
        )}
      </div>

      <div id={captionId} className="relative z-10 max-h-[30vh] overflow-auto bg-black p-4">
        {item.caption && <p className="text-base leading-relaxed">{item.caption}</p>}
        <Attribution item={item} className="mt-1 text-white/80" />
        <p className="mt-1 text-xs text-white/60">Desliza o usa las flechas para cambiar de imagen · pellizca, usa la rueda o los botones para ampliar · doble toque para acercar.</p>
      </div>
    </div>
  );
}
