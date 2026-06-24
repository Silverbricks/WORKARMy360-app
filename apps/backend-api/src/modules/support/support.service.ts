import { Injectable } from '@nestjs/common';
import type { SupportTicket } from '@workarmy/types';
import type { SupportTicket as DbTicket } from '@workarmy/database';
import type { SupportTicketInputData } from '@workarmy/validation';
import { PrismaService } from '../../prisma/prisma.service';
import { MembershipService } from '../../common/membership/membership.service';

@Injectable()
export class SupportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly membership: MembershipService,
  ) {}

  async create(userId: string, input: SupportTicketInputData): Promise<SupportTicket> {
    const personId = await this.membership.requirePerson(userId);
    const t = await this.prisma.supportTicket.create({
      data: { personId, category: input.category, subject: input.subject, body: input.body },
    });
    return toTicket(t);
  }

  async list(userId: string): Promise<SupportTicket[]> {
    const personId = await this.membership.requirePerson(userId);
    const rows = await this.prisma.supportTicket.findMany({
      where: { personId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(toTicket);
  }
}

function toTicket(t: DbTicket): SupportTicket {
  return {
    id: t.id,
    category: t.category,
    subject: t.subject,
    body: t.body,
    status: t.status,
    response: t.response,
    createdAt: t.createdAt.toISOString(),
  };
}
