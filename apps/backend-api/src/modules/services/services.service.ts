import { Injectable } from '@nestjs/common';
import type { ServiceCategory, ServiceListing } from '@workarmy/types';
import type { ServiceListingInputData } from '@workarmy/validation';
import { PrismaService } from '../../prisma/prisma.service';
import { MembershipService } from '../../common/membership/membership.service';
import { ApiException } from '../../common/errors/api-exception';

@Injectable()
export class ServicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly membership: MembershipService,
  ) {}

  async list(userId: string, category?: ServiceCategory): Promise<ServiceListing[]> {
    const personId = await this.membership.requirePerson(userId);
    const rows = await this.prisma.serviceListing.findMany({
      where: { ...(category ? { category } : {}) },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { person: true },
    });
    return rows.map((r) => ({
      id: r.id,
      category: r.category,
      kind: r.kind,
      title: r.title,
      details: r.details,
      location: r.location,
      createdAt: r.createdAt.toISOString(),
      mine: r.personId === personId,
      by: `${r.person.firstName ?? ''} ${(r.person.lastName ?? '').slice(0, 1)}`.trim() || r.person.waId,
    }));
  }

  async create(userId: string, input: ServiceListingInputData): Promise<ServiceListing> {
    const personId = await this.membership.requirePerson(userId);
    const r = await this.prisma.serviceListing.create({
      data: {
        personId,
        category: input.category,
        kind: input.kind,
        title: input.title,
        details: input.details || null,
        location: input.location || null,
      },
      include: { person: true },
    });
    return {
      id: r.id,
      category: r.category,
      kind: r.kind,
      title: r.title,
      details: r.details,
      location: r.location,
      createdAt: r.createdAt.toISOString(),
      mine: true,
      by: `${r.person.firstName ?? ''} ${(r.person.lastName ?? '').slice(0, 1)}`.trim() || r.person.waId,
    };
  }

  async remove(userId: string, id: string): Promise<{ ok: true }> {
    const personId = await this.membership.requirePerson(userId);
    const existing = await this.prisma.serviceListing.findFirst({ where: { id, personId } });
    if (!existing) throw ApiException.notFound('Listing not found.');
    await this.prisma.serviceListing.delete({ where: { id } });
    return { ok: true as const };
  }
}
