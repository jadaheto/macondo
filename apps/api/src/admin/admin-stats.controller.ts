import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import type { z } from 'zod';
import { AuditService } from '../audit/audit.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { AuditQuerySchema } from './admin-schemas';
import { type AdminStatsDTO, AdminStatsService } from './admin-stats.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminStatsController {
  constructor(private readonly stats: AdminStatsService, private readonly audit: AuditService) {}

  @Get('stats')
  @Roles('ADMIN', 'LIBRARIAN')
  getStats(): Promise<AdminStatsDTO> {
    return this.stats.stats();
  }

  @Get('audit')
  @Roles('ADMIN')
  getAudit(@Query(new ZodValidationPipe(AuditQuerySchema)) q: z.infer<typeof AuditQuerySchema>) {
    return this.audit.latest(q.limit);
  }
}
