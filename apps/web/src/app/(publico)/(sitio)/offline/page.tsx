'use client';

import { useEffect, useState } from 'react';
import { getOfflineIndex, isLicenseStillValid, offlinePagePath, type OfflineRecord } from '@/lib/offline';
import { Vacio } from '@/components/StateViews';
import { formatBytes } from '@/lib/resource';
import { Icon } from '@/components/Icon';
import { type CuentoGuardado, listarMisCuentos, quitarMiCuento } from '@/lib/cuentos';

/** Página de respaldo sin conexión: lista lo descargado en este dispositivo. */
export default function OfflinePage() {
  const [items, setItems] = useState<OfflineRecord[]>([]);
  const [cuentos, setCuentos] = useState<CuentoGuardado[]>([]);
  useEffect(() => {
    setItems(Object.values(getOfflineIndex()).filter((r) => isLicenseStillValid(r)));
    setCuentos(listarMisCuentos());
  }, []);
  return (
    <div>
      <h1 className="text-3xl font-bold">Disponible sin conexión</h1>
      <p className="mt-2 text-brand-muted">
        Recursos guardados en este dispositivo. Función en prueba: la persistencia en tablets Fire HD 10 está pendiente de validación física.
      </p>
      {items.length === 0 ? (
        <Vacio title="No hay recursos descargados">Desde la ficha de un recurso con licencia que lo permita, usa “Descargar para uso sin conexión”.</Vacio>
      ) : (
        <ul className="mt-4 space-y-2">
          {items.map((r) => (
            <li key={r.id} className="tarjeta flex min-w-0 items-center justify-between gap-3 p-3">
              <span className="min-w-0">
                <span className="break-words font-semibold text-brand-primary">{r.title}</span>
                <span className="ml-2 text-sm text-brand-muted">{formatBytes(r.sizeBytes)}</span>
              </span>
              {/* <a> y no <Link>: sin red, la navegación completa la sirve el service worker desde la caché */}
              <a href={offlinePagePath(r)} className="btn-primario" aria-label={`Abrir ${r.title}`}><Icon name={offlinePagePath(r).startsWith('/galeria') ? 'galeria' : 'libro'} className="h-5 w-5" /> Abrir</a>
            </li>
          ))}
        </ul>
      )}
      <section className="mt-8" aria-labelledby="mis-cuentos">
        <h2 id="mis-cuentos" className="text-2xl font-bold">Mis cuentos</h2>
        <p className="mt-1 text-sm text-brand-muted">Cuentos del Taller de cuentos guardados en esta tablet (texto y preguntas; el audio necesita conexión).</p>
        {cuentos.length === 0 ? (
          <p className="mt-2 text-brand-muted">Todavía no has guardado cuentos. En el taller, usa «Guardar en esta tablet».</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {cuentos.map((c) => (
              <li key={c.id} className="tarjeta flex min-w-0 items-center justify-between gap-3 p-3">
                <span className="min-w-0">
                  <span className="break-words font-semibold text-brand-primary">{c.titulo}</span>
                  <span className="block text-sm text-brand-muted">Protagonista: {c.protagonista} · {c.autorNombre ? `por ${c.autorNombre}` : 'autor anónimo'}</span>
                </span>
                <span className="flex shrink-0 gap-2">
                  <a href={`/construye-tu-cuento?cuento=${encodeURIComponent(c.id)}`} className="btn-primario" aria-label={`Abrir ${c.titulo}`}><Icon name="letra" className="h-5 w-5" /> Abrir</a>
                  <button type="button" className="btn-fantasma" aria-label={`Quitar ${c.titulo}`} onClick={() => setCuentos(quitarMiCuento(c.id))}><Icon name="cerrar" className="h-5 w-5" /></button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
