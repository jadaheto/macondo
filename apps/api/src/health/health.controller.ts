import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async health(@Res({ passthrough: true }) res: Response) {
    let db: 'ok' | 'error' = 'ok';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      db = 'error';
    }
    if (db !== 'ok') res.status(503);
    return { status: db === 'ok' ? 'ok' : 'degraded', db, time: new Date().toISOString(), service: 'macondo-api' };
  }
}
