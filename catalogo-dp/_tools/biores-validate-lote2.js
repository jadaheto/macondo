// Valida cada entrada de los manifiestos de audiobiografías y audioresúmenes contra ResourceInputSchema (@macondo/shared).
// Uso: node catalogo-dp/_tools/biores-validate.js
const path = require('path');
const fs = require('fs');
const root = path.resolve(__dirname, '..', '..');
const { ResourceInputSchema } = require(path.join(root, 'packages/shared/dist/index.js'));
let total = 0, fails = 0;
for (const [name, type] of [['audiobiografias-lote2.manifest.json', 'AUDIOBIOGRAPHY']]) {
  const list = JSON.parse(fs.readFileSync(path.join(root, 'catalogo-dp', name), 'utf8'));
  for (const e of list) {
    total++;
    const r = ResourceInputSchema.safeParse(e);
    const extra = [];
    if (e.type !== type) extra.push('tipo inesperado ' + e.type);
    if (e.status !== 'PUBLISHED') extra.push('status != PUBLISHED');
    if (!fs.existsSync(path.join(root, 'catalogo-dp', e.file))) extra.push('falta archivo');
    if (!Array.isArray(e.questions) || e.questions.length < 3) extra.push('menos de 3 preguntas');
    for (const q of e.questions || []) if (!(q.answer >= 0 && q.answer < q.options.length)) extra.push('respuesta fuera de rango');
    if (type === 'AUDIOBIOGRAPHY' && (!e.timeline?.length || !e.funFacts?.length)) extra.push('sin timeline/funFacts');
    if (!r.success || extra.length) { fails++; console.log('FALLA', e.file, r.success ? '' : JSON.stringify(r.error.issues), extra.join('; ')); }
  }
  console.log(name, list.length, 'entradas');
}
console.log(`${total} entradas validadas, ${fails} fallas`);
process.exit(fails ? 1 : 0);
