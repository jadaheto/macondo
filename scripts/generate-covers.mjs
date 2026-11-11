#!/usr/bin/env node
/**
 * Genera portadas PNG propias (600×900) con la identidad Comfasucre para un manifiesto de catalogo-dp/
 * y escribe la ruta en el campo "cover". Sin imágenes de terceros: solo tipografía Outfit (OFL) y color.
 *
 *   node scripts/generate-covers.mjs catalogo-dp/libros.manifest.json [--force]
 */
import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('@playwright/test');

const manifestPath = process.argv[2];
const FORCE = process.argv.includes('--force');
if (!manifestPath) { console.error('Uso: node scripts/generate-covers.mjs <manifest.json> [--force]'); process.exit(2); }
const BASE = path.dirname(path.resolve(manifestPath));
const OUT = path.join(BASE, 'portadas');
await mkdir(OUT, { recursive: true });

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const font = (await readFile(path.join(ROOT, 'apps/web/public/brand/fonts/web/outfit-latin-20261003.woff2'))).toString('base64');

// Paletas por tipo (azules/turquesa/verde de branding.md §3.1/§3.4) con variación por índice.
const PALETTES = {
  BOOK: [['#17365d', '#205b88'], ['#064679', '#087ea4'], ['#123f67', '#176396'], ['#073258', '#1595a3']],
  AUDIOBOOK: [['#0a5c66', '#1595a3'], ['#087a68', '#0a927f'], ['#2d5a1a', '#5f8d28'], ['#14717b', '#205b88']],
  AUDIOBIOGRAPHY: [['#063b75', '#0569b9'], ['#164e7c', '#00a9ce'], ['#073258', '#087ea4']],
  AUDIOSUMMARY: [['#2f5f1c', '#76a82b'], ['#0b5e57', '#2f9f69'], ['#1f4d3a', '#5f8d28']],
};
const LABEL = { BOOK: 'LIBRO DIGITAL', AUDIOBOOK: 'AUDIOLIBRO', AUDIOBIOGRAPHY: 'AUDIOBIOGRAFÍA', AUDIOSUMMARY: 'AUDIORESUMEN' };
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function html(e, i) {
  const pal = PALETTES[e.type] || PALETTES.BOOK;
  const [a, b] = pal[i % pal.length];
  const t = e.title.length > 70 ? e.title.slice(0, 67) + '…' : e.title;
  const size = t.length > 45 ? 46 : t.length > 25 ? 56 : 66;
  return `<!doctype html><html><head><style>
  @font-face{font-family:Outfit;src:url(data:font/woff2;base64,${font}) format('woff2');font-weight:300 700}
  *{box-sizing:border-box;margin:0}
  body{width:600px;height:900px;font-family:Outfit,sans-serif;color:#fff;
    background:linear-gradient(150deg,${a} 0%,${b} 100%);position:relative;overflow:hidden}
  .frame{position:absolute;inset:28px;border:2px solid rgba(255,255,255,.35);border-radius:18px}
  .wave{position:absolute;right:-120px;bottom:-140px;width:460px;height:460px;border-radius:50%;
    border:40px solid rgba(255,255,255,.07)}
  .top{position:absolute;top:70px;left:64px;right:64px;font-size:16px;letter-spacing:.14em;font-weight:600;opacity:.85;white-space:nowrap}
  .title{position:absolute;top:200px;left:64px;right:64px;font-size:${size}px;line-height:1.08;font-weight:700}
  .author{position:absolute;top:auto;bottom:210px;left:64px;right:64px;font-size:30px;font-weight:400;opacity:.95}
  .foot{position:absolute;bottom:70px;left:64px;right:64px;display:flex;justify-content:space-between;align-items:center;font-size:18px}
  .pill{background:rgba(255,255,255,.95);color:${a};border-radius:999px;padding:8px 18px;font-weight:700;letter-spacing:.08em}
  .brand{opacity:.9;font-weight:500}
  </style></head><body><div class="wave"></div><div class="frame"></div>
  <div class="top">MACONDO DIGITAL · DOMINIO PÚBLICO</div>
  <div class="title">${esc(t)}</div>
  <div class="author">${esc(e.creator)}</div>
  <div class="foot"><span class="pill">${LABEL[e.type] || 'RECURSO'}</span><span class="brand">Biblioteca Macondo</span></div>
  </body></html>`;
}

const entries = JSON.parse(await readFile(manifestPath, 'utf8'));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 600, height: 900 } });
let made = 0;
for (const [i, e] of entries.entries()) {
  const name = (e.file ? path.basename(e.file).replace(/\.[^.]+$/, '') : `recurso-${i}`) + '.png';
  const rel = `portadas/${name}`;
  const abs = path.join(OUT, name);
  const exists = await access(abs).then(() => true, () => false);
  if (!exists || FORCE) {
    await page.setContent(html(e, i));
    await page.screenshot({ path: abs });
    made++;
  }
  e.cover = rel;
}
await browser.close();
await writeFile(manifestPath, JSON.stringify(entries, null, 2) + '\n');
console.log(`Portadas: ${made} generadas, ${entries.length} referenciadas en ${manifestPath}`);
