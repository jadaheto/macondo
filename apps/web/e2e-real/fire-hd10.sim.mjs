#!/usr/bin/env node
/**
 * SIMULACIÓN Fire HD 10 (NO es validación física).
 *
 * Chromium de Playwright con perfil Fire HD 10: 1280×800 CSS a DPR 1,5 (pantalla 1920×1200),
 * móvil + táctil, user agent de Silk, CPU ×4 (CDP Emulation.setCPUThrottlingRate) y red
 * «Wi-Fi» / «3G lento» (CDP Network.emulateNetworkConditions) u offline (context.setOffline).
 * Recorre las 7 pruebas obligatorias del §7 en lo que un navegador de escritorio puede simular.
 *
 * Uso (stack arriba):
 *   node apps/web/e2e-real/fire-hd10.sim.mjs
 *   E2E_BASE_URL=http://localhost:3100 SIM_LAN_URL=http://192.168.31.240:3100 SIM_OUT=/ruta node ...
 *
 * Solo lectura respecto al servidor (las descargas offline se guardan en el perfil del navegador
 * simulado). Escribe resultados JSON y capturas en SIM_OUT (por defecto docs/evidencia/fire-hd10-sim).
 */
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..', '..', '..');
const BASE = (process.env.E2E_BASE_URL ?? 'http://localhost:3100').replace(/\/$/, '');
const LAN = process.env.SIM_LAN_URL ?? 'http://192.168.31.240:3100';
const OUT = process.env.SIM_OUT ?? path.join(REPO, 'docs', 'evidencia', 'fire-hd10-sim');
const PROFILE_DIR = process.env.SIM_PROFILE_DIR ?? fs.mkdtempSync(path.join(os.tmpdir(), 'macondo-firehd10-'));
fs.mkdirSync(OUT, { recursive: true });

const UA = 'Mozilla/5.0 (Linux; Android 11; KFTRWI) AppleWebKit/537.36 (KHTML, like Gecko) Silk/120.4.1 like Chrome/120.0.0.0 Safari/537.36';
const DEVICE = { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1.5, isMobile: true, hasTouch: true, userAgent: UA, locale: 'es-CO' };
const LAUNCH_ARGS = ['--disable-audio-output']; // sin tarjeta de audio el reloj de <audio> no avanza
const CPU_RATE = 4;
// Perfiles de red (bytes/s). Wi-Fi de biblioteca ≈ 20 Mb/s, 20 ms. 3G lento ≈ preset de DevTools (400 kb/s, 2 s RTT).
const NET = {
  wifi: { offline: false, latency: 20, downloadThroughput: (20 * 1024 * 1024) / 8, uploadThroughput: (10 * 1024 * 1024) / 8 },
  slow3g: { offline: false, latency: 2000, downloadThroughput: (400 * 1024) / 8, uploadThroughput: (400 * 1024) / 8 },
};

const results = { kind: 'SIMULACIÓN — no es validación física', date: new Date().toISOString(), base: BASE, profile: { ...DEVICE, cpuThrottling: CPU_RATE, net: NET }, checks: {}, timings: [] };
const log = (...a) => console.log('[sim]', ...a);
const shot = async (page, name) => { const f = path.join(OUT, `${name}.jpg`); await page.screenshot({ path: f, type: 'jpeg', quality: 70 }); return path.relative(REPO, f); };

async function throttle(page, net) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU_RATE });
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', NET[net]);
  return cdp;
}

async function apiJson(p) { const r = await fetch(BASE + p); if (!r.ok) throw new Error(`${p} → ${r.status}`); return r.json(); }
async function pick(type, format) {
  for (let page = 1; page <= 10; page++) {
    const j = await apiJson(`/api/resources?type=${type}&pageSize=100&page=${page}`);
    const hit = j.items.find((r) => r.accessible && r.hasFile && r.license?.offlineAllowed && (!format || r.format === format));
    if (hit) return hit;
    if (page * 100 >= j.total) break;
  }
  throw new Error(`sin ${type} ${format ?? ''}`);
}

const epub = await pick('BOOK', 'EPUB');
const pdf = await pick('BOOK', 'PDF');
const mp3 = await pick('AUDIOBOOK', 'MP3');
const gallery = await pick('GALLERY');
results.resources = Object.fromEntries(Object.entries({ epub, pdf, mp3, gallery }).map(([k, r]) => [k, { id: r.id, title: r.title, bytes: r.fileSizeBytes }]));
log('recursos', JSON.stringify(results.resources));

async function waitEpub(page) {
  const frame = page.frameLocator('iframe').first();
  await frame.locator('body').waitFor({ timeout: 90_000 });
  const t = Date.now();
  while (Date.now() - t < 90_000) {
    const txt = await frame.locator('body').innerText().catch(() => '');
    if (txt.trim().length > 5) return true;
    await page.waitForTimeout(100);
  }
  return false;
}
async function waitPdf(page) {
  const c = page.locator('canvas[role=img]');
  await c.waitFor({ state: 'visible', timeout: 90_000 });
  return (await c.evaluate((el) => el.width)) > 100;
}

// ───────────── Tiempos de carga (contexto limpio, sin caché) ─────────────
async function timeLoad(browser, net, label, url, ready) {
  const ctx = await browser.newContext({ ...DEVICE, serviceWorkers: 'block' });
  const page = await ctx.newPage();
  await throttle(page, net);
  const t0 = Date.now();
  let ok = true;
  try {
    await page.goto(BASE + url, { waitUntil: 'domcontentloaded', timeout: 120_000 });
    const dcl = Date.now() - t0;
    ok = await ready(page);
    const readyMs = Date.now() - t0;
    const bytes = await page.evaluate(() => performance.getEntriesByType('resource').reduce((a, e) => a + (e.transferSize || 0), 0) + (performance.getEntriesByType('navigation')[0]?.transferSize || 0));
    results.timings.push({ net, label, url, domContentLoadedMs: dcl, readyMs, ok, transferKB: Math.round(bytes / 1024) });
    log(`tiempo ${net} ${label}: DCL ${dcl} ms, listo ${readyMs} ms, ${Math.round(bytes / 1024)} KB`);
  } catch (e) {
    results.timings.push({ net, label, url, error: String(e.message).split('\n')[0] });
    log(`tiempo ${net} ${label}: ERROR ${e.message.split('\n')[0]}`);
  }
  await ctx.close();
}

const browser = await chromium.launch({ args: LAUNCH_ARGS });
for (const net of ['wifi', 'slow3g']) {
  await timeLoad(browser, net, 'inicio /', '/', async (p) => { await p.getByRole('heading', { level: 1 }).first().waitFor({ timeout: 120_000 }); return true; });
  await timeLoad(browser, net, 'catálogo /catalogo', '/catalogo', async (p) => {
    await p.getByText(/recursos · página 1 de/).waitFor({ timeout: 120_000 });
    // portadas visibles cargadas
    await p.waitForFunction(() => [...document.querySelectorAll('main img')].filter((i) => i.getBoundingClientRect().top < innerHeight).every((i) => i.complete), null, { timeout: 120_000 });
    return true;
  });
  await timeLoad(browser, net, 'leer EPUB', `/leer/${epub.id}`, waitEpub);
  await timeLoad(browser, net, 'leer PDF', `/leer/${pdf.id}`, waitPdf);
  await timeLoad(browser, net, 'leer MP3 (metadatos)', `/leer/${mp3.id}`, async (p) => { await p.waitForFunction(() => (document.querySelector('audio')?.readyState ?? 0) >= 1, null, { timeout: 120_000 }); return true; });
}

// ───────────── Check 1: PWA (manifest, SW, instalabilidad) ─────────────
{
  const ctx = await browser.newContext({ ...DEVICE });
  const page = await ctx.newPage();
  await throttle(page, 'wifi');
  await page.goto(BASE + '/', { waitUntil: 'load' });
  const href = await page.locator('link[rel=manifest]').getAttribute('href');
  const manifest = await (await fetch(new URL(href, BASE))).json();
  const icons = manifest.icons?.map((i) => i.sizes) ?? [];
  const sw = await page.evaluate(async () => {
    if (!('serviceWorker' in navigator)) return { supported: false };
    const reg = await Promise.race([navigator.serviceWorker.ready, new Promise((r) => setTimeout(() => r(null), 20000))]);
    return { supported: true, scope: reg?.scope ?? null, active: !!reg?.active };
  });
  const cdp = await ctx.newCDPSession(page);
  let installErrors = null;
  try { installErrors = (await cdp.send('Page.getInstallabilityErrors')).installabilityErrors.map((e) => e.errorId); } catch (e) { installErrors = [`no disponible: ${e.message}`]; }
  // contexto seguro desde la IP de la red local (como lo abriría una tablet)
  let lan = null;
  try {
    const p2 = await ctx.newPage();
    await p2.goto(LAN + '/', { waitUntil: 'domcontentloaded', timeout: 20000 });
    lan = await p2.evaluate(() => ({ url: location.origin, isSecureContext, serviceWorker: 'serviceWorker' in navigator, caches: 'caches' in window, subtle: !!crypto?.subtle }));
    lan.offlineButtonHidden = null;
    await p2.goto(`${LAN}/recurso/${epub.id}`, { waitUntil: 'networkidle', timeout: 20000 });
    lan.offlineButton = await p2.getByRole('button', { name: /Descargar para uso sin conexión/ }).count();
    lan.unsupportedMessage = await p2.getByText('Este navegador no permite guardar recursos').count();
    lan.screenshot = await shot(p2, '1-lan-sin-contexto-seguro');
    await p2.close();
  } catch (e) { lan = { error: e.message.split('\n')[0] }; }
  const pass = manifest.display === 'standalone' && icons.includes('512x512') && sw.active && (installErrors?.length ?? 1) === 0;
  results.checks['1'] = { name: 'Abrir sin Google Play (web/PWA)', result: pass ? 'PASA (simulado, en localhost)' : 'FALLA', manifest: { name: manifest.short_name, display: manifest.display, start_url: manifest.start_url, icons }, serviceWorker: sw, installabilityErrors: installErrors, lan, screenshot: await shot(page, '1-inicio') };
  log('check1', JSON.stringify(results.checks['1']));
  await ctx.close();
}
await browser.close();

// ───────────── Checks 2–6 con perfil persistente (simula la misma tablet) ─────────────
const launchPersistent = (extra = {}) => chromium.launchPersistentContext(PROFILE_DIR, { ...DEVICE, args: LAUNCH_ARGS, ...extra });
let ctx = await launchPersistent();
let page = ctx.pages()[0] ?? (await ctx.newPage());
await throttle(page, 'wifi');
await page.goto(BASE + '/', { waitUntil: 'load' });
await page.evaluate(async () => { await Promise.race([navigator.serviceWorker?.ready, new Promise((r) => setTimeout(r, 15000))]); });
await page.reload({ waitUntil: 'load' }); // que el SW controle la página

// Check 2: EPUB y PDF (con CPU ×4 y Wi-Fi)
{
  let t = Date.now(); await page.goto(`${BASE}/leer/${epub.id}`); const okE = await waitEpub(page); const epubMs = Date.now() - t;
  await page.getByRole('button', { name: 'Página siguiente' }).click(); await page.waitForTimeout(1200);
  const s1 = await shot(page, '2-epub');
  t = Date.now(); await page.goto(`${BASE}/leer/${pdf.id}`); const okP = await waitPdf(page); const pdfMs = Date.now() - t;
  await page.getByRole('button', { name: 'Página siguiente' }).click();
  const page2 = await page.locator('canvas[role=img]').getAttribute('aria-label');
  const s2 = await shot(page, '2-pdf');
  results.checks['2'] = { name: 'Abrir EPUB y PDF', result: okE && okP ? 'PASA (simulado)' : 'FALLA', epubRenderMs: epubMs, pdfRenderMs: pdfMs, pdfAfterNext: page2, screenshots: [s1, s2] };
  log('check2', JSON.stringify(results.checks['2']));
}

// Check 3: MP3 reproduce, salta y reanuda
{
  await page.goto(`${BASE}/leer/${mp3.id}`);
  await page.getByRole('button', { name: 'Reproducir' }).click();
  const a = page.locator('audio');
  await page.waitForFunction(() => (document.querySelector('audio')?.currentTime ?? 0) > 0.5, null, { timeout: 30000 });
  const dur = await a.evaluate((el) => el.duration);
  const target = Math.floor(dur * 0.5);
  await a.evaluate((el, t) => { el.currentTime = t; }, target);
  await page.waitForFunction((t) => (document.querySelector('audio')?.currentTime ?? 0) > t + 0.5, target, { timeout: 30000 });
  await page.getByRole('button', { name: 'Pausar' }).click();
  const paused = await a.evaluate((el) => el.currentTime);
  await page.reload();
  await page.waitForFunction(() => (document.querySelector('audio')?.readyState ?? 0) >= 1, null, { timeout: 30000 });
  await page.waitForTimeout(500);
  const resumed = await a.evaluate((el) => el.currentTime);
  const s = await shot(page, '3-mp3-reanudado');
  const ok = resumed >= paused - 3.5 && resumed > 1; // reanuda con 3 s de retroceso a propósito (REWIND_ON_RESUME_SECONDS)
  results.checks['3'] = { name: 'Reproducir MP3 (audífonos)', result: ok ? 'PASA parcial (simulado): reproduce, salta y reanuda; audífonos NO simulables' : 'FALLA', durationS: Math.round(dur), seekTo: target, pausedAt: Math.round(paused), resumedAt: Math.round(resumed), screenshot: s };
  log('check3', JSON.stringify(results.checks['3']));
}

// Check 4: descargar libro, audiolibro y galería; abrir sin red
async function download(page, r, url) {
  await page.goto(BASE + url, { waitUntil: 'networkidle' });
  const btn = page.getByRole('button', { name: /Descargar para uso sin conexión/ });
  const t = Date.now();
  await btn.click();
  await page.getByText('Disponible sin conexión', { exact: false }).first().waitFor({ timeout: 120000 });
  return Date.now() - t;
}
{
  const dl = {};
  dl.epub = await download(page, epub, `/recurso/${epub.id}`);
  dl.mp3 = await download(page, mp3, `/recurso/${mp3.id}`);
  dl.gallery = await download(page, gallery, `/recurso/${gallery.id}`);
  const s0 = await shot(page, '4-galeria-descargada');
  await ctx.setOffline(true);
  const offline = {};
  // a) abrir la página de cada recurso sin red
  await page.goto(`${BASE}/leer/${epub.id}`).catch(() => {}); offline.epub = await waitEpub(page).catch(() => false); const s1 = await shot(page, '4-offline-epub');
  await page.goto(`${BASE}/leer/${mp3.id}`).catch(() => {});
  offline.mp3 = await page.getByRole('button', { name: 'Reproducir' }).click({ timeout: 15000 }).then(() => page.waitForFunction(() => (document.querySelector('audio')?.currentTime ?? 0) > 0.3 + 0, null, { timeout: 20000 })).then(() => true).catch(() => false);
  const s2 = await shot(page, '4-offline-mp3');
  await page.goto(`${BASE}/galeria/${gallery.id}`).catch(() => {});
  offline.gallery = await page.waitForFunction(() => { const im = [...document.querySelectorAll('main ul img')]; return im.length > 0 && im.every((i) => i.complete && i.naturalWidth > 0); }, null, { timeout: 20000 }).then(() => true).catch(() => false);
  const s3 = await shot(page, '4-offline-galeria');
  // b) lista de /offline
  await page.goto(`${BASE}/offline`).catch(() => {});
  await page.getByRole('link', { name: /^Abrir / }).first().waitFor({ timeout: 15000 }).catch(() => {});
  offline.listed = await page.getByRole('link', { name: /^Abrir / }).count();
  // abrir la galería desde la lista (flujo real del estudiante)
  await page.getByRole('link', { name: `Abrir ${gallery.title}` }).click().catch(() => {});
  offline.galleryFromList = await page.waitForFunction(() => location.pathname.startsWith('/galeria/') && [...document.querySelectorAll('main ul img')].some((i) => i.complete && i.naturalWidth > 0), null, { timeout: 20000 }).then(() => true).catch(() => false);
  const s4 = await shot(page, '4-offline-lista');
  const ok = offline.epub && offline.mp3 && offline.gallery;
  results.checks['4'] = { name: 'Descargar y abrir sin Wi-Fi', result: ok ? 'PASA (simulado)' : 'FALLA (ver detalle)', downloadMs: dl, offline, screenshots: [s0, s1, s2, s3, s4] };
  log('check4', JSON.stringify(results.checks['4']));
}

// Check 6 (antes de cerrar): almacenamiento
{
  await ctx.setOffline(false);
  await page.goto(`${BASE}/offline`);
  const st = await page.evaluate(async () => {
    const est = await navigator.storage.estimate();
    const persisted = await navigator.storage.persisted?.();
    const persist = await navigator.storage.persist?.();
    const cacheNames = await caches.keys();
    let offlineEntries = 0; if (cacheNames.includes('macondo-offline-v1')) offlineEntries = (await (await caches.open('macondo-offline-v1')).keys()).length;
    return { usageMB: +(est.usage / 1048576).toFixed(2), quotaMB: Math.round(est.quota / 1048576), usageDetails: est.usageDetails ?? null, persistedBefore: persisted, persistGranted: persist, cacheNames, offlineEntries };
  });
  const expectedMB = (epub.fileSizeBytes + mp3.fileSizeBytes) / 1048576;
  results.checks['6'] = { name: 'Almacenamiento y batería', result: 'PARCIAL (simulado): almacenamiento medido; batería NO simulable', storage: st, downloadedFilesMB: +expectedMB.toFixed(2) };
  log('check6', JSON.stringify(results.checks['6']));
}

// guardar progreso de lectura del EPUB antes de «reiniciar»
const progressBefore = await page.evaluate(() => Object.fromEntries(Object.keys(localStorage).filter((k) => k.startsWith('macondo.')).map((k) => [k, localStorage.getItem(k)])));
await ctx.close();

// Check 5: «reinicio» — relanzar el mismo perfil, sin red desde el arranque
{
  ctx = await launchPersistent({ offline: true });
  page = ctx.pages()[0] ?? (await ctx.newPage());
  await throttle(page, 'wifi');
  await page.goto(`${BASE}/offline`).catch(() => {});
  await page.getByRole('link', { name: /^Abrir / }).first().waitFor({ timeout: 15000 }).catch(() => {});
  const listed = await page.getByRole('link', { name: /^Abrir / }).count();
  const s1 = await shot(page, '5-reinicio-offline-lista');
  await page.getByRole('link', { name: `Abrir ${gallery.title}` }).click().catch(() => {});
  const galleryOk = await page.waitForFunction(() => location.pathname.startsWith('/galeria/') && [...document.querySelectorAll('main ul img')].every((i) => i.complete && i.naturalWidth > 0), null, { timeout: 20000 }).then(() => true).catch(() => false);
  const s3 = await shot(page, '5-reinicio-galeria');
  const progressAfter = await page.evaluate(() => Object.fromEntries(Object.keys(localStorage).filter((k) => k.startsWith('macondo.')).map((k) => [k, localStorage.getItem(k)])));
  const keys = Object.keys(progressBefore).filter((k) => /reading|audio|offline/.test(k));
  const kept = keys.filter((k) => progressAfter[k] === progressBefore[k]);
  await page.goto(`${BASE}/leer/${epub.id}`).catch(() => {}); const epubOk = await waitEpub(page).catch(() => false);
  await page.goto(`${BASE}/leer/${mp3.id}`).catch(() => {});
  await page.waitForFunction(() => (document.querySelector('audio')?.readyState ?? 0) >= 1, null, { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(500);
  const audioPos = await page.locator('audio').evaluate((el) => el.currentTime).catch(() => -1);
  const s2 = await shot(page, '5-reinicio-mp3');
  const ok = listed >= 3 && kept.length === keys.length && epubOk && galleryOk && audioPos > 1;
  results.checks['5'] = { name: 'Reiniciar y confirmar persistencia', result: ok ? 'PASA (simulado: cierre y relanzamiento del navegador con el mismo perfil)' : 'FALLA (ver detalle)', listedAfterRestart: listed, progressKeys: keys, progressKept: kept.length, epubOpensOffline: epubOk, galleryOpensOffline: galleryOk, audioResumeAtS: Math.round(audioPos), screenshots: [s1, s3, s2] };
  log('check5', JSON.stringify(results.checks['5']));
  await ctx.close();
}

// Check 7: uso compartido — reinicio del kiosco limpia estado
{
  const b = await chromium.launch({ args: LAUNCH_ARGS });
  const c = await b.newContext({ ...DEVICE });
  const p = await c.newPage();
  await throttle(p, 'wifi');
  await p.goto(`${BASE}/kiosco?inactividad=5&aviso=3`);
  await p.evaluate(() => { localStorage.setItem('macondo.favorites', '["x"]'); sessionStorage.setItem('macondo.algo', '1'); });
  await p.getByLabel('Buscar en la biblioteca').fill('cuento');
  await p.getByRole('button', { name: 'Buscar' }).click();
  await p.getByRole('heading', { name: /Resultados para/ }).waitFor();
  const t = Date.now();
  await p.getByRole('alertdialog').waitFor({ timeout: 15000 });
  const warnAt = Date.now() - t;
  const s1 = await shot(p, '7-kiosco-aviso');
  await p.getByRole('heading', { name: 'Explora por categoría' }).waitFor({ timeout: 15000 });
  const state = await p.evaluate(() => ({ fav: localStorage.getItem('macondo.favorites'), session: sessionStorage.length, q: document.querySelector('input')?.value ?? '' }));
  const ok = state.fav === null && state.session === 0 && state.q === '';
  results.checks['7'] = { name: 'Uso compartido y restricciones de salida', result: ok ? 'PARCIAL (simulado): reinicio por inactividad limpia estado; bloqueo de salida NO simulable (lo hace Fire OS/MDM)' : 'FALLA', warningAfterMs: warnAt, stateAfterReset: state, screenshot: s1 };
  log('check7', JSON.stringify(results.checks['7']));
  await b.close();
}

fs.writeFileSync(path.join(OUT, 'resultados.json'), JSON.stringify(results, null, 2));
log('resultados en', path.relative(REPO, path.join(OUT, 'resultados.json')));
if (!process.env.SIM_PROFILE_DIR) fs.rmSync(PROFILE_DIR, { recursive: true, force: true });
