import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import * as os from 'node:os';
import * as path from 'node:path';
import { CatalogModule } from '../catalog/catalog.module';
import { APP_CONFIG, type AppConfig } from '../config/env';
import { TtsModule } from '../tts/tts.module';
import { TvModule } from '../tv/tv.module';
import { AdminResourcesController } from './admin-resources.controller';
import { AdminResourcesService } from './admin-resources.service';
import { AdminStatsController } from './admin-stats.controller';
import { AdminStatsService } from './admin-stats.service';
import { AdminTvController } from './admin-tv.controller';

@Module({
  imports: [
    CatalogModule,
    TvModule,
    TtsModule,
    // Multer escribe a un directorio temporal con nombre aleatorio (nunca el nombre del cliente).
    MulterModule.registerAsync({
      inject: [APP_CONFIG],
      useFactory: (cfg: AppConfig) => ({
        dest: path.join(os.tmpdir(), 'macondo-uploads'),
        limits: { fileSize: cfg.maxUploadBytes, files: 1, fields: 10, parts: 12 },
      }),
    }),
  ],
  controllers: [AdminResourcesController, AdminTvController, AdminStatsController],
  providers: [AdminResourcesService, AdminStatsService],
})
export class AdminModule {}
