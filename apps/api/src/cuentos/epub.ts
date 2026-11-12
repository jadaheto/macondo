import type { CuentoGenerado } from '@macondo/shared';
import { createHash } from 'node:crypto';
import { crc32, deflateRawSync } from 'node:zlib';

/**
 * EPUB 3 mínimo y válido construido en Node, con la misma estructura que `catalogo-dp/_tools/cuentos-build.py`
 * (portada, páginas, actividades, créditos, nav + NCX). Sin dependencias: escritor ZIP propio (mimetype STORE,
 * resto DEFLATE), fechas fijas para que el archivo sea reproducible.
 */

const E = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));

const CSS = `body{font-family:"Outfit","Trebuchet MS",Verdana,sans-serif;margin:0 4%;color:#24364b;background:#fffdf8}
h1{font-size:1.9em;line-height:1.2;color:#17365d;text-align:center;margin:.6em 0 .4em}
h2{font-size:1.5em;color:#17365d;margin:1em 0 .5em}
p{font-size:1.4em;line-height:1.6;margin:0 0 .7em}
.g1 p{font-size:1.6em;line-height:1.7}
.cover{margin:0;padding:0;text-align:center}
.cover img{max-width:100%;max-height:100%}
.autor{text-align:center;color:#587086;font-size:1.1em}
ol.q li,ul.g li{font-size:1.3em;line-height:1.6;margin-bottom:.8em}
ol.q ul{list-style:lower-alpha;margin-top:.3em}
ol.q ul li{font-size:.9em;margin-bottom:.2em}
.small{font-size:1em;color:#587086}
.valor{border-left:4px solid #76a82b;padding-left:.8em;font-style:italic}
`;

function xhtml(title: string, body: string, cls = ''): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="es" lang="es">
<head><meta charset="UTF-8"/><title>${E(title)}</title><link rel="stylesheet" type="text/css" href="css/estilo.css"/></head>
<body${cls ? ` class="${cls}"` : ''}>
${body}
</body>
</html>
`;
}

/** Fecha fija de los miembros del ZIP (DOS: 2026-10-31 00:00). */
const DOS_TIME = 0;
const DOS_DATE = ((2026 - 1980) << 9) | (10 << 5) | 31;

export interface ZipEntry { name: string; data: Buffer; store?: boolean }
/** Escritor ZIP mínimo (sin ZIP64, sin cifrado). Nombres en UTF-8. */
export function writeZip(entries: ZipEntry[]): Buffer {
  const locals: Buffer[] = [];
  const centrals: Buffer[] = [];
  let offset = 0;
  for (const e of entries) {
    const name = Buffer.from(e.name, 'utf8');
    const comp = e.store ? e.data : deflateRawSync(e.data, { level: 9 });
    const method = e.store ? 0 : 8;
    const crc = crc32(e.data) >>> 0;
    const loc = Buffer.alloc(30);
    loc.writeUInt32LE(0x04034b50, 0); loc.writeUInt16LE(20, 4); loc.writeUInt16LE(0x0800, 6); loc.writeUInt16LE(method, 8);
    loc.writeUInt16LE(DOS_TIME, 10); loc.writeUInt16LE(DOS_DATE, 12);
    loc.writeUInt32LE(crc, 14); loc.writeUInt32LE(comp.length, 18); loc.writeUInt32LE(e.data.length, 22); loc.writeUInt16LE(name.length, 26);
    locals.push(loc, name, comp);
    const cen = Buffer.alloc(46);
    cen.writeUInt32LE(0x02014b50, 0); cen.writeUInt16LE((3 << 8) | 20, 4); cen.writeUInt16LE(20, 6); cen.writeUInt16LE(0x0800, 8);
    cen.writeUInt16LE(method, 10); cen.writeUInt16LE(DOS_TIME, 12); cen.writeUInt16LE(DOS_DATE, 14);
    cen.writeUInt32LE(crc, 16); cen.writeUInt32LE(comp.length, 20); cen.writeUInt32LE(e.data.length, 24);
    cen.writeUInt16LE(name.length, 28); cen.writeUInt32LE((0o100644 << 16) >>> 0, 38); cen.writeUInt32LE(offset, 42);
    centrals.push(cen, name);
    offset += 30 + name.length + comp.length;
  }
  const cd = Buffer.concat(centrals);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0); eocd.writeUInt16LE(entries.length, 8); eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(cd.length, 12); eocd.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, cd, eocd]);
}

/** Lista los nombres de un ZIP (solo para pruebas; recorre las cabeceras locales). */
export function zipNames(buf: Buffer): string[] {
  const names: string[] = [];
  let pos = 0;
  while (pos + 30 <= buf.length && buf.readUInt32LE(pos) === 0x04034b50) {
    const nameLen = buf.readUInt16LE(pos + 26);
    const extraLen = buf.readUInt16LE(pos + 28);
    const compLen = buf.readUInt32LE(pos + 18);
    names.push(buf.subarray(pos + 30, pos + 30 + nameLen).toString('utf8'));
    pos += 30 + nameLen + extraLen + compLen;
  }
  return names;
}

export interface EpubInput {
  id: string;
  titulo: string;
  autorLinea: string;
  creator: string;
  contenido: CuentoGenerado;
  banda: string;
  /** Portada (opcional): PNG tipográfica o JPEG de la ilustración con IA (ADR-020). */
  cover: { data: Buffer; mime: 'image/png' | 'image/jpeg' } | null;
  fecha: string; // YYYY-MM-DD
}

/** Construye el EPUB del cuento. Determinista para la misma entrada. */
export function buildCuentoEpub(i: EpubInput): Buffer {
  const { titulo, contenido: c } = i;
  const uid = 'urn:uuid:' + uuidFrom(`macondo-cuento-${i.id}`);
  const cls = i.banda === '1-3' ? 'g1' : '';
  const files: Array<[string, Buffer | string]> = [];
  files.push(['OEBPS/css/estilo.css', CSS]);
  const hasCover = !!i.cover;
  const coverFile = i.cover?.mime === 'image/jpeg' ? 'img/portada.jpg' : 'img/portada.png';
  if (i.cover) {
    files.push([`OEBPS/${coverFile}`, i.cover.data]);
    files.push(['OEBPS/portada.xhtml', xhtml(titulo, `<section epub:type="cover" class="cover"><img src="${coverFile}" alt="Portada: ${E(titulo)}"/></section>`)]);
  }
  const paras = c.parrafos.map((p) => `<p>${E(p)}</p>`).join('\n');
  files.push(['OEBPS/cuento.xhtml', xhtml(titulo, `<section epub:type="bodymatter chapter">\n<h1>${E(titulo)}</h1>\n<p class="autor">${E(i.autorLinea)}</p>\n${paras}\n<p class="valor">${E(c.valorRecordatorio)}</p>\n</section>`, cls)]);
  const qs = c.preguntas.map((q) => `<li>${E(q.pregunta)}<ul>${q.opciones.map((o) => `<li>${E(o)}</li>`).join('')}</ul></li>`).join('\n');
  const gl = `<h2>Palabras nuevas</h2>\n<ul class="g">${c.glosario.map((g) => `<li><b>${E(g.palabra)}</b>: ${E(g.significado)}</li>`).join('')}</ul>`;
  files.push(['OEBPS/actividades.xhtml', xhtml(titulo, `<section epub:type="backmatter">\n<h2>Para conversar</h2>\n<ol class="q">${qs}</ol>\n${gl}\n</section>`, cls)]);
  const cred = `<section epub:type="colophon">
<h2>Créditos</h2>
<p class="small"><b>${E(titulo)}</b></p>
<p class="small">${E(i.autorLinea)}.</p>
<p class="small">Texto creado en el Taller de cuentos de Macondo Digital (Biblioteca Macondo – Comfasucre) a partir de opciones elegidas por el lector, revisado por la biblioteca antes de publicarse. Comfasucre, Sucre (Colombia), ${E(i.fecha.slice(0, 4))}.</p>
<p class="small">Contenido de la biblioteca, sin datos personales. Puede contener texto generado con asistencia de inteligencia artificial.</p>
</section>`;
  files.push(['OEBPS/creditos.xhtml', xhtml(titulo, cred)]);
  const spine = [...(hasCover ? ['portada.xhtml'] : []), 'cuento.xhtml', 'actividades.xhtml', 'creditos.xhtml'];
  const navItems: Array<[string, string]> = [['cuento.xhtml', titulo], ['actividades.xhtml', 'Para conversar y palabras nuevas'], ['creditos.xhtml', 'Créditos']];
  files.push(['OEBPS/nav.xhtml', xhtml(titulo, `<nav epub:type="toc" id="toc"><h2>Contenido</h2><ol>${navItems.map(([h, t]) => `<li><a href="${h}">${E(t)}</a></li>`).join('')}</ol></nav>\n<nav epub:type="landmarks" hidden=""><ol>${hasCover ? '<li><a epub:type="cover" href="portada.xhtml">Portada</a></li>' : ''}<li><a epub:type="bodymatter" href="cuento.xhtml">Cuento</a></li></ol></nav>`)]);
  files.push(['OEBPS/toc.ncx', `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1"><head><meta name="dtb:uid" content="${uid}"/></head><docTitle><text>${E(titulo)}</text></docTitle><navMap>${navItems.map(([h, t], k) => `<navPoint id="np${k + 1}" playOrder="${k + 1}"><navLabel><text>${E(t)}</text></navLabel><content src="${h}"/></navPoint>`).join('')}</navMap></ncx>
`]);
  const man = [
    '<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>',
    '<item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>',
    '<item id="css" href="css/estilo.css" media-type="text/css"/>',
    ...(hasCover ? [`<item id="cover-img" href="${coverFile}" media-type="${i.cover?.mime ?? 'image/png'}" properties="cover-image"/>`] : []),
    ...spine.map((h) => `<item id="${h.split('.')[0]}" href="${h}" media-type="application/xhtml+xml"/>`),
  ];
  const opf = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="uid" xml:lang="es">
<metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
<dc:identifier id="uid">${uid}</dc:identifier>
<dc:title>${E(titulo)}</dc:title>
<dc:language>es</dc:language>
<dc:creator id="cre">${E(i.creator)}</dc:creator>
<dc:publisher>Comfasucre – Biblioteca Macondo</dc:publisher>
<dc:rights>Contenido creado en el Taller de cuentos de la biblioteca</dc:rights>
<dc:description>${E(c.sinopsis)}</dc:description>
<dc:subject>cuento</dc:subject><dc:subject>cuento original</dc:subject><dc:subject>taller de cuentos</dc:subject>
<dc:date>${E(i.fecha)}</dc:date>
<meta property="dcterms:modified">${E(i.fecha)}T00:00:00Z</meta>
${hasCover ? '<meta name="cover" content="cover-img"/>' : ''}
</metadata>
<manifest>
${man.join('\n')}
</manifest>
<spine toc="ncx">
${spine.map((h) => `<itemref idref="${h.split('.')[0]}"/>`).join('\n')}
</spine>
</package>
`;
  files.push(['OEBPS/content.opf', opf]);
  const container = `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>
`;
  const entries: ZipEntry[] = [
    { name: 'mimetype', data: Buffer.from('application/epub+zip'), store: true },
    { name: 'META-INF/container.xml', data: Buffer.from(container, 'utf8') },
    ...files.sort((a, b) => (a[0] < b[0] ? -1 : 1)).map(([name, data]) => ({ name, data: Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf8') })),
  ];
  return writeZip(entries);
}

/** UUID v5-like determinista a partir de un texto (sha1 → formato UUID). */
function uuidFrom(text: string): string {
  const h = createHash('sha1').update(text).digest('hex');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-${((parseInt(h.slice(16, 18), 16) & 0x3f) | 0x80).toString(16).padStart(2, '0')}${h.slice(18, 20)}-${h.slice(20, 32)}`;
}

/** Texto plano del cuento para la narración (título + párrafos). */
export function textoNarracion(titulo: string, c: CuentoGenerado): string {
  return [titulo, ...c.parrafos].join('\n\n');
}
