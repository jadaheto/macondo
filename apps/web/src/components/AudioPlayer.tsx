'use client';

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { clearAudioPosition, formatTime, getResumePosition, PLAYBACK_RATES, saveAudioPosition } from '@/lib/audioResume';
import { readJSON, writeJSON } from '@/lib/storage';
import { Icon } from './Icon';

const RATE_KEY = 'macondo.audio.rate';
const SAVE_EVERY_MS = 5000;

/**
 * Reproductor MP3 accesible. Usa <audio> con la URL /file (el servidor admite Range, lo que
 * permite buscar sin descargar todo). Atajos: Espacio/K reproducir, ←/J −15 s, →/L +15 s.
 */
export function AudioPlayer({ resourceId, src, title, narrator }: { resourceId: string; src: string; title: string; narrator?: string | null }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const lastSave = useRef(0);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [rate, setRate] = useState<number>(1);
  const [error, setError] = useState<string | null>(null);
  const [resumedFrom, setResumedFrom] = useState<number | null>(null);

  useEffect(() => {
    const saved = readJSON<number>(RATE_KEY, 1);
    if ((PLAYBACK_RATES as readonly number[]).includes(saved)) setRate(saved);
  }, []);

  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = rate;
  }, [rate]);

  const persist = useCallback(() => {
    const a = audioRef.current;
    if (a && a.currentTime > 0) saveAudioPosition(resourceId, a.currentTime, Number.isFinite(a.duration) ? a.duration : null);
  }, [resourceId]);

  useEffect(() => {
    const onHide = () => persist();
    window.addEventListener('pagehide', onHide);
    document.addEventListener('visibilitychange', onHide);
    return () => {
      persist();
      window.removeEventListener('pagehide', onHide);
      document.removeEventListener('visibilitychange', onHide);
    };
  }, [persist]);

  const toggle = async () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) {
      try {
        await a.play();
      } catch {
        setError('No se pudo iniciar la reproducción. Toca de nuevo el botón de reproducir.');
      }
    } else a.pause();
  };

  const skip = (delta: number) => {
    const a = audioRef.current;
    if (!a) return;
    const max = Number.isFinite(a.duration) ? a.duration : a.currentTime + Math.max(0, delta);
    a.currentTime = Math.min(Math.max(0, a.currentTime + delta), max);
    setCurrent(a.currentTime);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const tag = (e.target as HTMLElement).tagName;
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
    if (e.key === ' ' || e.key === 'k') {
      if (tag === 'BUTTON' && e.key === ' ') return; // el botón ya maneja Espacio
      e.preventDefault();
      void toggle();
    } else if (e.key === 'ArrowLeft' || e.key === 'j') {
      e.preventDefault();
      skip(-15);
    } else if (e.key === 'ArrowRight' || e.key === 'l') {
      e.preventDefault();
      skip(15);
    }
  };

  const chooseRate = (r: number) => {
    setRate(r);
    writeJSON(RATE_KEY, r);
  };

  return (
    <div role="region" aria-label={`Reproductor de audio: ${title}`} onKeyDown={onKeyDown} className="tarjeta p-4 sm:p-6">
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onLoadedMetadata={(e) => {
          const a = e.currentTarget;
          const d = Number.isFinite(a.duration) ? a.duration : 0;
          setDuration(d);
          a.playbackRate = rate;
          const pos = getResumePosition(resourceId, d || null);
          if (pos > 0) {
            a.currentTime = pos;
            setCurrent(pos);
            setResumedFrom(pos);
          }
        }}
        onTimeUpdate={(e) => {
          const a = e.currentTarget;
          setCurrent(a.currentTime);
          const now = Date.now();
          if (now - lastSave.current > SAVE_EVERY_MS) {
            lastSave.current = now;
            persist();
          }
        }}
        onPlay={() => setPlaying(true)}
        onPause={() => {
          setPlaying(false);
          persist();
        }}
        onEnded={() => {
          setPlaying(false);
          clearAudioPosition(resourceId);
        }}
        onError={() => setError('No se pudo cargar el audio. Puede que no haya conexión o que la licencia ya no esté vigente.')}
      />
      <div className="flex items-start gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-info-bg text-brand-info-text">
          <Icon name="audifonos" className="h-7 w-7" />
        </span>
        <div className="min-w-0">
          <p className="break-words text-xl font-bold text-brand-primary">{title}</p>
      {narrator && <p className="text-sm text-brand-muted">Narración: {narrator}</p>}
        </div>
      </div>
      {resumedFrom != null && (
        <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-brand-success-bg px-3 py-1 text-sm text-brand-success-text" role="status"><Icon name="tiempo" className="h-4 w-4" />Continuamos donde lo dejaste ({formatTime(resumedFrom)}).</p>
      )}

      <div className="mt-4">
        <label htmlFor={`seek-${resourceId}`} className="sr-only">Posición de reproducción</label>
        <input
          id={`seek-${resourceId}`}
          type="range"
          min={0}
          max={duration || 0}
          step={1}
          value={Math.min(current, duration || current)}
          onChange={(e) => {
            const a = audioRef.current;
            if (a) a.currentTime = Number(e.target.value);
            setCurrent(Number(e.target.value));
          }}
          aria-valuetext={`${formatTime(current)} de ${formatTime(duration)}`}
          className="h-12 w-full accent-brand-primary"
          disabled={!duration}
        />
        <div className="flex justify-between text-sm tabular-nums text-brand-muted" aria-hidden="true">
          <span>{formatTime(current)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
        <button type="button" className="btn-secundario" onClick={() => skip(-15)} aria-label="Retroceder 15 segundos">
          <Icon name="atras15" className="h-6 w-6" /> 15 s
        </button>
        <button
          type="button"
          className="btn-primario h-16 w-16 rounded-full p-0 shadow-card"
          onClick={() => void toggle()}
          aria-label={playing ? 'Pausar' : 'Reproducir'}
        >
          <Icon name={playing ? 'pausa' : 'play'} className="h-8 w-8" />
        </button>
        <button type="button" className="btn-secundario" onClick={() => skip(15)} aria-label="Adelantar 15 segundos">
          15 s <Icon name="adelante15" className="h-6 w-6" />
        </button>
      </div>

      <fieldset className="mt-4 flex flex-wrap items-center justify-center gap-2">
        <legend className="mb-1 w-full text-center text-sm font-semibold text-brand-text">Velocidad</legend>
        {PLAYBACK_RATES.map((r) => (
          <button
            key={r}
            type="button"
            aria-pressed={rate === r}
            onClick={() => chooseRate(r)}
            className={`btn min-w-touch px-3 ${rate === r ? 'border-brand-primary bg-brand-primary text-brand-on-primary' : 'border-brand-control-border bg-brand-surface text-brand-secondary hover:bg-brand-soft'}`}
          >
            {r.toLocaleString('es-CO')}×
          </button>
        ))}
      </fieldset>
      <p className="mt-3 text-center text-xs text-brand-muted">Atajos: Espacio o K reproduce/pausa · ← −15 s · → +15 s</p>
      {error && <p role="alert" className="mt-3 text-center text-brand-danger-text">{error}</p>}
    </div>
  );
}
