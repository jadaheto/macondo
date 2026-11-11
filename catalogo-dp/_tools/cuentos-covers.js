// Uso: node cuentos-covers.js <lista.json>  — lista de [html, png]; renderiza portadas 600x900 con Chromium (Playwright)
const { chromium } = require('/Users/javierhermosilla/Downloads/bibliotecamacondo/node_modules/@playwright/test');
(async () => {
  const jobs = require(require('path').resolve(process.argv[2]));
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 600, height: 900 }, deviceScaleFactor: 1 });
  for (const [html, png] of jobs) {
    await p.goto('file://' + html);
    await p.evaluate(() => document.fonts.ready);
    await p.screenshot({ path: png, clip: { x: 0, y: 0, width: 600, height: 900 } });
  }
  await b.close();
  console.log('portadas:', jobs.length);
})();
