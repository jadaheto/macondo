'use client';

import { useEffect } from 'react';

/**
 * Registra el service worker (solo en producción para no interferir con el desarrollo).
 * Persistencia en Fire OS (Silk / WebView): PENDIENTE DE VALIDACIÓN FÍSICA.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {
      /* sin SW: la app sigue funcionando en línea */
    });
  }, []);
  return null;
}
