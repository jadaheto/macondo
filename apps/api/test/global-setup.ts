import { execFileSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import * as path from 'node:path';
import { TEST_STORAGE_DIR, testDatabaseUrl } from './test-env';

export default function setup(): () => void {
  const url = testDatabaseUrl();
  // Aplica las migraciones al esquema `test` (no toca `public`).
  execFileSync(process.execPath, [path.resolve(__dirname, '..', 'scripts', 'prisma.cjs'), 'migrate', 'deploy'], {
    env: { ...process.env, DATABASE_URL: url },
    stdio: 'pipe',
  });
  rmSync(TEST_STORAGE_DIR, { recursive: true, force: true });
  return () => rmSync(TEST_STORAGE_DIR, { recursive: true, force: true });
}
