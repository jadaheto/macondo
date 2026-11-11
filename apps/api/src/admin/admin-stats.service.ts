import { Injectable } from '@nestjs/common';
import { type AdminStatsDTO, CAPACITY_TARGETS, CHALLENGE_TARGET, RESOURCE_STATUSES, RESOURCE_TYPE_LABELS, RESOURCE_TYPES, type ResourceStatus, type ResourceType } from '@macondo/shared';
import { PrismaService } from '../prisma/prisma.service';

/** Estadísticas SOLO agregadas (tipo en el contrato compartido). Se reexporta por compatibilidad. */
export type { AdminStatsDTO };

const zeroStatus = (): Record<ResourceStatus, number> => ({ DRAFT: 0, PUBLISHED: 0, RETIRED: 0 });

@Injectable()
export class AdminStatsService {
  constructor(private readonly prisma: PrismaService) {}

  async stats(now = new Date()): Promise<AdminStatsDTO> {
    const grouped = await this.prisma.resource.groupBy({ by: ['type', 'status'], _count: { _all: true } });
    const byStatus = zeroStatus();
    const typeMap = new Map<ResourceType, Record<ResourceStatus, number>>(RESOURCE_TYPES.map((t) => [t, zeroStatus()]));
    for (const g of grouped) {
      byStatus[g.status] += g._count._all;
      typeMap.get(g.type)![g.status] += g._count._all;
    }
    const byType = RESOURCE_TYPES.map((type) => {
      const s = typeMap.get(type)!;
      const total = RESOURCE_STATUSES.reduce((a, k) => a + s[k], 0);
      const target = CAPACITY_TARGETS[type];
      return { type, label: RESOURCE_TYPE_LABELS[type], target, total, byStatus: s, publishedProgress: target ? Math.round((s.PUBLISHED / target) * 1000) / 10 : 0 };
    });

    const gradeCoverage = await Promise.all(
      Array.from({ length: 11 }, (_, i) => i + 1).map(async (grade) => ({
        grade,
        published: await this.prisma.resource.count({ where: { status: 'PUBLISHED', gradeMin: { lte: grade }, gradeMax: { gte: grade } } }),
      })),
    );

    const activeLicense = {
      AND: [
        { OR: [{ licenseValidFrom: null }, { licenseValidFrom: { lte: now } }] },
        { OR: [{ licenseValidUntil: null }, { licenseValidUntil: { gte: now } }] },
      ],
    };
    const [publishedActive, offlineAllowed, withFile, bytes, opens, challengesActive, challengesTotal, cuentosPorEstado] = await Promise.all([
      this.prisma.resource.count({ where: { status: 'PUBLISHED', ...activeLicense } }),
      this.prisma.resource.count({ where: { status: 'PUBLISHED', licenseOfflineAllowed: true, licenseAuthorizedDevices: { gt: 0 }, ...activeLicense } }),
      this.prisma.resource.count({ where: { filePath: { not: null } } }),
      this.prisma.resource.aggregate({ _sum: { fileSizeBytes: true } }),
      this.prisma.readingEvent.aggregate({ _sum: { count: true }, where: { day: { gte: new Date(now.getTime() - 30 * 86400_000) } } }),
      this.prisma.challenge.count({ where: { active: true } }),
      this.prisma.challenge.count(),
      this.prisma.generatedStory.groupBy({ by: ['status'], _count: { _all: true } }),
    ]);
    const nc = (st: string) => cuentosPorEstado.find((x) => x.status === st)?._count._all ?? 0;
    const total = byStatus.DRAFT + byStatus.PUBLISHED + byStatus.RETIRED;
    return {
      generatedAt: now.toISOString(),
      totals: { resources: total, published: byStatus.PUBLISHED, capacityTarget: Object.values(CAPACITY_TARGETS).reduce((a, b) => a + b, 0) },
      byStatus,
      byType,
      gradeCoverage,
      licenses: { publishedWithActiveLicense: publishedActive, publishedWithInactiveLicense: byStatus.PUBLISHED - publishedActive, offlineAllowed },
      files: { withFile, withoutFile: total - withFile, totalBytes: bytes._sum.fileSizeBytes ?? 0 },
      usageLast30Days: { fileOpens: opens._sum.count ?? 0 },
      challenges: { active: challengesActive, total: challengesTotal, target: CHALLENGE_TARGET },
      cuentos: { pendientes: nc('PENDING_REVIEW'), aprobados: nc('APPROVED'), rechazados: nc('REJECTED'), total: cuentosPorEstado.reduce((a, x) => a + x._count._all, 0) },
    };
  }
}
