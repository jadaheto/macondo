// Valida galerias.manifest.json contra ResourceInputSchema y cada gallery.json contra FORMATO.md.
// (Lote naturaleza; basado en gal-validate.js) Uso: node catalogo-dp/_tools/galN-validate.js [ruta-manifiesto]
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
const { ResourceInputSchema } = require(path.resolve(ROOT, '..', 'packages/shared/dist/index.js'));
const manifest = JSON.parse(fs.readFileSync(path.resolve(process.argv[2] || path.join(ROOT, 'galerias-naturaleza.manifest.json')), 'utf8'));
let errors = 0, images = 0, bytes = 0;
const err = (m) => { errors++; console.log('ERROR', m); };
function dims(buf) {
  if (buf[0] === 0x89 && buf.toString('ascii', 1, 4) === 'PNG') return [buf.readUInt32BE(16), buf.readUInt32BE(20), 'png'];
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    let i = 2;
    while (i < buf.length) {
      if (buf[i] !== 0xff) { i++; continue; }
      const m = buf[i + 1];
      if (m >= 0xc0 && m <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(m)) return [buf.readUInt16BE(i + 7), buf.readUInt16BE(i + 5), 'jpg'];
      i += 2 + buf.readUInt16BE(i + 2);
    }
  }
  if (buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return [0, 0, 'webp'];
  return null;
}
const slugs = new Set();
// Imágenes ya usadas en otros manifiestos de galerías (para detectar duplicados entre lotes)
const usedElsewhere = new Map();
for (const f of fs.readdirSync(ROOT).filter((f) => /^galerias.*\.manifest\.json$/.test(f))) {
  const mp = path.join(ROOT, f);
  if (path.resolve(mp) === path.resolve(process.argv[2] || path.join(ROOT, 'galerias-naturaleza.manifest.json'))) continue;
  for (const e of JSON.parse(fs.readFileSync(mp, 'utf8'))) {
    const gp = path.join(ROOT, e.file, 'gallery.json');
    if (!fs.existsSync(gp)) continue;
    for (const it of JSON.parse(fs.readFileSync(gp, 'utf8')).items) usedElsewhere.set(it.sourceUrl, e.file);
  }
}
const seenHere = new Map();
for (const e of manifest) {
  const r = ResourceInputSchema.safeParse(e);
  if (!r.success) err(`${e.file}: schema ${JSON.stringify(r.error.issues)}`);
  if (e.type !== 'GALLERY' || !['DRAFT', 'PUBLISHED'].includes(e.status) || e.sha256 !== null) err(`${e.file}: type/status/sha256`);
  const dir = path.join(ROOT, e.file);
  const g = JSON.parse(fs.readFileSync(path.join(dir, 'gallery.json'), 'utf8'));
  if (slugs.has(g.slug)) err('slug duplicado ' + g.slug); slugs.add(g.slug);
  if ('galerias/' + g.slug !== e.file) err(`${e.file}: slug no coincide`);
  if (!fs.existsSync(path.join(ROOT, e.cover))) err(`${e.file}: cover no existe`);
  if (g.items.length < 6 || g.items.length > 15) err(`${e.file}: ${g.items.length} imágenes`);
  const onDisk = fs.readdirSync(dir).filter((f) => f !== 'gallery.json' && !f.startsWith('.'));
  if (onDisk.length !== g.items.length) err(`${e.file}: archivos en disco ${onDisk.length} vs items ${g.items.length}`);
  let total = 0;
  for (const f of fs.readdirSync(dir)) total += fs.statSync(path.join(dir, f)).size;
  if (total !== e.sizeBytes) err(`${e.file}: sizeBytes ${e.sizeBytes} != ${total}`);
  bytes += total;
  for (const it of g.items) {
    images++;
    for (const k of ['file', 'alt', 'caption', 'credit', 'license', 'licenseUrl', 'sourceUrl'])
      if (!it[k] || typeof it[k] !== 'string') err(`${e.file}/${it.file}: falta ${k}`);
    if (!/^(Dominio público|CC0|CC BY(-SA)? \d\.\d.*)$/.test(it.license)) err(`${e.file}/${it.file}: licencia ${it.license}`);
    if (!it.sourceUrl.startsWith('https://commons.wikimedia.org/wiki/File:')) err(`${e.file}/${it.file}: sourceUrl`);
    if (usedElsewhere.has(it.sourceUrl)) err(`${e.file}/${it.file}: imagen ya usada en ${usedElsewhere.get(it.sourceUrl)}`);
    if (seenHere.has(it.sourceUrl)) err(`${e.file}/${it.file}: imagen repetida (también en ${seenHere.get(it.sourceUrl)})`);
    seenHere.set(it.sourceUrl, e.file);
    const fp = path.join(dir, it.file);
    if (!fs.existsSync(fp)) { err(`${fp} no existe`); continue; }
    const buf = fs.readFileSync(fp); const d = dims(buf);
    if (!d) err(`${fp}: bytes mágicos no válidos`);
    else if (Math.max(d[0], d[1]) > 1600) err(`${fp}: ${d[0]}x${d[1]} > 1600`);
    if (buf.length > 1.5e6) err(`${fp}: ${buf.length} bytes > 1,5 MB`);
    const sentences = it.caption.split(/(?<!\b[A-Z]\.)(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚÑ¿¡"])/).filter(Boolean).length;
    if (sentences > 3) err(`${fp}: caption con ${sentences} frases`);
  }
  const qs = (g.activity || {}).questions || [];
  if (g.activity.kind !== 'trivia' || qs.length < 3 || qs.length > 5) err(`${e.file}: actividad`);
  for (const q of qs) if (!(q.answer >= 0 && q.answer < q.options.length) || !q.prompt || !q.explanation) err(`${e.file}: pregunta inválida ${q.prompt}`);
}
console.log(`galerías: ${manifest.length}, imágenes: ${images}, bytes: ${bytes} (${(bytes / 1048576).toFixed(1)} MB), errores: ${errors}`);
process.exit(errors ? 1 : 0);
