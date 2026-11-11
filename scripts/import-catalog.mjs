#!/usr/bin/env node
/**
 * Importa un manifiesto de catalogo-dp/ a una instancia de Macondo Digital A TRAVÉS DE LA API
 * (login admin → crear recurso → subir archivo → subir portada). Funciona igual contra local o EasyPanel.
 *
 *   node scripts/import-catalog.mjs --api http://localhost:3100 --manifest catalogo-dp/libros.manifest.json \
 *        [--email admin@macondo.local] [--password ...] [--limit 10] [--dry-run] [--publish]
 *   node scripts/import-catalog.mjs --api http://localhost:3100 --retos catalogo-dp/retos/retos.json [--dry-run]
 *
 * Galerías: si `file` es una carpeta (galerias/<slug>), se empaqueta en un ZIP temporal con el CLI `zip`
 * (macOS/Linux) y se sube; la API valida y extrae gallery.json + imágenes. No se verifica sha256 de carpetas.
 * Extras: `text`, `relatedTitle`, `relatedCreator`, `timeline`, `funFacts`, `questions` se envían como `extra`.
 * Retos: --retos envía el arreglo a POST /api/admin/challenges/import (idempotente por id, en lotes de 100).
 *
 * Credenciales: --email/--password o variables IMPORT_EMAIL / IMPORT_PASSWORD.
 * Idempotente: si ya existe un recurso con el mismo título+autor+tipo, no lo duplica; solo sube
 * el archivo/portada que falten. Los recursos quedan en BORRADOR, salvo --publish (usar solo tras la
 * revisión pedagógica del lote: publica los que tengan archivo).
 */
import { mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import os from 'node:os';
import { openAsBlob } from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, arr) => {
    if (a.startsWith('--')) acc.push([a.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : true]);
    return acc;
  }, []),
);
const API = String(args.api || 'http://localhost:3100').replace(/\/$/, '');
const MANIFEST = args.manifest;
const EMAIL = args.email || process.env.IMPORT_EMAIL || 'admin@macondo.local';
const PASSWORD = args.password || process.env.IMPORT_PASSWORD || 'MacondoDev2026!';
const LIMIT = args.limit ? Number(args.limit) : Infinity;
const DRY = Boolean(args['dry-run']);
const PUBLISH = Boolean(args.publish);
const RETOS = typeof args.retos === 'string' ? args.retos : null;
if (!MANIFEST && !RETOS) {
  console.error('Uso: node scripts/import-catalog.mjs --api <url> (--manifest <ruta.json> [--limit N] [--publish] | --retos <retos.json>) [--dry-run]');
  process.exit(2);
}
const BASE_DIR = path.dirname(path.resolve(MANIFEST || RETOS));
const MIME = { '.epub': 'application/epub+zip', '.pdf': 'application/pdf', '.mp3': 'audio/mpeg', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.zip': 'application/zip' };
const INPUT_KEYS = ['title', 'creator', 'type', 'description', 'gradeMin', 'gradeMax', 'categories', 'language', 'narrator', 'durationSeconds', 'license'];
const EXTRA_KEYS = ['text', 'relatedTitle', 'relatedCreator', 'timeline', 'funFacts', 'questions'];
function extraOf(e) {
  const extra = Object.fromEntries(EXTRA_KEYS.filter((k) => e[k] !== undefined && e[k] !== null).map((k) => [k, e[k]]));
  return Object.keys(extra).length ? extra : null;
}

let token = '';
async function api(method, url, body, isForm = false) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const res = await fetch(API + url, {
      method,
      headers: { ...(token ? { authorization: `Bearer ${token}` } : {}), ...(body && !isForm ? { 'content-type': 'application/json' } : {}) },
      body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
    });
    if (res.status === 429 || res.status >= 502) { await new Promise((r) => setTimeout(r, 1500 * attempt)); continue; }
    const text = await res.text();
    const data = text ? (() => { try { return JSON.parse(text); } catch { return text; } })() : null;
    if (!res.ok) throw Object.assign(new Error(`${method} ${url} → ${res.status} ${typeof data === 'string' ? data : JSON.stringify(data)}`), { status: res.status });
    return data;
  }
  throw new Error(`${method} ${url}: reintentos agotados`);
}

async function sha256File(file) {
  const h = createHash('sha256');
  await new Promise((ok, ko) => createReadStream(file).on('data', (d) => h.update(d)).on('end', ok).on('error', ko));
  return h.digest('hex');
}

function insideCatalog(rel) {
  const abs = path.resolve(BASE_DIR, rel);
  if (!abs.startsWith(BASE_DIR + path.sep)) throw new Error(`Ruta fuera del catálogo: ${rel}`);
  return abs;
}

/** Empaqueta una carpeta de galería en un ZIP temporal (entradas `<slug>/...`, sin basura de Finder). */
async function zipDirectory(dir) {
  const tmp = await mkdtemp(path.join(os.tmpdir(), 'macondo-galeria-'));
  const out = path.join(tmp, `${path.basename(dir)}.zip`);
  try {
    execFileSync('zip', ['-r', '-X', '-q', '-y', out, path.basename(dir), '-x', '*.DS_Store', '*/__MACOSX/*', '*/._*'], { cwd: path.dirname(dir), stdio: 'pipe' });
  } catch (err) {
    await rm(tmp, { recursive: true, force: true });
    throw new Error(`No se pudo crear el ZIP de ${dir} (¿está instalado el comando zip?): ${err.message}`);
  }
  return { file: out, cleanup: () => rm(tmp, { recursive: true, force: true }) };
}

async function upload(id, kind, rel) {
  let abs = insideCatalog(rel);
  let cleanup = null;
  if ((await stat(abs)).isDirectory()) ({ file: abs, cleanup } = await zipDirectory(abs));
  try {
    const blob = await openAsBlob(abs, { type: MIME[path.extname(abs).toLowerCase()] || 'application/octet-stream' });
    const fd = new FormData();
    fd.append('file', blob, path.basename(abs));
    return await api('POST', `/api/admin/resources/${id}/${kind}`, fd, true);
  } finally {
    if (cleanup) await cleanup();
  }
}

async function findExisting(e) {
  const q = new URLSearchParams({ q: e.title.slice(0, 100), type: e.type, pageSize: '100' });
  const page = await api('GET', `/api/admin/resources?${q}`);
  return (page.items || []).find((r) => r.title === e.title && r.creator === e.creator && r.type === e.type) || null;
}

if (RETOS) {
  const retos = JSON.parse(await readFile(RETOS, 'utf8'));
  if (!Array.isArray(retos)) throw new Error('retos.json debe ser un arreglo');
  console.log(`Retos: ${RETOS} · ${retos.length} retos · API ${API}${DRY ? ' · SIMULACIÓN' : ''}`);
  const kinds = retos.reduce((a, r) => ({ ...a, [r.kind]: (a[r.kind] || 0) + 1 }), {});
  console.log('Por tipo:', JSON.stringify(kinds));
  if (!DRY) {
    token = (await api('POST', '/api/auth/login', { email: EMAIL, password: PASSWORD })).accessToken;
    const total = { created: 0, updated: 0, unresolved: [], total: 0 };
    for (let i = 0; i < retos.length; i += 100) {
      const r = await api('POST', '/api/admin/challenges/import', retos.slice(i, i + 100));
      total.created += r.created; total.updated += r.updated; total.total += r.total; total.unresolved.push(...r.unresolved);
    }
    console.log('Resumen:', JSON.stringify({ ...total, unresolved: total.unresolved.length }));
    if (total.unresolved.length) console.log('Retos con obra no encontrada en el catálogo (se importaron sin enlace):\n  ' + total.unresolved.join('\n  '));
  }
  process.exit(0);
}

const entries = JSON.parse(await readFile(MANIFEST, 'utf8')).slice(0, LIMIT);
console.log(`Manifiesto: ${MANIFEST} · ${entries.length} entradas · API ${API}${DRY ? ' · SIMULACIÓN' : ''}`);
if (!DRY) token = (await api('POST', '/api/auth/login', { email: EMAIL, password: PASSWORD })).accessToken;

const stats = { creados: 0, existentes: 0, archivos: 0, portadas: 0, publicados: 0, errores: 0 };
const errores = [];
for (const [i, e] of entries.entries()) {
  const tag = `[${i + 1}/${entries.length}] ${e.title.slice(0, 60)}`;
  try {
    if (e.file) {
      const abs = path.resolve(BASE_DIR, e.file);
      const st = await stat(abs);
      if (st.isFile() && e.sha256 && (await sha256File(abs)) !== e.sha256) throw new Error('SHA-256 no coincide con el manifiesto (archivo dañado)');
    }
    if (DRY) { console.log(`${tag} · OK (simulación)`); continue; }
    const input = Object.fromEntries(INPUT_KEYS.filter((k) => e[k] !== undefined).map((k) => [k, e[k]]));
    const extra = extraOf(e);
    if (extra) input.extra = extra;
    let r = await findExisting(e);
    if (r) {
      stats.existentes++;
      if (extra && !r.extra) r = await api('PATCH', `/api/admin/resources/${r.id}`, { extra });
    } else { r = await api('POST', '/api/admin/resources', input); stats.creados++; }
    if (e.file && !r.hasFile) { await upload(r.id, 'file', e.file); stats.archivos++; }
    if (e.cover && !r.hasCover) { await upload(r.id, 'cover', e.cover); stats.portadas++; }
    let status = r.status ?? 'DRAFT';
    if (PUBLISH && status !== 'PUBLISHED' && (r.hasFile || e.file)) {
      await api('POST', `/api/admin/resources/${r.id}/status`, { status: 'PUBLISHED' }); status = 'PUBLISHED'; stats.publicados++;
    }
    console.log(`${tag} · ${status} · id ${r.id}`);
  } catch (err) {
    stats.errores++; errores.push(`${tag}: ${err.message}`);
    console.error(`${tag} · ERROR ${err.message}`);
  }
}
console.log('\nResumen:', JSON.stringify(stats));
if (errores.length) { console.log('Errores:\n' + errores.join('\n')); process.exitCode = 1; }
