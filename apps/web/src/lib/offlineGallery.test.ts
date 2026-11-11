import type { OfflineManifestEntry } from '@macondo/shared';
import { planOfflineDownload } from './offline';
import { findRelated } from './resource';
import { localUploadProblem } from './adminData';

const base: OfflineManifestEntry = {
  id: 'g1', title: 'G', type: 'GALLERY', format: 'IMAGE_SET', sha256: 'zip', sizeBytes: 999, version: 'v',
  fileUrl: '/api/resources/g1/file', coverUrl: null, licenseValidUntil: null,
};

describe('descarga offline de galerías', () => {
  it('IMAGE_SET descarga cada imagen con su sha256 (no el ZIP)', () => {
    const plan = planOfflineDownload({
      ...base, galleryUrl: '/api/resources/g1/gallery',
      assets: [{ url: '/api/resources/g1/gallery/0', sha256: 'a', sizeBytes: 10, mime: 'image/png' }, { url: '/api/resources/g1/gallery/1', sha256: 'b', sizeBytes: 20, mime: 'image/jpeg' }],
    });
    expect(plan.map((p) => [p.url, p.sha256])).toEqual([['/api/resources/g1/gallery/0', 'a'], ['/api/resources/g1/gallery/1', 'b']]);
  });
  it('otros formatos (o galería sin assets) descargan el archivo principal', () => {
    expect(planOfflineDownload(base)).toEqual([{ url: base.fileUrl, sha256: 'zip', sizeBytes: 999 }]);
    expect(planOfflineDownload({ ...base, format: 'PDF', type: 'BOOK' })[0]!.url).toBe(base.fileUrl);
  });
});

describe('obra relacionada y carga de galerías en admin', () => {
  const items = [
    { id: '1', title: 'María', creator: 'Jorge Isaacs' },
    { id: '2', title: 'maria', creator: 'Otro' },
    { id: '3', title: 'La vorágine', creator: 'José Eustasio Rivera' },
  ];
  it('encuentra por título sin tildes y desempata por autor', () => {
    expect(findRelated(items, 'MARÍA', 'Otro')?.id).toBe('2');
    expect(findRelated(items, 'Maria', null)?.id).toBe('1');
    expect(findRelated(items, 'La Voragine', 'x')?.id).toBe('3');
    expect(findRelated(items, 'No existe')).toBeNull();
    expect(findRelated(items, 'María', 'Jorge Isaacs', '1')?.id).toBe('2');
  });
  it('la zona de carga de galerías solo acepta .zip', () => {
    expect(localUploadProblem({ name: 'fauna.zip', size: 100 }, 'gallery')).toBeNull();
    expect(localUploadProblem({ name: 'fauna.pdf', size: 100 }, 'gallery')).toMatch(/ZIP/);
    expect(localUploadProblem({ name: 'fauna.zip', size: 100 }, 'file')).toMatch(/formato no permitido/);
  });
});

describe('página que abre un recurso descargado (QA 2026-11-01)', () => {
  it('galerías → /galeria/:id; libros y audio → /leer/:id', async () => {
    const { offlinePagePath } = await import('./offline');
    expect(offlinePagePath({ id: 'g1', galleryUrl: '/api/resources/g1/gallery' })).toBe('/galeria/g1');
    expect(offlinePagePath({ id: 'g2', assetUrls: ['/api/resources/g2/gallery/0'] })).toBe('/galeria/g2');
    expect(offlinePagePath({ id: 'g3', resource: { type: 'GALLERY' } })).toBe('/galeria/g3');
    expect(offlinePagePath({ id: 'b1', resource: { type: 'BOOK' } })).toBe('/leer/b1');
    expect(offlinePagePath({ id: 'a1' })).toBe('/leer/a1');
  });
});
