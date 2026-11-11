import { createHash, randomUUID } from 'node:crypto';
import { createReadStream, createWriteStream, promises as fs } from 'node:fs';
import * as path from 'node:path';
import { Readable, Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import {
  type ByteRange,
  isValidStorageKey,
  type ObjectStat,
  type SavedObject,
  type StorageNamespace,
  type StorageProvider,
} from './storage.provider';

export class LocalStorageProvider implements StorageProvider {
  private readonly root: string;

  constructor(rootDir: string) {
    this.root = path.resolve(rootDir);
  }

  /** Resuelve una clave a ruta absoluta impidiendo path traversal. */
  private resolveKey(key: string): string {
    if (!isValidStorageKey(key)) throw new Error('Clave de almacenamiento inválida');
    const full = path.resolve(this.root, key);
    if (!full.startsWith(this.root + path.sep)) throw new Error('Ruta fuera del almacenamiento');
    return full;
  }

  async save(namespace: StorageNamespace, ext: string, data: Readable | Buffer): Promise<SavedObject> {
    const safeExt = ext.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8) || 'bin';
    const key = `${namespace}/${randomUUID()}.${safeExt}`;
    const full = this.resolveKey(key);
    await fs.mkdir(path.dirname(full), { recursive: true });
    const hash = createHash('sha256');
    let size = 0;
    const meter = new Transform({
      transform(chunk: Buffer, _enc, cb) {
        hash.update(chunk);
        size += chunk.length;
        cb(null, chunk);
      },
    });
    const source = Buffer.isBuffer(data) ? Readable.from([data]) : data;
    try {
      await pipeline(source, meter, createWriteStream(full, { flags: 'wx', mode: 0o640 }));
    } catch (err) {
      await fs.rm(full, { force: true });
      throw err;
    }
    return { key, sizeBytes: size, sha256: hash.digest('hex') };
  }

  /** Escritura atómica (archivo temporal + rename) para que una lectura concurrente nunca vea un objeto a medias. */
  async put(key: string, data: Buffer): Promise<void> {
    const full = this.resolveKey(key);
    await fs.mkdir(path.dirname(full), { recursive: true });
    const tmp = `${full}.${randomUUID()}.tmp`;
    try {
      await fs.writeFile(tmp, data, { mode: 0o640 });
      await fs.rename(tmp, full);
    } catch (err) {
      await fs.rm(tmp, { force: true });
      throw err;
    }
  }

  async createReadStream(key: string, range?: ByteRange): Promise<Readable> {
    const full = this.resolveKey(key);
    return range ? createReadStream(full, { start: range.start, end: range.end }) : createReadStream(full);
  }

  async stat(key: string): Promise<ObjectStat | null> {
    try {
      const st = await fs.stat(this.resolveKey(key));
      return st.isFile() ? { sizeBytes: st.size } : null;
    } catch {
      return null;
    }
  }

  async delete(key: string): Promise<void> {
    if (!isValidStorageKey(key)) return;
    await fs.rm(this.resolveKey(key), { force: true });
  }
}
