import type { FileHandle } from 'node:fs/promises';
import { crc32, inflateRawSync } from 'node:zlib';

/**
 * Lector ZIP mínimo y defensivo (sin dependencias). Solo lee el directorio central y descomprime
 * entradas puntuales en memoria, con límite de salida igual al tamaño declarado (anti zip-bomb).
 * No admite ZIP64, cifrado, multi-disco ni métodos distintos de STORE (0) y DEFLATE (8).
 */
export class ZipError extends Error {}

export interface ZipEntry {
  name: string;
  method: number;
  flags: number;
  crc: number;
  compressedSize: number;
  uncompressedSize: number;
  localHeaderOffset: number;
  isDirectory: boolean;
  isSymlink: boolean;
  encrypted: boolean;
}

const EOCD_SIG = 0x06054b50;
const CEN_SIG = 0x02014b50;
const LOC_SIG = 0x04034b50;
const MAX_CD_BYTES = 4 * 1024 * 1024;

async function readAt(fh: FileHandle, position: number, length: number): Promise<Buffer> {
  const buf = Buffer.alloc(length);
  const { bytesRead } = await fh.read(buf, 0, length, position);
  if (bytesRead !== length) throw new ZipError('ZIP truncado o dañado.');
  return buf;
}

export async function readZipDirectory(fh: FileHandle, fileSize: number): Promise<ZipEntry[]> {
  if (fileSize < 22) throw new ZipError('El archivo no es un ZIP válido.');
  const tailLen = Math.min(fileSize, 22 + 0xffff);
  const tail = await readAt(fh, fileSize - tailLen, tailLen);
  let eocd = -1;
  for (let i = tail.length - 22; i >= 0; i--) {
    if (tail.readUInt32LE(i) === EOCD_SIG) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new ZipError('El archivo no es un ZIP válido (falta el directorio central).');
  const diskNo = tail.readUInt16LE(eocd + 4);
  const cdDisk = tail.readUInt16LE(eocd + 6);
  const entriesThisDisk = tail.readUInt16LE(eocd + 8);
  const totalEntries = tail.readUInt16LE(eocd + 10);
  const cdSize = tail.readUInt32LE(eocd + 12);
  const cdOffset = tail.readUInt32LE(eocd + 16);
  if (totalEntries === 0xffff || cdSize === 0xffffffff || cdOffset === 0xffffffff) throw new ZipError('ZIP64 no está soportado.');
  if (diskNo !== 0 || cdDisk !== 0 || entriesThisDisk !== totalEntries) throw new ZipError('ZIP de varios volúmenes no soportado.');
  if (cdSize > MAX_CD_BYTES || cdOffset + cdSize > fileSize) throw new ZipError('Directorio central del ZIP inválido.');

  const cd = await readAt(fh, cdOffset, cdSize);
  const entries: ZipEntry[] = [];
  let p = 0;
  for (let n = 0; n < totalEntries; n++) {
    if (p + 46 > cd.length || cd.readUInt32LE(p) !== CEN_SIG) throw new ZipError('Directorio central del ZIP dañado.');
    const madeBy = cd.readUInt16LE(p + 4);
    const flags = cd.readUInt16LE(p + 8);
    const method = cd.readUInt16LE(p + 10);
    const crc = cd.readUInt32LE(p + 16);
    const compressedSize = cd.readUInt32LE(p + 20);
    const uncompressedSize = cd.readUInt32LE(p + 24);
    const nameLen = cd.readUInt16LE(p + 28);
    const extraLen = cd.readUInt16LE(p + 30);
    const commentLen = cd.readUInt16LE(p + 32);
    const externalAttr = cd.readUInt32LE(p + 38);
    const localHeaderOffset = cd.readUInt32LE(p + 42);
    if (p + 46 + nameLen > cd.length) throw new ZipError('Directorio central del ZIP dañado.');
    const name = cd.toString('utf8', p + 46, p + 46 + nameLen);
    const unixMode = (externalAttr >>> 16) & 0o170000;
    const host = madeBy >> 8;
    entries.push({
      name,
      method,
      flags,
      crc,
      compressedSize,
      uncompressedSize,
      localHeaderOffset,
      isDirectory: name.endsWith('/'),
      isSymlink: host === 3 && unixMode === 0o120000,
      encrypted: (flags & 0x1) !== 0,
    });
    p += 46 + nameLen + extraLen + commentLen;
  }
  return entries;
}

/** Descomprime una entrada verificando tamaño declarado y CRC-32. */
export async function readZipEntry(fh: FileHandle, fileSize: number, e: ZipEntry): Promise<Buffer> {
  if (e.encrypted) throw new ZipError(`«${e.name}» está cifrado.`);
  if (e.localHeaderOffset + 30 > fileSize) throw new ZipError('ZIP dañado.');
  const loc = await readAt(fh, e.localHeaderOffset, 30);
  if (loc.readUInt32LE(0) !== LOC_SIG) throw new ZipError('ZIP dañado (cabecera local inválida).');
  const start = e.localHeaderOffset + 30 + loc.readUInt16LE(26) + loc.readUInt16LE(28);
  if (start + e.compressedSize > fileSize) throw new ZipError('ZIP truncado.');
  const raw = e.compressedSize ? await readAt(fh, start, e.compressedSize) : Buffer.alloc(0);
  let out: Buffer;
  if (e.method === 0) {
    out = raw;
  } else if (e.method === 8) {
    try {
      out = inflateRawSync(raw, { maxOutputLength: Math.max(1, e.uncompressedSize) });
    } catch {
      throw new ZipError(`«${e.name}» no se pudo descomprimir (dañado o tamaño declarado falso).`);
    }
  } else {
    throw new ZipError(`«${e.name}» usa un método de compresión no soportado.`);
  }
  if (out.length !== e.uncompressedSize) throw new ZipError(`«${e.name}»: el tamaño real no coincide con el declarado.`);
  if ((crc32(out) >>> 0) !== (e.crc >>> 0)) throw new ZipError(`«${e.name}»: CRC inválido (archivo dañado).`);
  return out;
}
