'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

export function QrCode({ value, label, size = 220 }: { value: string; label: string; size?: number }) {
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let alive = true;
    QRCode.toDataURL(value, { margin: 1, width: size, errorCorrectionLevel: 'M', color: { dark: '#17365d', light: '#FFFFFF' } })
      .then((url) => alive && setSrc(url))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [value, size]);
  if (failed) return <p className="text-sm text-brand-muted">No se pudo generar el código QR.</p>;
  if (!src) return <div className="animate-pulse rounded-control bg-brand-soft" style={{ width: size, height: size }} aria-hidden="true" />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} width={size} height={size} alt={label} className="rounded-control border border-brand-border bg-white p-1" />;
}
