import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query, Req, Res, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { NotFoundException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { type NarrateInput, NarrateInputSchema, type Paginated, type ResourceDTO, type ResourceInput, ResourceInputSchema } from '@macondo/shared';
import type { Request, Response } from 'express';
import type { z } from 'zod';
import type { AuthUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { toResourceDTO } from '../catalog/resource.mapper';
import { sendCover } from '../catalog/catalog.controller';
import { FileStreamerService } from '../catalog/file-streamer.service';
import { ThumbnailService } from '../catalog/thumbnail.service';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { type AdminResourceQuery, AdminResourceQuerySchema, type ResourcePatch, ResourcePatchSchema, StatusChangeSchema } from './admin-schemas';
import { AdminResourcesService } from './admin-resources.service';

@Controller('admin/resources')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'LIBRARIAN')
export class AdminResourcesController {
  constructor(private readonly svc: AdminResourcesService, private readonly streamer: FileStreamerService, private readonly thumbs: ThumbnailService) {}

  @Get()
  list(@Query(new ZodValidationPipe(AdminResourceQuerySchema)) q: AdminResourceQuery): Promise<Paginated<ResourceDTO>> {
    return this.svc.list(q);
  }

  @Post()
  create(@Body(new ZodValidationPipe(ResourceInputSchema)) body: ResourceInput, @CurrentUser() user: AuthUser): Promise<ResourceDTO> {
    return this.svc.create(body, user.id);
  }

  @Get(':id')
  async get(@Param('id') id: string): Promise<ResourceDTO> {
    return toResourceDTO(await this.svc.find(id));
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body(new ZodValidationPipe(ResourcePatchSchema)) body: ResourcePatch, @CurrentUser() user: AuthUser): Promise<ResourceDTO> {
    return this.svc.update(id, body, user.id);
  }

  /** Retirar: nunca se borra la fila. */
  @Delete(':id')
  retire(@Param('id') id: string, @CurrentUser() user: AuthUser): Promise<ResourceDTO> {
    return this.svc.setStatus(id, 'RETIRED', user.id, 'RESOURCE_RETIRE');
  }

  @Post(':id/status')
  @HttpCode(200)
  status(@Param('id') id: string, @Body(new ZodValidationPipe(StatusChangeSchema)) body: z.infer<typeof StatusChangeSchema>, @CurrentUser() user: AuthUser): Promise<ResourceDTO> {
    return this.svc.setStatus(id, body.status, user.id);
  }

  @Post(':id/file')
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(@Param('id') id: string, @UploadedFile() file: Express.Multer.File | undefined, @CurrentUser() user: AuthUser): Promise<ResourceDTO> {
    return this.svc.attachUpload(id, 'file', file, user.id);
  }

  @Post(':id/cover')
  @UseInterceptors(FileInterceptor('file'))
  uploadCover(@Param('id') id: string, @UploadedFile() file: Express.Multer.File | undefined, @CurrentUser() user: AuthUser): Promise<ResourceDTO> {
    return this.svc.attachUpload(id, 'cover', file, user.id);
  }

  /** Regraba el recurso con la voz de la biblioteca (Piper en el servidor; ADR-017). 503 si el motor no está instalado. */
  @Post(':id/narrar')
  @HttpCode(200)
  narrate(@Param('id') id: string, @Body(new ZodValidationPipe(NarrateInputSchema)) body: NarrateInput, @CurrentUser() user: AuthUser): Promise<ResourceDTO> {
    return this.svc.narrate(id, body, user.id);
  }

  /** Vista previa para el panel (cualquier estado/licencia). Requiere token. */
  @Get(':id/file')
  async previewFile(@Param('id') id: string, @Req() req: Request, @Res() res: Response): Promise<void> {
    const r = await this.svc.find(id);
    if (!r.filePath) throw new NotFoundException('Este recurso no tiene archivo');
    await this.streamer.send(req, res, { key: r.filePath, mime: r.fileMime ?? 'application/octet-stream', filename: `recurso-${r.id}`, etag: r.fileSha256 });
  }

  /** Vista previa de portada (cualquier estado). Admite `?w=240|480` como la ruta pública. */
  @Get(':id/cover')
  async previewCover(@Param('id') id: string, @Req() req: Request, @Res() res: Response): Promise<void> {
    const r = await this.svc.find(id);
    if (!r.coverPath) throw new NotFoundException('Este recurso no tiene portada');
    await sendCover({ streamer: this.streamer, thumbs: this.thumbs }, req, res, { id: r.id, coverPath: r.coverPath, coverMime: r.coverMime });
  }
}
