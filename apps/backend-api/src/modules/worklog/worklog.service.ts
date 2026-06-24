import { Injectable } from '@nestjs/common';
import type { WorkLog } from '@workarmy/types';
import type { WorkLogInputData } from '@workarmy/validation';
import { PrismaService } from '../../prisma/prisma.service';
import { MembershipService } from '../../common/membership/membership.service';
import { ApiException } from '../../common/errors/api-exception';

@Injectable()
export class WorkLogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly membership: MembershipService,
  ) {}

  async list(userId: string): Promise<WorkLog[]> {
    const personId = await this.membership.requirePerson(userId);
    const rows = await this.prisma.workLog.findMany({
      where: { personId },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      take: 200,
    });
    return rows.map(toWorkLog);
  }

  async create(userId: string, input: WorkLogInputData): Promise<WorkLog> {
    const personId = await this.membership.requirePerson(userId);
    const row = await this.prisma.workLog.create({
      data: {
        personId,
        employer: input.employer,
        date: input.date,
        hours: input.hours,
        note: input.note || null,
      },
    });
    return toWorkLog(row);
  }

  async remove(userId: string, id: string): Promise<{ ok: true }> {
    const personId = await this.membership.requirePerson(userId);
    const existing = await this.prisma.workLog.findFirst({ where: { id, personId } });
    if (!existing) throw ApiException.notFound('Timesheet entry not found.');
    await this.prisma.workLog.delete({ where: { id } });
    return { ok: true as const };
  }
}

function toWorkLog(r: {
  id: string;
  employer: string;
  date: string;
  hours: number;
  note: string | null;
  createdAt: Date;
}): WorkLog {
  return {
    id: r.id,
    employer: r.employer,
    date: r.date,
    hours: r.hours,
    note: r.note,
    createdAt: r.createdAt.toISOString(),
  };
}
