'use client';

import { API_ROUTES, type ResourceDTO } from '@macondo/shared';
import { useApi } from './useApi';
import { getOfflineRecord } from '@/lib/offline';
import { useEffect, useState } from 'react';

/** Carga un recurso; si la red falla, usa la ficha guardada con la descarga offline (si existe). */
export function useResource(id: string | undefined) {
  const api = useApi<ResourceDTO>(id ? API_ROUTES.resource(id) : null);
  const [offlineCopy, setOfflineCopy] = useState<ResourceDTO | null>(null);
  useEffect(() => {
    if (id && api.error?.retryable) setOfflineCopy(getOfflineRecord(id)?.resource ?? null);
  }, [id, api.error]);
  const data = api.data ?? offlineCopy;
  return { ...api, data, error: data ? null : api.error, fromOffline: !api.data && !!offlineCopy };
}
