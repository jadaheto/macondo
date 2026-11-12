import { Body, Controller, Get, HttpCode, Param, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { type CuentoAdminDTO, CuentoAdminQuerySchema, type CuentoCreadoDTO, type CuentoDTO, CuentoImagenSchema, CuentoOpcionesSchema, CuentoRevisarSchema, type CuentosDisponibleDTO } from '@macondo/shared';
import type { Request, Response } from 'express';
import type { z } from 'zod';
import type { AuthUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { FileStreamerService } from '../catalog/file-streamer.service';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { CuentosService } from './cuentos.service';

/** Público (estudiantes, sin cuenta): disponibilidad, crear trabajo, consultar estado y audio. */
@Controller('cuentos')
export class CuentosController {
  constructor(private readonly svc: CuentosService, private readonly streamer: FileStreamerService) {}

  @Get('disponible')
  disponible(): CuentosDisponibleDTO {
    return this.svc.disponible();
  }

  @Post()
  @HttpCode(202)
  crear(@Body(new ZodValidationPipe(CuentoOpcionesSchema)) body: z.infer<typeof CuentoOpcionesSchema>): Promise<CuentoCreadoDTO> {
    return this.svc.crear(body);
  }

  @Get(':id')
  obtener(@Param('id') id: string): Promise<CuentoDTO> {
    return this.svc.obtener(id);
  }

  @Get(':id/audio')
  async audio(@Param('id') id: string, @Req() req: Request, @Res() res: Response): Promise<void> {
    const a = await this.svc.audioKey(id);
    await this.streamer.send(req, res, { key: a.key, mime: 'audio/mpeg', filename: `cuento-${id}.mp3`, etag: a.sha });
  }

  /** Ilustración (ADR-020): 404 mientras se dibuja, si falló o si la bibliotecaria la ocultó. */
  @Get(':id/imagen')
  async imagen(@Param('id') id: string, @Req() req: Request, @Res() res: Response): Promise<void> {
    const im = await this.svc.imagenKey(id, false);
    await this.streamer.send(req, res, { key: im.key, mime: 'image/jpeg', filename: `cuento-${id}.jpg`, etag: im.sha });
  }
}

/** Panel (ADMIN y LIBRARIAN): cola de revisión, detalle y decisión (auditada). */
@Controller('admin/cuentos')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'LIBRARIAN')
export class AdminCuentosController {
  constructor(private readonly svc: CuentosService, private readonly streamer: FileStreamerService) {}

  /** Vista previa de la ilustración para el panel (también si está oculta). */
  @Get(':id/imagen')
  async imagen(@Param('id') id: string, @Req() req: Request, @Res() res: Response): Promise<void> {
    const im = await this.svc.imagenKey(id, true);
    await this.streamer.send(req, res, { key: im.key, mime: 'image/jpeg', filename: `cuento-${id}.jpg`, etag: im.sha });
  }

  /** Oculta o vuelve a mostrar la ilustración (auditado). Al aprobar, una ilustración oculta no se usa como portada. */
  @Post(':id/imagen')
  @HttpCode(200)
  imagenOcultar(@Param('id') id: string, @Body(new ZodValidationPipe(CuentoImagenSchema)) body: z.infer<typeof CuentoImagenSchema>, @CurrentUser() user: AuthUser): Promise<CuentoAdminDTO> {
    return this.svc.ocultarImagen(id, body.oculta, user.id);
  }

  @Get()
  listar(@Query(new ZodValidationPipe(CuentoAdminQuerySchema)) q: z.infer<typeof CuentoAdminQuerySchema>): Promise<CuentoAdminDTO[]> {
    return this.svc.listar(q.status);
  }

  @Get(':id')
  obtener(@Param('id') id: string): Promise<CuentoAdminDTO> {
    return this.svc.obtenerAdmin(id);
  }

  @Post(':id/revisar')
  @HttpCode(200)
  revisar(@Param('id') id: string, @Body(new ZodValidationPipe(CuentoRevisarSchema)) body: z.infer<typeof CuentoRevisarSchema>, @CurrentUser() user: AuthUser): Promise<CuentoAdminDTO> {
    return this.svc.revisar(id, body, user.id);
  }
}
