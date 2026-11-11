import { Injectable, NotFoundException } from '@nestjs/common';
import type { ChallengeDTO, ChallengeImport, ChallengeImportResult, GradeBand } from '@macondo/shared';
import { Prisma, type Challenge, type Resource } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';

type ChallengeWithResource = Challenge & { resource: Pick<Resource, 'id' | 'title' | 'creator' | 'type' | 'status'> | null };
const RESOURCE_SELECT = { select: { id: true, title: true, creator: true, type: true, status: true } } as const;

function payloadOf(c: ChallengeImport): Prisma.InputJsonValue {
  const p = c.kind === 'trivia' ? { questions: c.questions } : c.kind === 'sequence' ? { steps: c.steps } : { pairs: c.pairs };
  return JSON.parse(JSON.stringify(p)) as Prisma.InputJsonValue;
}

/** Convierte la fila a DTO. `publicOnly`: solo enlaza recursos PUBLICADOS. */
export function toChallengeDTO(c: ChallengeWithResource, publicOnly = true): ChallengeDTO {
  const payload = (c.payload ?? {}) as Record<string, unknown>;
  const res = c.resource && (!publicOnly || c.resource.status === 'PUBLISHED')
    ? { id: c.resource.id, title: c.resource.title, creator: c.resource.creator, type: c.resource.type }
    : null;
  const base = { id: c.id, title: c.title, source: c.source, bands: c.bands as GradeBand[], text: c.text, resource: res, active: c.active };
  if (c.kind === 'trivia') return { ...base, kind: 'trivia', questions: (payload.questions as never) ?? [] };
  if (c.kind === 'sequence') return { ...base, kind: 'sequence', steps: (payload.steps as never) ?? [] };
  return { ...base, kind: 'match', pairs: (payload.pairs as never) ?? [] };
}

@Injectable()
export class ChallengesService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  async listPublic(q: { band?: GradeBand; resourceId?: string }): Promise<ChallengeDTO[]> {
    const rows = await this.prisma.challenge.findMany({
      where: { active: true, ...(q.band && { bands: { has: q.band } }), ...(q.resourceId && { resourceId: q.resourceId }) },
      include: { resource: RESOURCE_SELECT },
      orderBy: [{ title: 'asc' }, { id: 'asc' }],
    });
    return rows.map((r) => toChallengeDTO(r, true));
  }

  async listAll(): Promise<ChallengeDTO[]> {
    const rows = await this.prisma.challenge.findMany({ include: { resource: RESOURCE_SELECT }, orderBy: [{ updatedAt: 'desc' }, { id: 'asc' }] });
    return rows.map((r) => toChallengeDTO(r, false));
  }

  /** Resuelve el recurso por título + autor exactos (prefiere publicados; ignora retirados). */
  private async resolveResource(ref: ChallengeImport['resource']): Promise<string | null> {
    if (!ref) return null;
    const found = await this.prisma.resource.findMany({
      where: { title: ref.title, creator: ref.creator, status: { not: 'RETIRED' } },
      select: { id: true, status: true },
      orderBy: { createdAt: 'asc' },
    });
    return (found.find((r) => r.status === 'PUBLISHED') ?? found[0])?.id ?? null;
  }

  /** Importación idempotente por id (slug): crea o actualiza; conserva `active`. */
  async importMany(items: ChallengeImport[], actorId: string): Promise<ChallengeImportResult> {
    const result: ChallengeImportResult = { created: 0, updated: 0, unresolved: [], total: items.length };
    const ids = new Set<string>();
    for (const c of items) {
      if (ids.has(c.id)) continue; // duplicados en el mismo lote: gana el primero
      ids.add(c.id);
      const resourceId = await this.resolveResource(c.resource);
      if (c.resource && !resourceId) result.unresolved.push(c.id);
      const data = {
        kind: c.kind, title: c.title, source: c.source, bands: c.bands, text: c.text, payload: payloadOf(c),
        resourceTitle: c.resource?.title ?? null, resourceCreator: c.resource?.creator ?? null, resourceId,
      };
      const existing = await this.prisma.challenge.findUnique({ where: { id: c.id }, select: { id: true } });
      if (existing) {
        await this.prisma.challenge.update({ where: { id: c.id }, data });
        result.updated++;
      } else {
        await this.prisma.challenge.create({ data: { id: c.id, ...data } });
        result.created++;
      }
    }
    await this.audit.log(actorId, 'CHALLENGE_IMPORT', 'Challenge', null, { ...result, ids: [...ids].slice(0, 200) });
    return result;
  }

  async setActive(id: string, active: boolean, actorId: string): Promise<ChallengeDTO> {
    const current = id.length <= 80 ? await this.prisma.challenge.findUnique({ where: { id } }) : null;
    if (!current) throw new NotFoundException('Reto no encontrado');
    const r = await this.prisma.challenge.update({ where: { id }, data: { active }, include: { resource: RESOURCE_SELECT } });
    await this.audit.log(actorId, 'CHALLENGE_TOGGLE', 'Challenge', id, { from: current.active, to: active });
    return toChallengeDTO(r, false);
  }
}
