// Copia el worker (build legacy, compatible con navegadores más antiguos como Silk/Fire OS) de pdf.js a /public para servirlo desde el mismo origen (funciona offline vía SW).
import { copyFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const here = dirname(fileURLToPath(import.meta.url));
const src = require.resolve('pdfjs-dist/legacy/build/pdf.worker.min.mjs');
const destDir = join(here, '..', 'public');
mkdirSync(destDir, { recursive: true });
copyFileSync(src, join(destDir, 'pdf.worker.min.mjs'));
console.log('[copy-pdf-worker] pdf.worker.min.mjs copiado a public/');
