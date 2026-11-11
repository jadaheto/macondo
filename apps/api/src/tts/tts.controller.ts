import { Controller, Get, UseGuards } from '@nestjs/common';
import type { TtsStatus } from '@macondo/shared';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { TtsService } from './tts.service';

/** Estado del motor de narración para el panel (`GET /api/admin/tts/estado`). */
@Controller('admin/tts')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'LIBRARIAN')
export class TtsController {
  constructor(private readonly tts: TtsService) {}

  @Get('estado')
  estado(): Promise<TtsStatus> {
    return this.tts.status();
  }
}
