import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { type TvSlideDTO, type TvSlideInput, TvSlideInputSchema } from '@macondo/shared';
import type { z } from 'zod';
import { AuditService } from '../audit/audit.service';
import type { AuthUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { TvService } from '../tv/tv.service';
import { TvSlidePatchSchema } from './admin-schemas';

@Controller('admin/tv/slides')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'LIBRARIAN')
export class AdminTvController {
  constructor(private readonly tv: TvService, private readonly audit: AuditService) {}

  @Get()
  list(): Promise<TvSlideDTO[]> {
    return this.tv.listAll();
  }

  @Post()
  async create(@Body(new ZodValidationPipe(TvSlideInputSchema)) body: TvSlideInput, @CurrentUser() user: AuthUser): Promise<TvSlideDTO> {
    const s = await this.tv.create(body);
    await this.audit.log(user.id, 'TV_SLIDE_CREATE', 'TvSlide', s.id, { title: s.title, kind: s.kind });
    return s;
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body(new ZodValidationPipe(TvSlidePatchSchema)) body: z.infer<typeof TvSlidePatchSchema>, @CurrentUser() user: AuthUser): Promise<TvSlideDTO> {
    const s = await this.tv.update(id, body);
    await this.audit.log(user.id, 'TV_SLIDE_UPDATE', 'TvSlide', id, { changed: Object.keys(body) });
    return s;
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string, @CurrentUser() user: AuthUser): Promise<void> {
    const s = await this.tv.get(id);
    await this.tv.remove(id);
    await this.audit.log(user.id, 'TV_SLIDE_DELETE', 'TvSlide', id, { title: s.title });
  }
}
