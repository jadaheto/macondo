// Uso: node _tools/cuentos-validate.js  — valida cuentos.manifest.json con ResourceInputSchema (entrada tal cual y con extra {text, questions}),
// y comprueba sha256/tamaño/portada de cada archivo.
const path = require('path'), fs = require('fs'), crypto = require('crypto');
const { ResourceInputSchema } = require('/Users/javierhermosilla/Downloads/bibliotecamacondo/packages/shared/dist/index.js');
const base = path.resolve(__dirname, '..');
const m = JSON.parse(fs.readFileSync(path.join(base, 'cuentos.manifest.json'), 'utf8'));
let ok = 0; const bad = [];
for (const e of m) {
  const errs = [];
  const r1 = ResourceInputSchema.safeParse(e);
  const r2 = ResourceInputSchema.safeParse({ ...e, extra: { text: e.text, questions: e.questions } });
  if (!r1.success) errs.push(r1.error.issues);
  if (!r2.success) errs.push(r2.error.issues);
  const f = path.join(base, e.file), c = path.join(base, e.cover);
  if (!fs.existsSync(f)) errs.push('falta archivo'); else {
    const buf = fs.readFileSync(f);
    if (crypto.createHash('sha256').update(buf).digest('hex') !== e.sha256) errs.push('sha256');
    if (buf.length !== e.sizeBytes) errs.push('sizeBytes');
  }
  if (!fs.existsSync(c)) errs.push('falta portada');
  if (e.status !== 'DRAFT' || e.type !== 'BOOK') errs.push('status/type');
  if (errs.length) bad.push([e.source.id, errs]); else ok++;
}
console.log(JSON.stringify({ total: m.length, ok, bad }, null, 1));
process.exit(bad.length ? 1 : 0);
