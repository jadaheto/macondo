import * as dotenv from 'dotenv';
import * as os from 'node:os';
import * as path from 'node:path';

const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');

/** URL de la BD de pruebas: misma instancia dockerizada, esquema `test` aislado. */
export function testDatabaseUrl(): string {
  dotenv.config({ path: path.join(REPO_ROOT, '.env') });
  const base = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!base) throw new Error('DATABASE_URL no definido (.env en la raíz)');
  const u = new URL(base);
  u.searchParams.set('schema', 'test');
  return u.toString();
}

export const TEST_STORAGE_DIR = path.join(os.tmpdir(), 'macondo-api-test-storage');
