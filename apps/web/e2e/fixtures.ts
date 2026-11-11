import type { Page, Route } from '@playwright/test';

export const demoResource = (over: Record<string, unknown> = {}) => ({
  id: 'demo-pdf',
  title: 'Fábulas de Esopo (demo)',
  creator: 'Esopo',
  type: 'BOOK',
  description: 'Selección de fábulas de dominio público.',
  gradeMin: 1,
  gradeMax: 5,
  categories: ['fábulas'],
  language: 'es',
  narrator: null,
  durationSeconds: null,
  format: 'PDF',
  hasFile: true,
  hasCover: false,
  fileSha256: null,
  fileSizeBytes: 1000,
  status: 'PUBLISHED',
  license: {
    rightsHolder: 'Dominio público',
    licenseName: 'Dominio público',
    licenseUrl: null,
    authorizedDevices: 30,
    offlineAllowed: true,
    validFrom: null,
    validUntil: null,
    territory: 'CO',
  },
  accessible: true,
  createdAt: '2026-10-01T00:00:00.000Z',
  updatedAt: '2026-10-01T00:00:00.000Z',
  ...over,
});

export async function apiDown(page: Page) {
  await page.route('**/api/**', (route: Route) => route.abort('connectionrefused'));
}

export function json(route: Route, body: unknown, status = 200) {
  return route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
}

/** PDF mínimo válido de 2 páginas generado en memoria (xref con offsets correctos). */
export function tinyPdf(): Buffer {
  const objs = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R 5 0 R] /Count 2 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 200] /Contents 4 0 R /Resources << /Font << /F1 7 0 R >> >> >>',
    null, // 4: stream página 1
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 200] /Contents 6 0 R /Resources << /Font << /F1 7 0 R >> >> >>',
    null, // 6: stream página 2
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  const stream = (t: string) => {
    const s = `BT /F1 24 Tf 40 100 Td (${t}) Tj ET`;
    return `<< /Length ${s.length} >>\nstream\n${s}\nendstream`;
  };
  objs[3] = stream('Pagina 1');
  objs[5] = stream('Pagina 2');
  let out = '%PDF-1.4\n';
  const offsets: number[] = [];
  objs.forEach((o, i) => {
    offsets.push(out.length);
    out += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const xref = out.length;
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
  for (const off of offsets) out += `${String(off).padStart(10, '0')} 00000 n \n`;
  out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(out, 'latin1');
}
