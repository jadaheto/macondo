import { BadRequestException, ConflictException, HttpException, HttpStatus, Inject, Injectable, Logger, NotFoundException, Optional } from '@nestjs/common';
import {
  API_ROUTES, CUENTO_LICENSE, type CuentoAdminDTO, type CuentoDTO, type CuentoGenerado, CuentoGeneradoSchema, type CuentoModo, type CuentoOpciones,
  type CuentoRevisar, type CuentosDisponibleDTO, type CuentoStatus, cuentoCoverSvg, cuentoGrades, type GradeBand, type ResourceExtra,
} from '@macondo/shared';
import { Prisma, type GeneratedStory } from '@prisma/client';
import { createHash } from 'node:crypto';
import { AuditService } from '../audit/audit.service';
import { APP_CONFIG, type AppConfig, type CuentosConfig } from '../config/env';
import { PrismaService } from '../prisma/prisma.service';
import { STORAGE_PROVIDER, type StorageProvider } from '../storage/storage.provider';
import { TtsService } from '../tts/tts.service';
import { buildCuentoEpub, textoNarracion } from './epub';
import { LLM_PROVIDER, type LlmProvider, LlmUnavailableError, NoLlmProvider } from './llm.provider';
import { generarPlantilla } from './plantilla';
import { maxTokensFor, SYSTEM_PROMPT, userPrompt, userPromptEstricto } from './prompt';
import { extraerJson, validarCuento, validarNombre } from './safety';

/** 429 con mensaje en español (sin cabeceras con identidad). */
class TooManyStoriesException extends HttpException {
  constructor(msg: string) {
    super({ statusCode: 429, error: 'Too Many Requests', message: msg }, HttpStatus.TOO_MANY_REQUESTS);
  }
}

const MENSAJE_FALLO = 'No pudimos terminar tu cuento esta vez. Inténtalo de nuevo en un momento.';
const HORA_MS = 3_600_000;

export function hashDevice(deviceId: string): string {
  return createHash('sha256').update(`macondo-cuentos:${deviceId}`).digest('hex');
}

/** Resultado de la generación de texto (IA con reintento o plantilla). */
export interface GeneracionTexto {
  contenido: CuentoGenerado;
  modo: CuentoModo;
  providerMs: number | null;
  tokensIn: number | null;
  tokensOut: number | null;
  intentos: number;
}

/**
 * Taller de cuentos (ADR-018): validación → límite por dispositivo/global → generación (IA con un reintento y
 * respaldo en plantilla) → controles de contenido → guardado → narración con la voz de la biblioteca →
 * cola de revisión de la bibliotecaria → al aprobar, recursos del catálogo (libro EPUB + audiolibro).
 * Privacidad: el nombre de autor nunca sale del servidor; al proveedor solo van opciones cerradas y el
 * nombre del protagonista. No se guardan IP; solo el hash del id aleatorio del dispositivo.
 */
@Injectable()
export class CuentosService {
  private readonly log = new Logger(CuentosService.name);
  private readonly cfg: CuentosConfig;
  private readonly llm: LlmProvider;
  /** Trabajos en curso (por id) para poder esperarlos en pruebas y al apagar. */
  private readonly enCurso = new Map<string, Promise<void>>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly tts: TtsService,
    @Inject(STORAGE_PROVIDER) private readonly storage: StorageProvider,
    @Inject(APP_CONFIG) appConfig: AppConfig,
    @Optional() @Inject(LLM_PROVIDER) llm?: LlmProvider,
  ) {
    this.cfg = appConfig.cuentos;
    this.llm = llm ?? new NoLlmProvider();
  }

  /* ───────────── público ───────────── */

  disponible(): CuentosDisponibleDTO {
    return {
      habilitado: this.cfg.enabled,
      bandas: this.cfg.bandas as GradeBand[],
      modo: this.cfg.enabled && this.llm.available() ? 'ia' : 'plantilla',
    };
  }

  /** Crea el trabajo y arranca la generación en segundo plano. Devuelve el id para consultar el estado. */
  async crear(o: CuentoOpciones): Promise<{ id: string; status: CuentoStatus }> {
    if (!this.cfg.enabled) throw new BadRequestException('El Taller de cuentos no está habilitado en esta biblioteca.');
    if (!this.cfg.bandas.includes(o.banda)) throw new BadRequestException('El Taller de cuentos todavía no está disponible para tu grado. ¡Próximamente!');
    const errProta = validarNombre(o.protagonista);
    if (errProta) throw new BadRequestException(`Protagonista: ${errProta}`);
    const autor = o.autorNombre?.trim() || null;
    if (autor) {
      const errAutor = validarNombre(autor);
      if (errAutor) throw new BadRequestException(`Nombre de autor: ${errAutor}`);
    }
    const deviceHash = hashDevice(o.deviceId);
    const desde = new Date(Date.now() - HORA_MS);
    const [porDispositivo, globales] = await Promise.all([
      this.prisma.generatedStory.count({ where: { deviceHash, createdAt: { gte: desde }, status: { not: 'FAILED' } } }),
      this.prisma.generatedStory.count({ where: { createdAt: { gte: desde }, status: { not: 'FAILED' } } }),
    ]);
    if (porDispositivo >= this.cfg.limitePorHora) {
      throw new TooManyStoriesException(`Ya hiciste ${this.cfg.limitePorHora} cuentos en esta hora. Puedes leerlos, escucharlos o volver más tarde para hacer otro.`);
    }
    if (globales >= this.cfg.limiteGlobalPorHora) {
      throw new TooManyStoriesException('El taller está muy ocupado en este momento. Vuelve a intentarlo en unos minutos.');
    }
    const row = await this.prisma.generatedStory.create({
      data: { band: o.banda, autorNombre: autor, protagonista: o.protagonista.trim(), tipo: o.tipo, lugar: o.lugar, valor: o.valor, deviceHash, status: 'GENERATING' },
    });
    const job = this.ejecutar(row.id, { ...o, protagonista: row.protagonista })
      .catch((e: unknown) => this.log.error(`Trabajo ${row.id} falló de forma inesperada: ${(e as Error)?.message ?? e}`))
      .finally(() => this.enCurso.delete(row.id));
    this.enCurso.set(row.id, job);
    return { id: row.id, status: 'GENERATING' };
  }

  /** Espera a que termine el trabajo (pruebas y apagado ordenado). */
  async esperar(id: string): Promise<void> {
    await this.enCurso.get(id);
  }

  async obtener(id: string): Promise<CuentoDTO> {
    const r = await this.find(id);
    return this.toDTO(r);
  }

  /** Clave del MP3 si el audio está listo; 404 si no. */
  async audioKey(id: string): Promise<{ key: string; titulo: string; sha: string }> {
    const r = await this.find(id);
    if (!r.audioPath) throw new NotFoundException('Este cuento todavía no tiene audio.');
    return { key: r.audioPath, titulo: r.titulo, sha: createHash('sha256').update(r.audioPath).digest('hex') };
  }

  /* ───────────── generación ───────────── */

  /** Texto: IA (con un reintento estricto) → plantilla. Nunca lanza. */
  async generarTexto(o: Pick<CuentoOpciones, 'banda' | 'protagonista' | 'tipo' | 'lugar' | 'valor'>): Promise<GeneracionTexto> {
    let intentos = 0;
    if (this.llm.available()) {
      let motivos: string[] = [];
      let ms = 0;
      let tokensIn: number | null = null;
      let tokensOut: number | null = null;
      for (let intento = 0; intento < 2; intento++) {
        intentos += 1;
        const user = intento === 0 ? userPrompt(o) : userPromptEstricto(o, motivos);
        try {
          const res = await this.llm.generate({ system: SYSTEM_PROMPT, user, temperature: intento === 0 ? 0.8 : 0.5, maxTokens: maxTokensFor(o.banda) });
          ms += res.ms;
          tokensIn = (tokensIn ?? 0) + (res.usage.prompt ?? 0);
          tokensOut = (tokensOut ?? 0) + (res.usage.completion ?? 0);
          const json = extraerJson(res.text);
          const parsed = CuentoGeneradoSchema.safeParse(json);
          if (!parsed.success) {
            motivos = parsed.error.issues.slice(0, 4).map((i) => `${i.path.join('.') || 'json'}: ${i.message}`);
            if (json === null) motivos = ['la respuesta no era un JSON válido'];
            this.log.warn(`Cuento IA intento ${intento + 1}: JSON inválido (${motivos.join('; ')})`);
            continue;
          }
          const val = validarCuento(parsed.data, o.banda, o.protagonista);
          if (!val.ok) {
            motivos = val.motivos;
            this.log.warn(`Cuento IA intento ${intento + 1}: rechazado por controles (${motivos.join('; ')})`);
            continue;
          }
          return { contenido: parsed.data, modo: 'ia', providerMs: ms, tokensIn, tokensOut, intentos };
        } catch (e) {
          if (e instanceof LlmUnavailableError) {
            this.log.warn(`Proveedor de IA no disponible (${e.message}): se usa la plantilla`);
            break;
          }
          this.log.error(`Error inesperado del proveedor: ${(e as Error)?.message ?? e}`);
          break;
        }
      }
      this.log.log('Cuento: la IA no produjo un cuento válido; se usa la plantilla');
    }
    const contenido = generarPlantilla(o);
    return { contenido, modo: 'plantilla', providerMs: null, tokensIn: null, tokensOut: null, intentos };
  }

  private async ejecutar(id: string, o: CuentoOpciones): Promise<void> {
    let gen: GeneracionTexto;
    try {
      gen = await this.generarTexto(o);
    } catch (e) {
      this.log.error(`Generación ${id} falló: ${(e as Error)?.message ?? e}`);
      await this.prisma.generatedStory.update({ where: { id }, data: { status: 'FAILED', error: MENSAJE_FALLO } });
      return;
    }
    // Comprobación final también para la plantilla (nuestros textos pasan por el mismo filtro).
    const val = validarCuento(gen.contenido, o.banda, o.protagonista);
    if (!val.ok && gen.modo === 'ia') {
      gen = { contenido: generarPlantilla(o), modo: 'plantilla', providerMs: gen.providerMs, tokensIn: gen.tokensIn, tokensOut: gen.tokensOut, intentos: gen.intentos };
    }
    await this.prisma.generatedStory.update({
      where: { id },
      data: {
        status: 'GENERATED', modo: gen.modo, titulo: gen.contenido.titulo,
        contenido: gen.contenido as unknown as Prisma.InputJsonValue,
        providerMs: gen.providerMs, tokensIn: gen.tokensIn, tokensOut: gen.tokensOut,
      },
    });
    this.log.log(`Cuento ${id} (${o.banda}, ${o.tipo}/${o.lugar}/${o.valor}) listo en modo ${gen.modo}${gen.providerMs != null ? ` · ${gen.providerMs} ms · tokens ${gen.tokensIn ?? '?'}/${gen.tokensOut ?? '?'}` : ''} · ${gen.intentos} intento(s) de IA`);

    // Narración (ADR-017). Si el motor no está, el cuento sigue sin audio.
    let audio: { audioPath: string; audioDuration: number } | null = null;
    let audioError: string | null = null;
    if (this.cfg.audio) {
      try {
        const st = await this.tts.status();
        if (!st.ok) audioError = st.detail ?? 'motor de voz no disponible';
        else {
          const res = await this.tts.synthesize(textoNarracion(gen.contenido.titulo, gen.contenido), { title: gen.contenido.titulo });
          const saved = await this.storage.save('files', 'mp3', res.mp3);
          audio = { audioPath: saved.key, audioDuration: Math.round(res.durationSeconds) };
        }
      } catch (e) {
        audioError = (e as Error)?.message?.slice(0, 300) ?? 'error de narración';
        this.log.warn(`Cuento ${id}: sin audio (${audioError})`);
      }
    } else audioError = 'narración desactivada (CUENTOS_AUDIO=false)';
    await this.prisma.generatedStory.update({ where: { id }, data: { status: 'PENDING_REVIEW', ...(audio ?? {}), audioError } });
  }

  /* ───────────── administración ───────────── */

  async listar(status?: CuentoStatus): Promise<CuentoAdminDTO[]> {
    const rows = await this.prisma.generatedStory.findMany({ where: status ? { status } : undefined, orderBy: { createdAt: 'desc' }, take: 300 });
    return rows.map((r) => this.toAdminDTO(r));
  }

  async obtenerAdmin(id: string): Promise<CuentoAdminDTO> {
    return this.toAdminDTO(await this.find(id));
  }

  /** Conteos agregados para el Resumen del panel. */
  async conteos(): Promise<{ pendientes: number; aprobados: number; rechazados: number; total: number }> {
    const g = await this.prisma.generatedStory.groupBy({ by: ['status'], _count: { _all: true } });
    const n = (s: CuentoStatus) => g.find((x) => x.status === s)?._count._all ?? 0;
    return { pendientes: n('PENDING_REVIEW'), aprobados: n('APPROVED'), rechazados: n('REJECTED'), total: g.reduce((a, x) => a + x._count._all, 0) };
  }

  /** Aprueba (crea recursos PUBLISHED) o rechaza. Solo cuentos PENDING_REVIEW (o FAILED/GENERATED → rechazar). */
  async revisar(id: string, body: CuentoRevisar, actorId: string): Promise<CuentoAdminDTO> {
    const r = await this.find(id);
    const nota = body.nota?.trim() || null;
    if (body.decision === 'RECHAZAR') {
      if (r.status === 'APPROVED' || r.status === 'REJECTED') throw new ConflictException(`El cuento ya fue revisado (${r.status}).`);
      if (r.status === 'GENERATING') throw new ConflictException('El cuento todavía se está escribiendo.');
      const upd = await this.prisma.generatedStory.update({ where: { id }, data: { status: 'REJECTED', reviewNote: nota, reviewedBy: actorId, reviewedAt: new Date() } });
      await this.audit.log(actorId, 'CUENTO_REVIEW', 'GeneratedStory', id, { decision: 'RECHAZAR', nota, modo: r.modo, band: r.band });
      return this.toAdminDTO(upd);
    }
    if (r.status !== 'PENDING_REVIEW') throw new ConflictException(`Solo se aprueban cuentos pendientes de revisión (estado actual: ${r.status}).`);
    const contenido = CuentoGeneradoSchema.safeParse(r.contenido);
    if (!contenido.success) throw new ConflictException('El contenido guardado del cuento no es válido.');
    const c = contenido.data;
    const [gradeMin, gradeMax] = cuentoGrades(r.band as GradeBand);
    const creator = r.autorNombre ? `${r.autorNombre} (Taller de cuentos)` : 'Taller de cuentos – Biblioteca Macondo';
    const autorLinea = r.autorNombre ? `Escrito por ${r.autorNombre} con ayuda del Taller de cuentos` : 'Escrito en el Taller de cuentos de la biblioteca';
    const coverPng = await this.renderCover(r);
    const epub = buildCuentoEpub({ id: r.id, titulo: r.titulo, autorLinea, creator, contenido: c, banda: r.band, coverPng, fecha: new Date().toISOString().slice(0, 10) });
    const savedEpub = await this.storage.save('files', 'epub', epub);
    const savedCover = coverPng ? await this.storage.save('covers', 'png', coverPng) : null;
    const extra: ResourceExtra = {
      cuentoId: r.id,
      text: textoNarracion(r.titulo, c),
      questions: c.preguntas.map((q) => ({ prompt: q.pregunta, options: q.opciones, answer: q.respuesta, explanation: q.explicacion })),
    };
    const base = {
      title: r.titulo, creator, description: c.sinopsis, gradeMin, gradeMax, categories: [...CUENTO_LICENSE.categories], language: 'es',
      status: 'PUBLISHED' as const,
      licenseRightsHolder: CUENTO_LICENSE.rightsHolder, licenseName: CUENTO_LICENSE.licenseName, licenseUrl: null,
      licenseAuthorizedDevices: 30, licenseOfflineAllowed: true, licenseValidFrom: null, licenseValidUntil: null, licenseTerritory: 'CO',
      extra: extra as unknown as Prisma.InputJsonValue,
      coverPath: savedCover?.key ?? null, coverMime: savedCover ? 'image/png' : null,
    };
    const ids: string[] = [];
    const libro = await this.prisma.resource.create({
      data: { ...base, type: 'BOOK', format: 'EPUB', filePath: savedEpub.key, fileMime: 'application/epub+zip', fileSha256: savedEpub.sha256, fileSizeBytes: savedEpub.sizeBytes },
    });
    ids.push(libro.id);
    if (r.audioPath) {
      // Copia propia del MP3: el recurso vive independiente del registro del taller.
      const savedMp3 = await this.storage.save('files', 'mp3', await this.storage.createReadStream(r.audioPath));
      const audio = await this.prisma.resource.create({
        data: {
          ...base, type: 'AUDIOBOOK', format: 'MP3', filePath: savedMp3.key, fileMime: 'audio/mpeg', fileSha256: savedMp3.sha256, fileSizeBytes: savedMp3.sizeBytes,
          durationSeconds: r.audioDuration, narrator: 'Voz sintética Piper es_ES-davefx-medium (datos CC0)',
          extra: { ...extra, relatedTitle: r.titulo, relatedCreator: creator } as unknown as Prisma.InputJsonValue,
        },
      });
      ids.push(audio.id);
    }
    const upd = await this.prisma.generatedStory.update({
      where: { id }, data: { status: 'APPROVED', reviewNote: nota, reviewedBy: actorId, reviewedAt: new Date(), resourceIds: ids },
    });
    await this.audit.log(actorId, 'CUENTO_REVIEW', 'GeneratedStory', id, { decision: 'APROBAR', nota, modo: r.modo, band: r.band, resourceIds: ids, epubSha256: savedEpub.sha256, cover: !!savedCover, audio: !!r.audioPath });
    for (const rid of ids) await this.audit.log(actorId, 'RESOURCE_CREATE', 'Resource', rid, { title: r.titulo, type: rid === libro.id ? 'BOOK' : 'AUDIOBOOK', cuentoId: r.id });
    return this.toAdminDTO(upd);
  }

  /** PNG 600×900 de la portada con sharp (SVG del contrato, sin emoji). Si falla, el recurso queda sin portada. */
  private async renderCover(r: GeneratedStory): Promise<Buffer | null> {
    try {
      const svg = cuentoCoverSvg({ titulo: r.titulo, autorNombre: r.autorNombre, lugar: r.lugar as never, tipo: r.tipo as never, conEmoji: false });
      const sharp = (await import('sharp')).default;
      return await sharp(Buffer.from(svg), { density: 96 }).png().toBuffer();
    } catch (e) {
      this.log.warn(`No se pudo generar la portada del cuento ${r.id}: ${(e as Error)?.message ?? e}`);
      return null;
    }
  }

  /* ───────────── utilidades ───────────── */

  private async find(id: string): Promise<GeneratedStory> {
    const r = id.length <= 64 ? await this.prisma.generatedStory.findUnique({ where: { id } }) : null;
    if (!r) throw new NotFoundException('Cuento no encontrado');
    return r;
  }

  private toDTO(r: GeneratedStory): CuentoDTO {
    const contenido = r.contenido ? CuentoGeneradoSchema.safeParse(r.contenido) : null;
    return {
      id: r.id,
      status: r.status,
      modo: r.modo as CuentoModo,
      banda: r.band as GradeBand,
      titulo: r.titulo,
      autorNombre: r.autorNombre,
      protagonista: r.protagonista,
      tipo: r.tipo as CuentoDTO['tipo'],
      lugar: r.lugar as CuentoDTO['lugar'],
      valor: r.valor as CuentoDTO['valor'],
      contenido: contenido?.success ? contenido.data : null,
      audio: {
        listo: !!r.audioPath,
        url: r.audioPath ? API_ROUTES.cuentoAudio(r.id) : null,
        durationSeconds: r.audioDuration,
        pendiente: !r.audioPath && (r.status === 'GENERATING' || r.status === 'GENERATED'),
      },
      error: r.status === 'FAILED' ? (r.error ?? MENSAJE_FALLO) : null,
      createdAt: r.createdAt.toISOString(),
    };
  }

  private toAdminDTO(r: GeneratedStory): CuentoAdminDTO {
    return {
      ...this.toDTO(r),
      reviewNote: r.reviewNote,
      reviewedBy: r.reviewedBy,
      reviewedAt: r.reviewedAt ? r.reviewedAt.toISOString() : null,
      resourceIds: Array.isArray(r.resourceIds) ? (r.resourceIds as string[]) : [],
      proveedor: r.modo === 'ia' ? { ms: r.providerMs, tokensEntrada: r.tokensIn, tokensSalida: r.tokensOut } : null,
    };
  }
}
