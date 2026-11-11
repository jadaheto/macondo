import { Logger, Module } from '@nestjs/common';
import { CatalogModule } from '../catalog/catalog.module';
import { APP_CONFIG, type AppConfig } from '../config/env';
import { TtsModule } from '../tts/tts.module';
import { AdminCuentosController, CuentosController } from './cuentos.controller';
import { CuentosService } from './cuentos.service';
import { DeepSeekProvider, LLM_PROVIDER, type LlmProvider, NoLlmProvider } from './llm.provider';

/**
 * Taller de cuentos (ADR-018). El proveedor de IA se elige por configuración: con DEEPSEEK_API_KEY → DeepSeek;
 * sin clave → proveedor nulo (modo plantilla). En pruebas se sustituye `LLM_PROVIDER` por un proveedor falso.
 */
@Module({
  imports: [CatalogModule, TtsModule],
  controllers: [CuentosController, AdminCuentosController],
  providers: [
    CuentosService,
    {
      provide: LLM_PROVIDER,
      inject: [APP_CONFIG],
      useFactory: (cfg: AppConfig): LlmProvider => {
        const log = new Logger('CuentosModule');
        if (!cfg.cuentos.enabled) {
          log.log('Taller de cuentos desactivado (CUENTOS_ENABLED=false)');
          return new NoLlmProvider();
        }
        if (cfg.cuentos.deepseekApiKey) {
          log.log(`Taller de cuentos: proveedor DeepSeek (${cfg.cuentos.deepseekModel}), modo IA con respaldo en plantilla`);
          return new DeepSeekProvider(cfg.cuentos);
        }
        log.log('Taller de cuentos: sin DEEPSEEK_API_KEY → modo plantilla');
        return new NoLlmProvider();
      },
    },
  ],
  exports: [CuentosService],
})
export class CuentosModule {}
