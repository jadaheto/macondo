import { Logger, Module } from '@nestjs/common';
import { CatalogModule } from '../catalog/catalog.module';
import { APP_CONFIG, type AppConfig } from '../config/env';
import { TtsModule } from '../tts/tts.module';
import { AdminCuentosController, CuentosController } from './cuentos.controller';
import { CuentosService } from './cuentos.service';
import { HuggingFaceProvider, IMAGE_PROVIDER, type ImageProvider, NoImageProvider, PollinationsProvider } from './image.provider';
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
    {
      // Ilustración (ADR-020): Pollinations (gratuito) por defecto; Hugging Face con token; none = sin ilustración.
      provide: IMAGE_PROVIDER,
      inject: [APP_CONFIG],
      useFactory: (cfg: AppConfig): ImageProvider => {
        const log = new Logger('CuentosModule');
        const im = cfg.cuentos.imagenes;
        if (!cfg.cuentos.enabled || !im.enabled || im.proveedor === 'none') {
          log.log('Taller de cuentos: sin ilustración con IA (portada tipográfica)');
          return new NoImageProvider();
        }
        if (im.proveedor === 'huggingface') {
          const p = new HuggingFaceProvider(im);
          log.log(p.available() ? 'Taller de cuentos: ilustración con Hugging Face' : 'Taller de cuentos: IMAGENES_PROVEEDOR=huggingface sin HUGGINGFACE_TOKEN → sin ilustración');
          return p;
        }
        log.log(`Taller de cuentos: ilustración con Pollinations (FLUX)${im.pollinationsToken ? ' con token' : ' en modo anónimo'}, una imagen cada ${Math.round(im.intervaloMs / 1000)} s como máximo`);
        return new PollinationsProvider(im);
      },
    },
  ],
  exports: [CuentosService],
})
export class CuentosModule {}
