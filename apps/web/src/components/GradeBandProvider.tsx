'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { BAND_CONFIG, GRADE_BAND_STORAGE_KEY, parseStoredBand, type BandConfig, type GradeBand } from '@/lib/gradeBand';

interface GradeBandContextValue {
  band: GradeBand | null;
  config: BandConfig;
  ready: boolean;
  setBand: (band: GradeBand | null) => void;
}

const GradeBandContext = createContext<GradeBandContextValue | null>(null);

export function GradeBandProvider({ children }: { children: ReactNode }) {
  const [band, setBandState] = useState<GradeBand | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      setBandState(parseStoredBand(window.localStorage.getItem(GRADE_BAND_STORAGE_KEY)));
    } catch {
      /* sin almacenamiento */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (band) document.documentElement.dataset.band = band;
    else delete document.documentElement.dataset.band;
  }, [band]);

  const setBand = useCallback((b: GradeBand | null) => {
    setBandState(b);
    try {
      if (b) window.localStorage.setItem(GRADE_BAND_STORAGE_KEY, JSON.stringify(b));
      else window.localStorage.removeItem(GRADE_BAND_STORAGE_KEY);
    } catch {
      /* sin almacenamiento */
    }
  }, []);

  const value = useMemo(() => ({ band, config: BAND_CONFIG[band ?? '6-8'], ready, setBand }), [band, ready, setBand]);
  return <GradeBandContext.Provider value={value}>{children}</GradeBandContext.Provider>;
}

export function useGradeBand(): GradeBandContextValue {
  const ctx = useContext(GradeBandContext);
  if (!ctx) throw new Error('useGradeBand debe usarse dentro de <GradeBandProvider>');
  return ctx;
}
