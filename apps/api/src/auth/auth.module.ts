import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_CONFIG, type AppConfig } from '../config/env';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [APP_CONFIG],
      useFactory: (cfg: AppConfig) => ({ secret: cfg.jwtSecret, signOptions: { expiresIn: cfg.jwtExpiresIn as '8h' } }),
    }),
    // Throttler solo aplicado (vía ThrottlerGuard) al endpoint de login.
    ThrottlerModule.forRootAsync({
      inject: [APP_CONFIG],
      useFactory: (cfg: AppConfig) => ({
        throttlers: [{ ttl: cfg.loginThrottleTtlMs, limit: cfg.loginThrottleLimit }],
        errorMessage: 'Demasiados intentos de inicio de sesión. Espere un momento e intente de nuevo.',
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard, RolesGuard],
  exports: [JwtModule, JwtAuthGuard, RolesGuard],
})
export class AuthModule {}
