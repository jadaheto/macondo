// Valida cada entrada de audiolibros.manifest.json con ResourceInputSchema y verifica que el archivo exista.
const path = require('path'); const fs = require('fs');
const { ResourceInputSchema } = require('/Users/javierhermosilla/Downloads/bibliotecamacondo/packages/shared/dist/index.js');
const root = path.resolve(__dirname, '..');
const m = JSON.parse(fs.readFileSync(path.join(root, 'audiolibros.manifest.json'), 'utf8'));
let ok = 0; const bad = [];
for (const e of m) {
  const r = ResourceInputSchema.safeParse(e);
  const st = fs.existsSync(path.join(root, e.file)) ? fs.statSync(path.join(root, e.file)) : null;
  const problems = [];
  if (!r.success) problems.push(JSON.stringify(r.error.issues));
  if (!st || st.size !== e.sizeBytes) problems.push('archivo ausente o tamaño distinto');
  if (e.type !== 'AUDIOBOOK' || e.status !== 'DRAFT') problems.push('type/status');
  if (problems.length) bad.push([e.file, problems]); else ok++;
}
const files = new Set(m.map(e => e.file));
console.log(`válidas: ${ok}/${m.length}; archivos únicos: ${files.size}`);
if (bad.length) console.log(JSON.stringify(bad, null, 1));
