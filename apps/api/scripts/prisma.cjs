#!/usr/bin/env node
/**
 * Wrapper del CLI de Prisma que carga el .env de la raíz del monorepo
 * (Prisma solo busca .env junto al schema o al package.json de apps/api).
 * Las variables ya definidas en el entorno tienen prioridad (útil para tests).
 */
const path = require('node:path');
const { spawnSync } = require('node:child_process');
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '..', '.env') });

const prismaBin = require.resolve('prisma/build/index.js');
const res = spawnSync(process.execPath, [prismaBin, ...process.argv.slice(2)], {
  stdio: 'inherit',
  cwd: path.resolve(__dirname, '..'),
  env: process.env,
});
process.exit(res.status ?? 1);
