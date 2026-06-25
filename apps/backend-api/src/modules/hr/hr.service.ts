import { Injectable } from '@nestjs/common';
import type {
  HrOverview,
  LeaveRequest,
  OnboardingCase,
  PerformanceReview,
  Warning,
} from '@workarmy/types';
import type {
  LeaveInputData,
  OnboardingInputData,
  PerformanceReviewInputData,
  WarningInputData,
} from '@workarmy/validation';
import { PrismaService } from '../../prisma/prisma.service';
import { MembershipService } from '../../common/membership/membership.service';
import { ApiException } from '../../common/errors/api-exception';

const iso = (d: Date) => d.toISOString();

@Injectable()
export class HrService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly membership: MembershipService,
  ) {}

  async overview(userId: string): Promise<HrOverview> {
    const { orgId } = await this.membership.requireOrg(userId);
    const [pendingLeave, reviews, onboarding, warnings] = await Promise.all([
      this.prisma.leaveRequest.count({ where: { orgId, status: 'REQUESTED' } }),
      this.prisma.performanceReview.count({ where: { orgId } }),
      this.prisma.onboardingCase.count({ where: { orgId, status: { not: 'COMPLETE' } } }),
      this.prisma.warning.count({ where: { orgId } }),
    ]);
    return { pendingLeave, reviews, onboarding, warnings };
  }

  // ---- Leave ----
  async listLeave(userId: string): Promise<LeaveRequest[]> {
    const { orgId } = await this.membership.requireOrg(userId);
    const rows = await this.prisma.leaveRequest.findMany({ where: { orgId }, orderBy: { createdAt: 'desc' } });
    return rows.map((l) => ({
      id: l.id,
      personName: l.personName,
      type: l.type,
      startDate: l.startDate,
      endDate: l.endDate,
      reason: l.reason,
      status: l.status,
      createdAt: iso(l.createdAt),
    }));
  }
  async createLeave(userId: string, input: LeaveInputData): Promise<LeaveRequest> {
    const { orgId } = await this.membership.requireOrg(userId);
    const l = await this.prisma.leaveRequest.create({
      data: {
        orgId,
        personName: input.personName,
        type: input.type ?? 'ANNUAL',
        startDate: input.startDate,
        endDate: input.endDate,
        reason: input.reason?.trim() || null,
      },
    });
    return { id: l.id, personName: l.personName, type: l.type, startDate: l.startDate, endDate: l.endDate, reason: l.reason, status: l.status, createdAt: iso(l.createdAt) };
  }
  async decideLeave(userId: string, id: string, status: 'APPROVED' | 'DECLINED' | 'CANCELLED'): Promise<LeaveRequest> {
    const { orgId } = await this.membership.requireOrg(userId);
    const existing = await this.prisma.leaveRequest.findFirst({ where: { id, orgId }, select: { id: true } });
    if (!existing) throw ApiException.notFound('Leave request not found.');
    const l = await this.prisma.leaveRequest.update({ where: { id }, data: { status } });
    return { id: l.id, personName: l.personName, type: l.type, startDate: l.startDate, endDate: l.endDate, reason: l.reason, status: l.status, createdAt: iso(l.createdAt) };
  }

  // ---- Reviews ----
  async listReviews(userId: string): Promise<PerformanceReview[]> {
    const { orgId } = await this.membership.requireOrg(userId);
    const rows = await this.prisma.performanceReview.findMany({ where: { orgId }, orderBy: { createdAt: 'desc' } });
    return rows.map((r) => ({ id: r.id, personName: r.personName, rating: r.rating, comments: r.comments, period: r.period, createdAt: iso(r.createdAt) }));
  }
  async createReview(userId: string, input: PerformanceReviewInputData): Promise<PerformanceReview> {
    const { orgId } = await this.membership.requireOrg(userId);
    const r = await this.prisma.performanceReview.create({
      data: { orgId, personName: input.personName, rating: input.rating, comments: input.comments?.trim() || null, period: input.period?.trim() || null },
    });
    return { id: r.id, personName: r.personName, rating: r.rating, comments: r.comments, period: r.period, createdAt: iso(r.createdAt) };
  }

  // ---- Onboarding ----
  async listOnboarding(userId: string): Promise<OnboardingCase[]> {
    const { orgId } = await this.membership.requireOrg(userId);
    const rows = await this.prisma.onboardingCase.findMany({ where: { orgId }, orderBy: { createdAt: 'desc' } });
    return rows.map((o) => ({ id: o.id, personName: o.personName, kind: o.kind, step: o.step, status: o.status, createdAt: iso(o.createdAt) }));
  }
  async createOnboarding(userId: string, input: OnboardingInputData): Promise<OnboardingCase> {
    const { orgId } = await this.membership.requireOrg(userId);
    const o = await this.prisma.onboardingCase.create({
      data: { orgId, personName: input.personName, kind: input.kind ?? 'ONBOARDING', step: input.step?.trim() || null },
    });
    return { id: o.id, personName: o.personName, kind: o.kind, step: o.step, status: o.status, createdAt: iso(o.createdAt) };
  }
  async setOnboardingStatus(userId: string, id: string, status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETE'): Promise<OnboardingCase> {
    const { orgId } = await this.membership.requireOrg(userId);
    const existing = await this.prisma.onboardingCase.findFirst({ where: { id, orgId }, select: { id: true } });
    if (!existing) throw ApiException.notFound('Case not found.');
    const o = await this.prisma.onboardingCase.update({ where: { id }, data: { status } });
    return { id: o.id, personName: o.personName, kind: o.kind, step: o.step, status: o.status, createdAt: iso(o.createdAt) };
  }

  // ---- Warnings ----
  async listWarnings(userId: string): Promise<Warning[]> {
    const { orgId } = await this.membership.requireOrg(userId);
    const rows = await this.prisma.warning.findMany({ where: { orgId }, orderBy: { createdAt: 'desc' } });
    return rows.map((w) => ({ id: w.id, personName: w.personName, kind: w.kind, severity: w.severity, summary: w.summary, details: w.details, occurredAt: w.occurredAt, createdAt: iso(w.createdAt) }));
  }
  async createWarning(userId: string, input: WarningInputData): Promise<Warning> {
    const { orgId } = await this.membership.requireOrg(userId);
    const w = await this.prisma.warning.create({
      data: {
        orgId,
        personName: input.personName,
        kind: input.kind ?? 'WARNING',
        severity: input.severity ?? 'LOW',
        summary: input.summary,
        details: input.details?.trim() || null,
        occurredAt: input.occurredAt?.trim() || null,
      },
    });
    return { id: w.id, personName: w.personName, kind: w.kind, severity: w.severity, summary: w.summary, details: w.details, occurredAt: w.occurredAt, createdAt: iso(w.createdAt) };
  }
}
