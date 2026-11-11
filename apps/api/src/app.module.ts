import { Module } from '@nestjs/common';
import { AdminModule } from './admin/admin.module';
import { AuditModule } from './audit/audit.module';
import { AuthModule } from './auth/auth.module';
import { CatalogModule } from './catalog/catalog.module';
import { ConfigModule } from './common/config.module';
import { HealthController } from './health/health.controller';
import { PrismaModule } from './prisma/prisma.module';
import { StorageModule } from './storage/storage.module';
import { TvModule } from './tv/tv.module';
import { ChallengesModule } from './challenges/challenges.module';
import { CuentosModule } from './cuentos/cuentos.module';

@Module({
  imports: [ConfigModule, PrismaModule, StorageModule, AuditModule, AuthModule, CatalogModule, TvModule, AdminModule, ChallengesModule, CuentosModule],
  controllers: [HealthController],
})
export class AppModule {}
