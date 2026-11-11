#!/usr/bin/env node
// Comprueba que una URL ofrece "contexto seguro" (service worker, Cache Storage, crypto.subtle) con
// el Chromium de Playwright. Para HTTPS con la CA local, fija la clave pública del servidor con
// --ignore-certificate-errors-spki-list (Chromium no lee CAs externas en macOS y, si solo se ignoran
// los errores, se niega a registrar el service worker). Uso:
//   node scripts/check-secure-context.mjs https://192.168.31.240:3443 [infra/certs/server.crt]
//   node scripts/check-secure-context.mjs http://192.168.31.240:3100      (control: debe dar false)
import { chromium } from 'playwright';
import { execSync } from 'node:child_process';

const base = process.argv[2] || 'https://192.168.31.240:3443';
const cert = process.argv[3] || (base.startsWith('https://') ? 'infra/certs/server.crt' : null);
const args = [];
if (cert) {
  const spki = execSync(`openssl x509 -in "${cert}" -pubkey -noout | openssl pkey -pubin -outform der | openssl dgst -sha256 -binary | base64`).toString().trim();
  args.push(`--ignore-certificate-errors-spki-list=${spki}`);
}
const browser = await chromium.launch({ args });
const page = await browser.newPage();
const r = await page.goto(base + '/', { waitUntil: 'networkidle' });
const info = await page.evaluate(async () => {
  const out = { isSecureContext: window.isSecureContext, hasServiceWorker: 'serviceWorker' in navigator, hasCaches: 'caches' in window, hasSubtle: !!crypto.subtle };
  if (out.hasServiceWorker) {
    try {
      const reg = await Promise.race([navigator.serviceWorker.ready, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout 15 s')), 15000))]);
      out.serviceWorker = { scope: reg.scope, state: reg.active?.state };
      out.cacheKeys = await caches.keys();
    } catch (e) { out.serviceWorkerError = String(e); }
  }
  return out;
});
console.log(JSON.stringify({ status: r.status(), url: page.url(), ...info }, null, 2));
await browser.close();
process.exit(info.isSecureContext && info.serviceWorker?.state === 'activated' ? 0 : 1);
