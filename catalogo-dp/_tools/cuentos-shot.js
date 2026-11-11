// Uso: node cuentos-shot.js <in.html> <out.png> <ancho> <alto> [fullPage]
const { chromium } = require('/Users/javierhermosilla/Downloads/bibliotecamacondo/node_modules/@playwright/test');
(async () => {
  const [inp, out, w, h, full] = process.argv.slice(2);
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: +w, height: +h } });
  await p.goto('file://' + require('path').resolve(inp));
  await p.evaluate(() => document.fonts.ready);
  await p.screenshot({ path: out, fullPage: !!full });
  await b.close();
})();
