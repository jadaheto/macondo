import { Body, Controller, Get, HttpCode, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ChallengeActiveSchema, type ChallengeDTO, type ChallengeImport, ChallengeImportArraySchema, type ChallengeImportResult, ChallengeQuerySchema } from '@macondo/shared';
import type { z } from 'zod';
import type { AuthUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { ChallengesService } from './challenges.service';

@Controller('challenges')
export class ChallengesController {
  constructor(private readonly svc: ChallengesService) {}

  /** Público: solo retos activos; enlaza el recurso solo si está publicado. */
  @Get()
  list(@Query(new ZodValidationPipe(ChallengeQuerySchema)) q: z.infer<typeof ChallengeQuerySchema>): Promise<ChallengeDTO[]> {
    return this.svc.listPublic(q);
  }
}

@Controller('admin/challenges')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'LIBRARIAN')
export class AdminChallengesController {
  constructor(private readonly svc: ChallengesService) {}

  @Get()
  list(): Promise<ChallengeDTO[]> {
    return this.svc.listAll();
  }

  @Post('import')
  @HttpCode(200)
  import(@Body(new ZodValidationPipe(ChallengeImportArraySchema)) body: ChallengeImport[], @CurrentUser() user: AuthUser): Promise<ChallengeImportResult> {
    return this.svc.importMany(body, user.id);
  }

  @Post(':id/active')
  @HttpCode(200)
  setActive(@Param('id') id: string, @Body(new ZodValidationPipe(ChallengeActiveSchema)) body: z.infer<typeof ChallengeActiveSchema>, @CurrentUser() user: AuthUser): Promise<ChallengeDTO> {
    return this.svc.setActive(id, body.active, user.id);
  }
}
