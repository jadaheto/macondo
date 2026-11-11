import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { createApp } from './app.factory';
import { APP_CONFIG, type AppConfig } from './config/env';

async function bootstrap(): Promise<void> {
  const app = await createApp();
  const cfg = app.get<AppConfig>(APP_CONFIG);
  await app.listen(cfg.port, '0.0.0.0');
  Logger.log(`Macondo Digital API escuchando en http://localhost:${cfg.port}/api`, 'Bootstrap');
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Error al iniciar la API', err);
  process.exit(1);
});
