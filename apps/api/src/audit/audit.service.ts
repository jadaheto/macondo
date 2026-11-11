import { Injectable } from '@nestjs/common';
import type { AuditEntryDTO } from '@macondo/shared';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(actorId: string | null, action: string, entity: string, entityId: string | null, details?: unknown): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        actorId,
        action,
        entity,
        entityId,
        details: details === undefined ? Prisma.JsonNull : (JSON.parse(JSON.stringify(details)) as Prisma.InputJsonValue),
      },
    });
  }

  async latest(limit: number): Promise<AuditEntryDTO[]> {
    const rows = await this.prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { actor: { select: { id: true, email: true, name: true, role: true } } },
    });
    return rows.map((r) => ({
      id: r.id,
      action: r.action,
      entity: r.entity,
      entityId: r.entityId,
      details: r.details,
      createdAt: r.createdAt.toISOString(),
      actor: r.actor,
    }));
  }
}
