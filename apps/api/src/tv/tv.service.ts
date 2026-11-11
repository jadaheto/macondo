import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { TvSlideDTO, TvSlideInput } from '@macondo/shared';
import type { Resource, TvSlide } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type SlideWithResource = TvSlide & { resource: Resource | null };

export function toTvSlideDTO(s: SlideWithResource, publicView: boolean): TvSlideDTO {
  const showResource = s.resource && (!publicView || s.resource.status === 'PUBLISHED');
  return {
    id: s.id,
    kind: s.kind,
    title: s.title,
    body: s.body,
    resourceId: s.resourceId,
    order: s.order,
    durationSeconds: s.durationSeconds,
    startsAt: s.startsAt ? s.startsAt.toISOString() : null,
    endsAt: s.endsAt ? s.endsAt.toISOString() : null,
    active: s.active,
    resource: showResource && s.resource
      ? { id: s.resource.id, title: s.resource.title, creator: s.resource.creator, type: s.resource.type, hasCover: !!s.resource.coverPath, description: s.resource.description }
      : null,
  };
}

@Injectable()
export class TvService {
  constructor(private readonly prisma: PrismaService) {}

  async schedule(now = new Date()): Promise<TvSlideDTO[]> {
    const rows = await this.prisma.tvSlide.findMany({
      where: {
        active: true,
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
          { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
        ],
      },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
      include: { resource: true },
    });
    return rows.map((r) => toTvSlideDTO(r, true));
  }

  async listAll(): Promise<TvSlideDTO[]> {
    const rows = await this.prisma.tvSlide.findMany({ orderBy: [{ order: 'asc' }, { createdAt: 'asc' }], include: { resource: true } });
    return rows.map((r) => toTvSlideDTO(r, false));
  }

  async get(id: string): Promise<SlideWithResource> {
    const s = id.length <= 64 ? await this.prisma.tvSlide.findUnique({ where: { id }, include: { resource: true } }) : null;
    if (!s) throw new NotFoundException('Diapositiva no encontrada');
    return s;
  }

  private async check(data: Partial<TvSlideInput>, current?: TvSlide): Promise<void> {
    if (data.resourceId) {
      const exists = await this.prisma.resource.findUnique({ where: { id: data.resourceId }, select: { id: true } });
      if (!exists) throw new BadRequestException('El recurso asociado no existe');
    }
    const starts = data.startsAt !== undefined ? data.startsAt : current?.startsAt?.toISOString() ?? null;
    const ends = data.endsAt !== undefined ? data.endsAt : current?.endsAt?.toISOString() ?? null;
    if (starts && ends && new Date(starts) > new Date(ends)) {
      throw new BadRequestException('La fecha de inicio debe ser anterior a la fecha de fin');
    }
  }

  private toColumns(d: Partial<TvSlideInput>) {
    return {
      ...(d.kind !== undefined && { kind: d.kind }),
      ...(d.title !== undefined && { title: d.title }),
      ...(d.body !== undefined && { body: d.body }),
      ...(d.resourceId !== undefined && { resourceId: d.resourceId ?? null }),
      ...(d.order !== undefined && { order: d.order }),
      ...(d.durationSeconds !== undefined && { durationSeconds: d.durationSeconds }),
      ...(d.startsAt !== undefined && { startsAt: d.startsAt ? new Date(d.startsAt) : null }),
      ...(d.endsAt !== undefined && { endsAt: d.endsAt ? new Date(d.endsAt) : null }),
      ...(d.active !== undefined && { active: d.active }),
    };
  }

  async create(input: TvSlideInput): Promise<TvSlideDTO> {
    await this.check(input);
    const s = await this.prisma.tvSlide.create({
      data: { ...this.toColumns(input), kind: input.kind, title: input.title },
      include: { resource: true },
    });
    return toTvSlideDTO(s, false);
  }

  async update(id: string, patch: Partial<TvSlideInput>): Promise<TvSlideDTO> {
    const current = await this.get(id);
    await this.check(patch, current);
    const s = await this.prisma.tvSlide.update({ where: { id }, data: this.toColumns(patch), include: { resource: true } });
    return toTvSlideDTO(s, false);
  }

  async remove(id: string): Promise<void> {
    await this.get(id);
    await this.prisma.tvSlide.delete({ where: { id } });
  }
}
