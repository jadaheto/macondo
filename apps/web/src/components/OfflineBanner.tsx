'use client';

import { useEffect, useState } from 'react';
import { NETWORK_FAIL_EVENT, NETWORK_OK_EVENT } from '@/lib/api';
import { Icon } from './Icon';

export function OfflineBanner() {
  const [offline, setOffline] = useState(false);
  const [serverDown, setServerDown] = useState(false);

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    const onFail = () => setServerDown(true);
    const onOk = () => setServerDown(false);
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    window.addEventListener(NETWORK_FAIL_EVENT, onFail);
    window.addEventListener(NETWORK_OK_EVENT, onOk);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
      window.removeEventListener(NETWORK_FAIL_EVENT, onFail);
      window.removeEventListener(NETWORK_OK_EVENT, onOk);
    };
  }, []);

  if (!offline && !serverDown) return null;
  return (
    <div role="status" aria-live="polite" className="flex items-center justify-center gap-2 bg-brand-primary px-4 py-2 text-center text-sm font-semibold text-brand-on-primary">
      <Icon name="nube-off" className="h-5 w-5" />
      {offline
        ? 'Sin conexión. Puedes usar los recursos que descargaste para uso sin conexión.'
        : 'No logramos comunicarnos con el servidor de la biblioteca. Algunas secciones pueden no cargar.'}
    </div>
  );
}
