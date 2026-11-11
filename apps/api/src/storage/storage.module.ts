import { Global, Module } from '@nestjs/common';
import { APP_CONFIG, type AppConfig } from '../config/env';
import { LocalStorageProvider } from './local-storage.provider';
import { STORAGE_PROVIDER, type StorageProvider } from './storage.provider';

@Global()
@Module({
  providers: [
    {
      provide: STORAGE_PROVIDER,
      inject: [APP_CONFIG],
      useFactory: (cfg: AppConfig): StorageProvider => {
        switch (cfg.storageDriver) {
          case 'local':
            return new LocalStorageProvider(cfg.storageDir);
          // case 's3': return new S3StorageProvider(...)  // pendiente (MinIO/S3)
          default:
            throw new Error(`STORAGE_DRIVER no soportado: ${cfg.storageDriver}`);
        }
      },
    },
  ],
  exports: [STORAGE_PROVIDER],
})
export class StorageModule {}
