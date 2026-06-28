import { Injectable } from '@nestjs/common';
import type {
  ProviderDirectoryOrg,
  ProviderEngagement,
  QuoteRequest,
  ReportSummary,
} from '@workarmy/types';
import type { ProviderEngagementInputData, QuoteRequestInputData } from '@workarmy/validation';
import { PrismaService } from '../../prisma/prisma.service';
import { MembershipService } from '../../common/membership/membership.service';
import { ApiException } from '../../common/errors/api-exception';

@Injectable()
export class NetworkService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly membership: MembershipService,
  ) {}

  async directory(userId: string): Promise<ProviderDirectoryOrg[]> {
    const { orgId } = await this.membership.requireOrg(userId);
    const orgs = await this.prisma.organisation.findMany({
      where: {
        verificationStatus: 'APPROVED',
        // Only engageable service providers — not other employers/farms (clients).
        accountType: { in: ['CONTRACTOR', 'LABOUR_HIRE', 'RECRUITMENT_AGENCY'] },
        NOT: { id: orgId },
      },
      include: { profile: { select: { industry: true, region: true } } },
      take: 100,
      orderBy: { createdAt: 'desc' },
    });
    return orgs.map((o) => ({
      waId: o.waId,
      name: o.name,
      accountType: o.accountType,
      industry: o.profile?.industry ?? null,
      region: o.profile?.region ?? null,
    }));
  }

  async listEngagements(userId: string): Promise<ProviderEngagement[]> {
    const { orgId } = await this.membership.requireOrg(userId);
    const rows = await this.prisma.providerEngagement.findMany({ where: { orgId }, orderBy: { createdAt: 'desc' } });
    return rows.map(toEngagement);
  }

  async createEngagement(userId: string, input: ProviderEngagementInputData): Promise<ProviderEngagement> {
    const { orgId } = await this.membership.requireOrg(userId);
    const row = await this.prisma.providerEngagement.create({
      data: {
        orgId,
        providerName: input.providerName,
        providerOrgId: input.providerOrgId ?? null,
        kind: input.kind?.trim() || null,
        category: input.category?.trim() || null,
        location: input.location?.trim() || null,
      },
    });
    return toEngagement(row);
  }

  async toggleEngagement(userId: string, id: string): Promise<ProviderEngagement> {
    const { orgId } = await this.membership.requireOrg(userId);
    const existing = await this.prisma.providerEngagement.findFirst({ where: { id, orgId } });
    if (!existing) throw ApiException.notFound('Engagement not found.');
    const row = await this.prisma.providerEngagement.update({
      where: { id },
      data: { status: existing.status === 'ENGAGED' ? 'ENDED' : 'ENGAGED' },
    });
    return toEngagement(row);
  }

  async removeEngagement(userId: string, id: string): Promise<{ ok: true }> {
    const { orgId } = await this.membership.requireOrg(userId);
    await this.prisma.providerEngagement.deleteMany({ where: { id, orgId } });
    return { ok: true as const };
  }

  async listQuotes(userId: string): Promise<QuoteRequest[]> {
    const { orgId } = await this.membership.requireOrg(userId);
    const rows = await this.prisma.quoteRequest.findMany({ where: { orgId }, orderBy: { createdAt: 'desc' } });
    return rows.map(toQuote);
  }

  async createQuote(userId: string, input: QuoteRequestInputData): Promise<QuoteRequest> {
    const { orgId } = await this.membership.requireOrg(userId);
    const row = await this.prisma.quoteRequest.create({
      data: { orgId, toLabel: input.toLabel, scope: input.scope, details: input.details?.trim() || null },
    });
    return toQuote(row);
  }

  async reports(userId: string): Promise<ReportSummary> {
    const { orgId } = await this.membership.requireOrg(userId);
    const [payroll, hours, positions, filled, rating, openRoles, activeWorkers] = await Promise.all([
      this.prisma.payslip.aggregate({ where: { orgId }, _sum: { grossPay: true } }),
      this.prisma.timesheet.aggregate({ where: { orgId }, _sum: { totalHours: true } }),
      // Fill rate measured on open shifts only — roster shifts have positions=1 but
      // many assignments, which would skew the ratio.
      this.prisma.shift.aggregate({ where: { orgId, isRoster: false }, _sum: { positions: true } }),
      this.prisma.shiftAssignment.count({ where: { shift: { orgId, isRoster: false }, status: { in: ['CONFIRMED', 'ACCEPTED', 'COMPLETED'] } } }),
      this.prisma.performanceReview.aggregate({ where: { orgId }, _avg: { rating: true } }),
      this.prisma.job.count({ where: { orgId, status: 'PUBLISHED' } }),
      this.prisma.orgWorker.count({ where: { orgId, active: true } }),
    ]);
    const totalPositions = positions._sum.positions ?? 0;
    return {
      payrollTotal: payroll._sum.grossPay ?? 0,
      hoursTotal: hours._sum.totalHours ?? 0,
      fillRatePct: totalPositions > 0 ? Math.min(100, Math.round((filled / totalPositions) * 100)) : 0,
      workerRating: rating._avg.rating ? Math.round(rating._avg.rating * 10) / 10 : 0,
      openRoles,
      activeWorkers,
    };
  }
}

function toEngagement(r: { id: string; providerName: string; providerOrgId: string | null; kind: string | null; category: string | null; location: string | null; status: ProviderEngagement['status'] }): ProviderEngagement {
  return { id: r.id, providerName: r.providerName, providerOrgId: r.providerOrgId, kind: r.kind, category: r.category, location: r.location, status: r.status };
}
function toQuote(r: { id: string; toLabel: string; scope: string; details: string | null; amountCents: number | null; status: QuoteRequest['status']; createdAt: Date }): QuoteRequest {
  return { id: r.id, toLabel: r.toLabel, scope: r.scope, details: r.details, amountCents: r.amountCents, status: r.status, createdAt: r.createdAt.toISOString() };
}
