import { Injectable } from '@nestjs/common';
import type { Payslip } from '@workarmy/types';
import type { Payslip as DbPayslip } from '@workarmy/database';
import type { PayslipInputData } from '@workarmy/validation';
import { PrismaService } from '../../prisma/prisma.service';
import { MembershipService } from '../../common/membership/membership.service';
import { ApiException } from '../../common/errors/api-exception';

const personName = (p: { firstName: string | null; lastName: string | null; waId: string }): string =>
  `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim() || p.waId;

@Injectable()
export class PayslipsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly membership: MembershipService,
  ) {}

  async mine(userId: string): Promise<Payslip[]> {
    const personId = await this.membership.requirePerson(userId);
    const rows = await this.prisma.payslip.findMany({
      where: { personId },
      orderBy: { createdAt: 'desc' },
      include: { organisation: true },
    });
    return rows.map((p) => ({ ...toPayslip(p), org: { name: p.organisation.name } }));
  }

  async forOrg(userId: string): Promise<Payslip[]> {
    const { orgId } = await this.membership.requireOrg(userId);
    const rows = await this.prisma.payslip.findMany({
      where: { orgId },
      orderBy: { createdAt: 'desc' },
      include: { person: true },
    });
    return rows.map((p) => ({
      ...toPayslip(p),
      person: { waId: p.person.waId, name: personName(p.person) },
    }));
  }

  async issue(userId: string, input: PayslipInputData): Promise<Payslip> {
    const { orgId } = await this.membership.requireOrg(userId);
    const person = await this.prisma.person.findUnique({ where: { waId: input.personWaId } });
    if (!person) throw ApiException.badRequest('VALIDATION_ERROR', 'No worker with that WA ID.');
    const p = await this.prisma.payslip.create({
      data: {
        personId: person.id,
        orgId,
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
        hours: input.hours ?? 0,
        grossPay: input.grossPay ?? 0,
        tax: input.tax ?? 0,
        superannuation: input.superannuation ?? 0,
        netPay: input.netPay ?? 0,
      },
      include: { organisation: true },
    });
    return { ...toPayslip(p), org: { name: p.organisation.name } };
  }
}

function toPayslip(p: DbPayslip): Payslip {
  return {
    id: p.id,
    periodStart: p.periodStart,
    periodEnd: p.periodEnd,
    hours: p.hours,
    grossPay: p.grossPay,
    tax: p.tax,
    superannuation: p.superannuation,
    netPay: p.netPay,
    documentId: p.documentId,
    createdAt: p.createdAt.toISOString(),
  };
}
