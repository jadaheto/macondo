// Uso: node _tools/validate.js <manifest.json>  — valida cada entrada con ResourceInputSchema
const { ResourceInputSchema } = require('/Users/javierhermosilla/Downloads/bibliotecamacondo/packages/shared/dist/index.js');
const m = require(require('path').resolve(process.argv[2]));
let ok = 0; const bad = [];
for (const e of m) { const r = ResourceInputSchema.safeParse(e); if (r.success) ok++; else bad.push([e.source.id, r.error.issues]); }
console.log(JSON.stringify({ total: m.length, ok, bad }, null, 1));
