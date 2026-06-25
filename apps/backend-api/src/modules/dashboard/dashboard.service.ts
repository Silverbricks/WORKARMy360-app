import { Injectable } from '@nestjs/common';
import type { DashboardSummary } from '@workarmy/types';
import { PrismaService } from '../../prisma/prisma.service';
import { MembershipService } from '../../common/membership/membership.service';

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly membership: MembershipService,
  ) {}

  /** Aggregated counts for the Business dashboard overview (one round trip). */
  async summary(userId: string): Promise<DashboardSummary> {
    const { orgId } = await this.membership.requireOrg(userId);
    const now = new Date();
    const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const [openRoles, draftJobs, newApplicants, pendingTimesheets, expiringCredentials, profile, org, workers] =
      await Promise.all([
        this.prisma.job.count({ where: { orgId, status: 'PUBLISHED' } }),
        this.prisma.job.count({ where: { orgId, status: 'DRAFT' } }),
        this.prisma.jobApplication.count({ where: { stage: 'APPLIED', job: { orgId } } }),
        this.prisma.timesheet.count({ where: { orgId, status: 'SUBMITTED' } }),
        this.prisma.credential.count({ where: { orgId, expiresAt: { gte: now, lte: in30 } } }),
        this.prisma.orgProfile.findUnique({ where: { orgId }, select: { completeness: true } }),
        this.prisma.organisation.findUnique({ where: { id: orgId }, select: { verificationStatus: true } }),
        this.prisma.shiftAssignment.findMany({
          where: { shift: { orgId }, status: { in: ['CONFIRMED', 'COMPLETED'] } },
          select: { personId: true },
          distinct: ['personId'],
        }),
      ]);

    return {
      verificationStatus: org?.verificationStatus ?? 'PENDING',
      profileCompleteness: profile?.completeness ?? 0,
      openRoles,
      draftJobs,
      activeWorkers: workers.length,
      newApplicants,
      pendingTimesheets,
      expiringCredentials,
    };
  }
}
