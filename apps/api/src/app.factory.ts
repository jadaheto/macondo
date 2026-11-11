import { type INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { APP_CONFIG, type AppConfig, loadEnv } from './config/env';

/** Crea y configura la app (usado por main.ts y por las pruebas). */
export async function createApp(opts: { logger?: false } = {}): Promise<INestApplication> {
  loadEnv();
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { logger: opts.logger, bodyParser: true });
  const cfg = app.get<AppConfig>(APP_CONFIG);
  app.set('trust proxy', 'loopback'); // proxy de Next.js en la misma máquina
  app.disable('x-powered-by');
  app.useBodyParser('json', { limit: '1mb' });
  app.use(
    helmet({
      // Permite que la web (mismo sitio, otro puerto) cargue portadas/audio directamente si no usa el proxy.
      crossOriginResourcePolicy: { policy: 'same-site' },
    }),
  );
  // CORS_ORIGIN="*" (solo desarrollo): acepta cualquier origen/IP reflejándolo.
  // En producción, usar la lista explícita de dominios separados por comas.
  const anyOrigin = cfg.corsOrigins.includes('*');
  app.enableCors({
    origin: anyOrigin ? true : cfg.corsOrigins,
    credentials: true,
    exposedHeaders: ['Content-Range', 'Accept-Ranges', 'Content-Length', 'ETag'],
  });
  app.setGlobalPrefix('api');
  app.enableShutdownHooks();
  await app.init();
  return app;
}
