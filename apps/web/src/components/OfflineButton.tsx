'use client';

import { useEffect, useState } from 'react';
import type { ResourceDTO } from '@macondo/shared';
import { downloadForOffline, getOfflineRecord, offlinePagePath, offlineSupported, OfflineError, removeOffline, warmOfflinePage } from '@/lib/offline';
import { formatBytes } from '@/lib/resource';
import { Icon } from './Icon';

/**
 * Acción explícita "Descargar para uso sin conexión". Solo se muestra si canDownloadOffline.
 * Persistencia en Fire OS: PENDIENTE DE VALIDACIÓN FÍSICA.
 */
export function OfflineButton({ resource }: { resource: ResourceDTO }) {
  const [state, setState] = useState<'idle' | 'downloading' | 'ready' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    setSupported(offlineSupported());
    if (getOfflineRecord(resource.id)) setState('ready');
  }, [resource.id]);

  const download = async () => {
    setState('downloading');
    setMessage(null);
    setProgress(0);
    try {
      const rec = await downloadForOffline(resource.id, resource, setProgress);
      await warmOfflinePage(offlinePagePath(rec));
      setState('ready');
      setMessage('Listo: archivo verificado (SHA-256) y guardado en este dispositivo.');
    } catch (e) {
      setState('error');
      setMessage(e instanceof OfflineError ? e.message : 'No se pudo completar la descarga.');
    }
  };

  const remove = async () => {
    await removeOffline(resource.id);
    setState('idle');
    setMessage('Se eliminó la copia sin conexión de este dispositivo.');
  };

  if (!supported) {
    return <p className="text-sm text-brand-muted">Este navegador no permite guardar recursos para uso sin conexión.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {state === 'ready' ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex min-h-touch items-center gap-2 rounded-control bg-brand-success-bg px-4 font-semibold text-brand-success-text">
            <Icon name="check" /> Disponible sin conexión
          </span>
          <button type="button" className="btn-fantasma text-sm underline" onClick={remove}>
            Quitar del dispositivo
          </button>
        </div>
      ) : (
        <button type="button" className="btn-secundario" onClick={download} disabled={state === 'downloading'} aria-describedby="offline-ayuda">
          <Icon name="descarga" />
          {state === 'downloading' ? `Descargando… ${Math.round(progress * 100)}%` : 'Descargar para uso sin conexión'}
        </button>
      )}
      {state === 'downloading' && (
        <progress className="h-2 w-full accent-brand-accent" max={1} value={progress} aria-label="Progreso de la descarga" />
      )}
      <p id="offline-ayuda" className="text-xs text-brand-muted">
        {formatBytes(resource.fileSizeBytes) ? `Tamaño: ${formatBytes(resource.fileSizeBytes)}. ` : ''}
        La licencia permite uso sin conexión. Función en prueba: su persistencia en tablets Fire HD 10 está pendiente de validación física.
      </p>
      {message && (
        <p role="status" className={`text-sm ${state === 'error' ? 'text-brand-danger-text' : 'text-brand-success-text'}`}>
          {message}
        </p>
      )}
    </div>
  );
}
