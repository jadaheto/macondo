#!/usr/bin/env node
// Valida catalogo-dp/retos/retos.json contra el formato de FORMATO.md ("Retos lectores").
// Uso: node catalogo-dp/_tools/retos-validate.mjs [ruta/a/retos.json]   (por defecto catalogo-dp/retos/retos.json)
// Además verifica que ningún id choque con los de los demás retos*.json de catalogo-dp/retos/ (p. ej. retos-lote2.json).
// Sale con código 1 si hay errores; las advertencias no hacen fallar.
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const CAT = join(here, '..');
const REPO = join(CAT, '..');
const RETOS = process.argv[2] ?? join(CAT, 'retos', 'retos.json');

const BANDS = new Set(['1-3', '4-5', '6-8', '9-11']);
const KINDS = new Set(['trivia', 'sequence', 'match']);
const ONLY = { trivia: 'questions', sequence: 'steps', match: 'pairs' };
const MAX_TEXT_WORDS = 150;

const errors = [];
const warnings = [];
const err = (id, m) => errors.push(`[${id}] ${m}`);
const warn = (id, m) => warnings.push(`[${id}] ${m}`);
const isStr = (v) => typeof v === 'string' && v.trim().length > 0;

// Manifiestos de recursos (los que existan)
const manifestPaths = [
  join(REPO, 'demo-content', 'manifest.json'),
  join(CAT, 'libros.manifest.json'),
  join(CAT, 'libros-lote2.manifest.json'),
  join(CAT, 'cuentos.manifest.json'),
  join(CAT, 'audiolibros.manifest.json'),
  join(CAT, 'audioresumenes.manifest.json'),
  join(CAT, 'audiobiografias.manifest.json'),
];
const resources = new Set();
const loaded = [];
for (const p of manifestPaths) {
  if (!existsSync(p)) continue;
  const data = JSON.parse(readFileSync(p, 'utf8'));
  const list = Array.isArray(data) ? data : data.items ?? data.resources ?? [];
  for (const e of list) resources.add(`${e.title}\u0000${e.creator}`);
  loaded.push(`${p.slice(REPO.length + 1)} (${list.length})`);
}

let retos;
try {
  retos = JSON.parse(readFileSync(RETOS, 'utf8'));
} catch (e) {
  console.error(`No se pudo leer ${RETOS}: ${e.message}`);
  process.exit(1);
}
if (!Array.isArray(retos)) {
  console.error('retos.json debe ser un arreglo');
  process.exit(1);
}

// Ids de los demás archivos de retos (para detectar colisiones entre lotes)
const RETOS_DIR = join(CAT, 'retos');
const otherIds = new Map();
const others = [];
if (existsSync(RETOS_DIR)) {
  for (const f of readdirSync(RETOS_DIR).filter((f) => /^retos.*\.json$/.test(f))) {
    const p = join(RETOS_DIR, f);
    if (resolve(p) === resolve(RETOS)) continue;
    try {
      const arr = JSON.parse(readFileSync(p, 'utf8'));
      if (Array.isArray(arr)) for (const r of arr) if (r && r.id) otherIds.set(r.id, f);
      others.push(`${f} (${Array.isArray(arr) ? arr.length : 0})`);
    } catch (e) {
      warnings.push(`[${f}] no se pudo leer para comprobar colisiones: ${e.message}`);
    }
  }
}

const ids = new Set();
const count = {};
retos.forEach((r, i) => {
  const id = r && isStr(r.id) ? r.id : `#${i}`;
  if (!r || typeof r !== 'object') return err(id, 'no es un objeto');
  if (!isStr(r.id)) err(id, 'falta id');
  else if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(r.id)) err(id, 'id no es un slug (a-z, 0-9, guiones)');
  else if (ids.has(r.id)) err(id, 'id duplicado');
  else if (otherIds.has(r.id)) err(id, `id ya usado en ${otherIds.get(r.id)}`);
  ids.add(r.id);

  if (!KINDS.has(r.kind)) err(id, `kind inválido: ${r.kind}`);
  for (const f of ['title', 'source', 'text']) if (!isStr(r[f])) err(id, `falta ${f}`);
  if (isStr(r.text)) {
    const w = r.text.trim().split(/\s+/).length;
    if (w > MAX_TEXT_WORDS) warn(id, `text tiene ${w} palabras (máx. recomendado ${MAX_TEXT_WORDS})`);
  }

  if (!Array.isArray(r.bands) || r.bands.length === 0) err(id, 'bands vacío o ausente');
  else {
    for (const b of r.bands) if (!BANDS.has(b)) err(id, `banda inválida: ${b}`);
    if (new Set(r.bands).size !== r.bands.length) err(id, 'bandas repetidas');
  }

  if (!r.resource || !isStr(r.resource.title) || !isStr(r.resource.creator)) err(id, 'falta resource.title / resource.creator');
  else if (!resources.has(`${r.resource.title}\u0000${r.resource.creator}`))
    err(id, `resource no existe en los manifiestos: "${r.resource.title}" / "${r.resource.creator}"`);

  // Solo el campo propio del tipo
  for (const [k, f] of Object.entries(ONLY)) if (k !== r.kind && f in r) err(id, `${f} solo se permite en kind=${k}`);

  if (r.kind === 'trivia') {
    if (!Array.isArray(r.questions) || r.questions.length === 0) err(id, 'trivia sin questions');
    else r.questions.forEach((q, j) => {
      const qid = `${id} q${j + 1}`;
      if (!isStr(q.prompt)) err(qid, 'falta prompt');
      if (!isStr(q.explanation)) err(qid, 'falta explanation');
      if (!Array.isArray(q.options) || q.options.length < 3) err(qid, 'menos de 3 opciones');
      else {
        if (q.options.some((o) => !isStr(o))) err(qid, 'opción vacía');
        if (new Set(q.options).size !== q.options.length) err(qid, 'opciones repetidas');
        if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= q.options.length) err(qid, `answer fuera de rango: ${q.answer}`);
      }
    });
  } else if (r.kind === 'sequence') {
    if (!Array.isArray(r.steps) || r.steps.length < 3) err(id, 'sequence necesita al menos 3 steps');
    else {
      if (r.steps.some((s) => !isStr(s))) err(id, 'step vacío');
      if (new Set(r.steps).size !== r.steps.length) err(id, 'steps repetidos (la puntuación por posición sería ambigua)');
    }
  } else if (r.kind === 'match') {
    if (!Array.isArray(r.pairs) || r.pairs.length < 3 || r.pairs.length > 6) err(id, 'match necesita entre 3 y 6 pairs');
    else {
      if (r.pairs.some((p) => !isStr(p?.left) || !isStr(p?.right))) err(id, 'pair con left/right vacío');
      const L = r.pairs.map((p) => p.left), R = r.pairs.map((p) => p.right);
      if (new Set(L).size !== L.length) err(id, 'left repetido');
      if (new Set(R).size !== R.length) err(id, 'right repetido');
    }
  }

  if (KINDS.has(r.kind) && Array.isArray(r.bands) && r.bands.length) {
    const k = `${r.bands[0]} ${r.kind}`;
    count[k] = (count[k] ?? 0) + 1;
  }
});

console.log(`Manifiestos cargados: ${loaded.join(', ') || 'ninguno'}`);
console.log(`Colisiones de id comprobadas contra: ${others.join(', ') || 'ningún otro archivo'}`);
console.log(`Retos: ${retos.length}`);
for (const b of BANDS) {
  const parts = [...KINDS].map((k) => `${k} ${count[`${b} ${k}`] ?? 0}`);
  console.log(`  banda principal ${b}: ${parts.join(', ')}`);
}
for (const w of warnings) console.log(`ADVERTENCIA ${w}`);
for (const e of errors) console.log(`ERROR ${e}`);
console.log(errors.length ? `FALLÓ: ${errors.length} error(es)` : `OK: 0 errores, ${warnings.length} advertencia(s)`);
process.exit(errors.length ? 1 : 0);
