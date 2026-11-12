#!/usr/bin/env node
/**
 * Portadas originales para el catálogo (sustituyen a las tipográficas generadas por generate-covers.mjs).
 *
 * Fuentes, todas de dominio público:
 *   - Libros de Project Gutenberg: imagen de cubierta/portadilla escaneada de la edición original que viene dentro
 *     del EPUB (se descartan las portadas «plantilla» que genera PG, detectadas por su paleta plana).
 *   - Audiolibros de LibriVox: arte del proyecto publicado en archive.org (LibriVox exige que sea de dominio público).
 *   - Libros de Wikisource (y Gutenberg sin escaneo): primera página útil del escaneo (DjVu/PDF) del que se transcribió
 *     el texto, alojado en Wikimedia Commons; se localiza por el «Índice:» de la página de Wikisource.
 *
 * Fases (ejecutar en este orden; cada una es idempotente):
 *   node portadas-originales.mjs --extraer              # EPUB → portadas-originales/<base>.jpg          (host, sharp)
 *   node portadas-originales.mjs --descargar            # LibriVox + Commons → portadas-originales/_raw/  (necesita internet;
 *                                                       #   en este Mac: docker run --dns 8.8.8.8 … node:22)
 *   node portadas-originales.mjs --preparar             # _raw → portadas-originales/<base>.jpg + hojas de revisión
 *   node portadas-originales.mjs --aplicar --api URL    # sube las portadas por la API de administración
 *   node portadas-originales.mjs --manifiestos          # apunta los manifiestos a las nuevas portadas
 *
 * Credenciales de --aplicar: --email/--password o IMPORT_EMAIL / IMPORT_PASSWORD (como import-catalog.mjs).
 * Estado persistente: portadas-originales/estado.json (qué se obtuvo de dónde, y qué se excluyó).
 */
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile, stat, rename, rm } from 'node:fs/promises';
import { existsSync, openAsBlob } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CAT = path.resolve(HERE, '..');
const OUT = path.join(CAT, 'portadas-originales');
const RAW = path.join(OUT, '_raw');
const REV = path.join(OUT, '_revision');
const STATE = path.join(OUT, 'estado.json');
const MANIFESTS = ['libros.manifest.json', 'libros-lote2.manifest.json', 'audiolibros.manifest.json'];
const UA = 'MacondoDigital/1.0 (biblioteca escolar Comfasucre; portadas de dominio público)';

const args = process.argv.slice(2).reduce((acc, a, i, arr) => {
  if (a.startsWith('--')) acc[a.slice(2)] = arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : true;
  return acc;
}, {});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const EXCL = path.join(OUT, 'exclusiones.json');
/** Estado + exclusiones manuales (exclusiones.json: { base: motivo }); una exclusión siempre prevalece. */
const loadState = async () => {
  const st = existsSync(STATE) ? JSON.parse(await readFile(STATE, 'utf8')) : { items: {} };
  if (existsSync(EXCL)) {
    const ex = JSON.parse(await readFile(EXCL, 'utf8'));
    for (const [base, reason] of Object.entries(ex)) if (!base.startsWith('_')) (st.items[base] ||= {}).excluded = reason;
  }
  return st;
};
const saveState = (s) => writeFile(STATE, JSON.stringify(s, null, 2) + '\n');
const baseOf = (e) => path.basename(e.file, path.extname(e.file));

/** Entradas de los tres manifiestos con su clave estable. */
async function entries() {
  const out = [];
  for (const m of MANIFESTS) {
    const arr = JSON.parse(await readFile(path.join(CAT, m), 'utf8'));
    arr.forEach((e, i) => out.push({ manifest: m, index: i, base: baseOf(e), e }));
  }
  return out;
}

function provider(e) {
  if (e.file.startsWith('audiolibros/librivox-')) return 'librivox';
  if (/gutenberg-\d+/.test(e.file)) return 'gutenberg';
  if (e.source?.provider === 'Wikisource' || /wikisource/.test(e.license?.licenseUrl || '')) return 'wikisource';
  return 'otro';
}

async function fetchText(url, opts = {}) {
  for (let i = 1; i <= 4; i++) {
    const res = await fetch(url, { headers: { 'user-agent': UA, ...(opts.headers || {}) }, redirect: 'follow' });
    if (res.status === 429 || res.status >= 500) { await sleep(2000 * i); continue; }
    if (!res.ok) throw Object.assign(new Error(`${url} → ${res.status}`), { status: res.status });
    return res.text();
  }
  throw new Error(`${url}: reintentos agotados`);
}
async function fetchFile(url, dest) {
  for (let i = 1; i <= 4; i++) {
    const res = await fetch(url, { headers: { 'user-agent': UA }, redirect: 'follow' });
    if (res.status === 429 || res.status >= 500) { await sleep(2000 * i); continue; }
    if (!res.ok) throw Object.assign(new Error(`${url} → ${res.status}`), { status: res.status });
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 2000) throw new Error(`${url}: respuesta demasiado pequeña (${buf.length} B)`);
    await writeFile(dest, buf);
    return buf.length;
  }
  throw new Error(`${url}: reintentos agotados`);
}

// ───────────────────────── imagen (solo en el host; sharp es nativo) ─────────────────────────
let sharpMod = null;
async function sharp() {
  if (!sharpMod) sharpMod = (await import('sharp')).default;
  return sharpMod;
}
/**
 * Detecta las portadas «plantilla» que genera Project Gutenberg (fondo blanco con título + bloque de formas
 * geométricas en dos colores puros): más del 45 % de los píxeles con saturación alta. Los escaneos de ediciones
 * reales, incluso con marcos de color, se quedan por debajo del 42 % (verificado a ojo sobre los 228 EPUB del catálogo).
 */
async function isPgTemplate(file) {
  const s = await sharp();
  const { data } = await s(file).resize(60, 90, { fit: 'fill' }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  let sat = 0, n = 0;
  for (let i = 0; i < data.length; i += 3) {
    const mx = Math.max(data[i], data[i + 1], data[i + 2]), mn = Math.min(data[i], data[i + 1], data[i + 2]);
    if (mx > 120 && (mx - mn) / mx > 0.75) sat++;
    n++;
  }
  return sat / n >= 0.45;
}
/** Proporción de píxeles «con tinta» y desviación típica del gris (para elegir la página útil de un escaneo). */
async function pageStats(file) {
  const s = await sharp();
  const { data } = await s(file).resize(64, 96, { fit: 'fill' }).greyscale().raw().toBuffer({ resolveWithObject: true });
  let ink = 0, sum = 0;
  for (const v of data) { if (v < 160) ink++; sum += v; }
  const mean = sum / data.length;
  let sq = 0;
  for (const v of data) sq += (v - mean) ** 2;
  return { ink: ink / data.length, sd: Math.sqrt(sq / data.length) };
}
/** Normaliza a JPEG vertical de hasta 1200 px de alto, calidad 85, sin metadatos. */
async function normalize(src, dest) {
  const s = await sharp();
  await s(src).rotate().resize({ height: 1200, withoutEnlargement: true }).flatten({ background: '#ffffff' }).jpeg({ quality: 85, mozjpeg: true }).toFile(dest);
  const m = await s(dest).metadata();
  return { width: m.width, height: m.height, size: (await stat(dest)).size };
}
async function contactSheet(files, dest, cols = 8) {
  const s = await sharp();
  const W = 150, H = 225, PAD = 8;
  const tiles = [];
  for (let i = 0; i < files.length; i++) {
    const buf = await s(files[i]).resize(W, H, { fit: 'contain', background: '#ffffff' }).png().toBuffer();
    tiles.push({ input: buf, left: PAD + (i % cols) * (W + PAD), top: PAD + Math.floor(i / cols) * (H + PAD) });
  }
  const rows = Math.ceil(files.length / cols);
  await s({ create: { width: PAD + cols * (W + PAD), height: PAD + rows * (H + PAD), channels: 3, background: '#d9d9d9' } })
    .composite(tiles).png().toFile(dest);
}

// ───────────────────────── fase 1: EPUB ─────────────────────────
async function extraer() {
  await mkdir(OUT, { recursive: true });
  await mkdir(REV, { recursive: true });
  const st = await loadState();
  const sheet = [];
  let scans = 0, templates = 0, none = 0;
  for (const it of await entries()) {
    if (provider(it.e) !== 'gutenberg') continue;
    const epub = path.join(CAT, it.e.file);
    const list = execFileSync('unzip', ['-Z1', epub], { encoding: 'utf8' }).split('\n');
    const inner = list.find((n) => /(cover|portada)[^/]*\.(jpe?g|png)$/i.test(n));
    const rec = (st.items[it.base] ||= {});
    if (!inner) { rec.epub = 'sin-imagen'; none++; continue; }
    const tmp = path.join(RAW, `epub-${it.base}${path.extname(inner).toLowerCase()}`);
    await mkdir(RAW, { recursive: true });
    await writeFile(tmp, execFileSync('unzip', ['-p', epub, inner], { maxBuffer: 64 * 1024 * 1024 }));
    if (await isPgTemplate(tmp)) {
      rec.epub = 'plantilla-pg'; templates++;
      if (rec.source === 'epub') { delete rec.cover; delete rec.source; delete rec.credit; }
      await rm(path.join(OUT, `${it.base}.jpg`), { force: true });
      continue;
    }
    const dest = path.join(OUT, `${it.base}.jpg`);
    const info = await normalize(tmp, dest);
    Object.assign(rec, { epub: 'escaneo', cover: path.relative(CAT, dest), source: 'epub', inner, ...info,
      credit: `Escaneo de la edición original incluido en el EPUB de Project Gutenberg (${it.e.license?.licenseUrl || ''})` });
    sheet.push(dest);
    scans++;
  }
  await saveState(st);
  for (let i = 0; i < sheet.length; i += 48) await contactSheet(sheet.slice(i, i + 48), path.join(REV, `epub-${String(i / 48 + 1).padStart(2, '0')}.png`));
  console.log(`EPUB: ${scans} escaneos · ${templates} plantillas PG descartadas · ${none} sin imagen. Hojas en ${path.relative(CAT, REV)}/epub-*.png`);
}

// ───────────────────────── fase 2: descargas (LibriVox + Commons) ─────────────────────────
async function librivoxCover(projectId) {
  const api = JSON.parse(await fetchText(`https://librivox.org/api/feed/audiobooks/?id=${projectId}&format=json&extended=1`));
  const book = api.books?.[0];
  if (!book?.url_iarchive) throw new Error('sin url_iarchive');
  const item = book.url_iarchive.replace(/\/$/, '').split('/').pop();
  const meta = JSON.parse(await fetchText(`https://archive.org/metadata/${item}/files`));
  // El arte del proyecto es un JPG (los PNG del ítem son formas de onda y espectrogramas de cada pista).
  const files = (meta.result || []).filter((f) => /\.jpe?g$/i.test(f.name) && !/__ia_thumb|_thumb\.|spectrogram|waveform/i.test(f.name));
  files.sort((a, b) => Number(b.size || 0) - Number(a.size || 0));
  if (!files.length) throw new Error(`sin arte en ${item}`);
  return { item, name: files[0].name, url: `https://archive.org/download/${item}/${encodeURIComponent(files[0].name)}` };
}

/** Localiza el escaneo (Commons) del que se transcribió una página de Wikisource en español. */
async function wikisourceIndex(title) {
  const q = new URLSearchParams({ action: 'parse', page: title, prop: 'wikitext|links', format: 'json', formatversion: '2' });
  const data = JSON.parse(await fetchText(`https://es.wikisource.org/w/api.php?${q}`));
  if (data.error) throw new Error(data.error.info || 'parse error');
  const wt = data.parse?.wikitext || '';
  let idx = wt.match(/<pages\s+index\s*=\s*"([^"]+)"/i)?.[1] || wt.match(/\[\[\s*Índice:([^\]|#]+)/i)?.[1] || null;
  if (!idx) idx = (data.parse?.links || []).map((l) => l.title).find((t) => /^Índice:/.test(t))?.replace(/^Índice:/, '') || null;
  if (!idx) {
    // Los libros suelen ser portadas con subpáginas: probar la primera subpágina transcrita.
    const sub = (data.parse?.links || []).map((l) => l.title).find((t) => t.startsWith(title + '/'));
    if (sub) return wikisourceIndex(sub);
    return null;
  }
  return idx.trim();
}
/** URL de la miniatura de una página concreta de un DjVu/PDF de Commons (Special:Redirect ignora `page`). */
async function commonsPage(file, page, width = 900) {
  const q = new URLSearchParams({ action: 'query', titles: `File:${file}`, prop: 'imageinfo', iiprop: 'url', iiurlwidth: String(width), iiurlparam: `page${page}-${width}px`, format: 'json', formatversion: '2' });
  const data = JSON.parse(await fetchText(`https://commons.wikimedia.org/w/api.php?${q}`));
  const info = data.query?.pages?.[0]?.imageinfo?.[0];
  if (!info?.thumburl) throw new Error(`sin miniatura para ${file} p${page}`);
  if (info.thumberror) throw new Error(`página ${page} inexistente`);
  return info.thumburl;
}

async function descargar() {
  await mkdir(RAW, { recursive: true });
  const st = await loadState();
  let lv = 0, ws = 0, fail = 0;
  const projects = new Map();
  for (const it of await entries()) {
    const rec = (st.items[it.base] ||= {});
    const p = provider(it.e);
    if (p === 'librivox') {
      const id = it.base.split('-')[1];
      if (!projects.has(id)) projects.set(id, []);
      projects.get(id).push(it.base);
    } else if (p === 'wikisource' || (p === 'gutenberg' && rec.epub !== 'escaneo')) {
      // Se reintentan solo los errores de red/limitación; los «sin índice» y «no encontrado» son definitivos.
      if (rec.raw && !String(rec.raw).startsWith('error')) continue;
      try {
        let title = it.e.source?.id || decodeURIComponent((it.e.license?.licenseUrl || '').split('/wiki/')[1] || '');
        if (p === 'gutenberg') {
          const s = new URLSearchParams({ action: 'query', list: 'search', srsearch: `intitle:"${it.e.title.replace(/[:"]/g, ' ')}" ${it.e.creator.split(' ').pop()}`, srlimit: '1', format: 'json' });
          title = JSON.parse(await fetchText(`https://es.wikisource.org/w/api.php?${s}`)).query?.search?.[0]?.title || '';
          if (!title) { rec.raw = 'no-encontrado'; fail++; continue; }
        }
        const idx = await wikisourceIndex(title);
        if (!idx) { rec.raw = 'sin-indice'; fail++; continue; }
        const pages = [];
        for (const n of [1, 2, 3, 4, 5]) {
          const dest = path.join(RAW, `ws-${it.base}-p${n}.jpg`);
          try { await fetchFile(await commonsPage(idx, n), dest); pages.push(path.relative(CAT, dest)); } catch { /* página inexistente */ }
          await sleep(400);
        }
        if (!pages.length) { rec.raw = 'sin-paginas'; fail++; continue; }
        Object.assign(rec, { raw: 'commons', index: idx, pages, wsTitle: title, credit: `Escaneo «${idx}» (Wikimedia Commons, dominio público), fuente de la transcripción de Wikisource` });
        ws++;
      } catch (err) { rec.raw = `error: ${err.message}`.slice(0, 200); fail++; }
      await sleep(1500); // cortesía con la API de Wikisource (evita el 429)
    }
  }
  for (const [id, bases] of projects) {
    const first = st.items[bases[0]];
    if (first?.raw === 'librivox') continue;
    try {
      const art = await librivoxCover(id);
      const dest = path.join(RAW, `librivox-${id}.jpg`);
      await fetchFile(art.url, dest);
      for (const b of bases) Object.assign(st.items[b] ||= {}, { raw: 'librivox', rawFile: path.relative(CAT, dest), item: art.item, artName: art.name,
        credit: `Arte del proyecto LibriVox (archive.org/details/${art.item}, dominio público)` });
      lv++;
    } catch (err) { for (const b of bases) (st.items[b] ||= {}).raw = `error: ${err.message}`.slice(0, 200); fail++; }
    await sleep(800);
  }
  await saveState(st);
  console.log(`Descargas: ${lv} proyectos LibriVox · ${ws} escaneos de Commons · ${fail} sin resultado (ver estado.json)`);
}

// ───────────────────────── fase 3: preparar (normalizar y hojas de revisión) ─────────────────────────
async function preparar() {
  await mkdir(REV, { recursive: true });
  const st = await loadState();
  const lvSheet = [], wsSheet = [];
  let lv = 0, ws = 0;
  for (const it of await entries()) {
    const rec = st.items[it.base];
    if (!rec || rec.cover) continue;
    if (rec.raw === 'librivox') {
      const dest = path.join(OUT, `${it.base}.jpg`);
      const info = await normalize(path.join(CAT, rec.rawFile), dest);
      Object.assign(rec, { cover: path.relative(CAT, dest), source: 'librivox', ...info });
      lvSheet.push(dest); lv++;
    } else if (rec.raw === 'commons') {
      // La página 1 es la cubierta: se usa si tiene dibujo/título (contraste alto); si es una tapa lisa o una guarda
      // en blanco, se pasa a la primera página con tinta suficiente (la portadilla), evitando las casi negras.
      let best = null;
      const first = rec.pages[0] ? await pageStats(path.join(CAT, rec.pages[0])) : null;
      if (first && first.sd >= 55 && first.ink >= 0.015) best = rec.pages[0];
      for (const rel of rec.pages) {
        if (best) break;
        const r = await pageStats(path.join(CAT, rel));
        if (r.ink >= 0.015 && r.ink <= 0.6) best = rel;
      }
      if (!best) { rec.raw = 'paginas-vacias'; continue; }
      const dest = path.join(OUT, `${it.base}.jpg`);
      const info = await normalize(path.join(CAT, best), dest);
      Object.assign(rec, { cover: path.relative(CAT, dest), source: 'commons', page: best, ...info });
      wsSheet.push(dest); ws++;
    }
  }
  await saveState(st);
  for (let i = 0; i < lvSheet.length; i += 48) await contactSheet(lvSheet.slice(i, i + 48), path.join(REV, `librivox-${String(i / 48 + 1).padStart(2, '0')}.png`));
  for (let i = 0; i < wsSheet.length; i += 48) await contactSheet(wsSheet.slice(i, i + 48), path.join(REV, `commons-${String(i / 48 + 1).padStart(2, '0')}.png`));
  console.log(`Preparadas: ${lv} LibriVox · ${ws} Commons. Hojas en ${path.relative(CAT, REV)}/`);
}

// ───────────────────────── fase 4: aplicar por la API ─────────────────────────
async function aplicar() {
  const API = String(args.api || 'http://localhost:3100').replace(/\/$/, '');
  const EMAIL = args.email || process.env.IMPORT_EMAIL || 'admin@macondo.local';
  const PASSWORD = args.password || process.env.IMPORT_PASSWORD || 'MacondoDev2026!';
  const DRY = !!args['dry-run'];
  const st = await loadState();
  let token = null;
  async function api(method, p, body, isForm = false) {
    for (let i = 1; i <= 4; i++) {
      const res = await fetch(API + p, { method, headers: { ...(token ? { authorization: `Bearer ${token}` } : {}), ...(body && !isForm ? { 'content-type': 'application/json' } : {}) }, body: body ? (isForm ? body : JSON.stringify(body)) : undefined });
      if (res.status === 429 || res.status >= 502) { await sleep(1500 * i); continue; }
      const text = await res.text();
      const data = text ? (() => { try { return JSON.parse(text); } catch { return text; } })() : null;
      if (!res.ok) throw Object.assign(new Error(`${method} ${p} → ${res.status} ${typeof data === 'string' ? data : JSON.stringify(data)}`), { status: res.status });
      return data;
    }
    throw new Error(`${method} ${p}: reintentos agotados`);
  }
  token = (await api('POST', '/api/auth/login', { email: EMAIL, password: PASSWORD })).accessToken;
  let ok = 0, missing = 0, skipped = 0, excluded = 0;
  const notFound = [];
  for (const it of await entries()) {
    const rec = st.items[it.base];
    if (!rec?.cover) { skipped++; continue; }
    if (rec.excluded) { excluded++; continue; }
    const q = new URLSearchParams({ q: it.e.title.slice(0, 100), type: it.e.type, pageSize: '100' });
    const page = await api('GET', `/api/admin/resources?${q}`);
    const r = (page.items || []).find((x) => x.title === it.e.title && x.creator === it.e.creator && x.type === it.e.type);
    if (!r) { missing++; notFound.push(`${it.e.type} · ${it.e.title} — ${it.e.creator}`); continue; }
    const abs = path.join(CAT, rec.cover);
    const sha = createHash('sha256').update(await readFile(abs)).digest('hex');
    const applied = (rec.applied ||= {});
    if (applied[API] === sha) { ok++; continue; }
    if (!DRY) {
      const fd = new FormData();
      fd.append('file', await openAsBlob(abs, { type: 'image/jpeg' }), `${it.base}.jpg`);
      await api('POST', `/api/admin/resources/${r.id}/cover`, fd, true);
      applied[API] = sha;
    }
    ok++;
    if (ok % 25 === 0) { await saveState(st); console.log(`  … ${ok} portadas`); }
  }
  await saveState(st);
  console.log(`Aplicadas en ${API}${DRY ? ' (simulación)' : ''}: ${ok} · sin portada nueva: ${skipped} · excluidas: ${excluded} · recurso no encontrado: ${missing}`);
  if (notFound.length) console.log('No encontrados:\n  ' + notFound.join('\n  '));
}

// ───────────────────────── fase 5: manifiestos ─────────────────────────
async function manifiestos() {
  const st = await loadState();
  const OLD = path.join(CAT, 'portadas-tipograficas');
  await mkdir(OLD, { recursive: true });
  let changed = 0;
  for (const m of MANIFESTS) {
    const file = path.join(CAT, m);
    const arr = JSON.parse(await readFile(file, 'utf8'));
    for (const e of arr) {
      const rec = st.items[baseOf(e)];
      if (!rec?.cover || rec.excluded || e.cover === rec.cover) continue;
      if (e.cover && existsSync(path.join(CAT, e.cover))) await rename(path.join(CAT, e.cover), path.join(OLD, path.basename(e.cover)));
      e.cover = rec.cover;
      e.coverCredit = rec.credit;
      changed++;
    }
    await writeFile(file, JSON.stringify(arr, null, 2) + '\n');
  }
  console.log(`Manifiestos actualizados: ${changed} portadas. Las tipográficas sustituidas quedaron en portadas-tipograficas/`);
}

// ───────────────────────── resumen ─────────────────────────
async function resumen() {
  const st = await loadState();
  const c = {};
  for (const v of Object.values(st.items)) {
    const k = v.excluded ? 'excluida' : v.cover ? `cover:${v.source}` : `sin:${v.epub || ''}/${v.raw || ''}`;
    c[k] = (c[k] || 0) + 1;
  }
  console.log(c);
}

if (args.extraer) await extraer();
else if (args.descargar) await descargar();
else if (args.preparar) await preparar();
else if (args.aplicar) await aplicar();
else if (args.manifiestos) await manifiestos();
else if (args.resumen) await resumen();
else { console.log('Uso: --extraer | --descargar | --preparar | --aplicar --api URL [--dry-run] | --manifiestos | --resumen'); process.exit(1); }
