import { Injectable } from '@nestjs/common';
import { Prisma } from '@workarmy/database';
import type {
  Applicant,
  ApplicationEvent,
  ApplyInput,
  JobApplication,
  MyApplication,
  StageChangeInput,
} from '@workarmy/types';
import { PrismaService } from '../../prisma/prisma.service';
import { MembershipService } from '../../common/membership/membership.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ApiException } from '../../common/errors/api-exception';

@Injectable()
export class ApplicationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly membership: MembershipService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService,
  ) {}

  async apply(userId: string, jobId: string, input: ApplyInput): Promise<JobApplication> {
    const personId = await this.membership.requirePerson(userId);
    // Gate 2: applying requires a completed/verified profile (browsing is open).
    const person = await this.prisma.person.findUnique({
      where: { id: personId },
      select: { profileComplete: true },
    });
    if (!person?.profileComplete) {
      throw ApiException.badRequest(
        'VALIDATION_ERROR',
        'Complete and verify your profile before applying for jobs.',
      );
    }
    const job = await this.prisma.job.findUnique({ where: { id: jobId }, select: { status: true } });
    if (!job || job.status !== 'PUBLISHED') throw ApiException.notFound('Job not available.');

    try {
      const created = await this.prisma.$transaction(async (tx) => {
        const app = await tx.jobApplication.create({
          data: { jobId, personId, coverNote: input.coverNote ?? null },
        });
        await tx.applicationEvent.create({
          data: { applicationId: app.id, toStage: 'APPLIED', actorUserId: userId },
        });
        return app;
      });
      await this.audit.record('APPLICATION_SUBMITTED', { userId, metadata: { jobId } });
      return toApplication(created);
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw ApiException.conflict('EMAIL_TAKEN', 'You have already applied to this job.');
      }
      throw e;
    }
  }

  async mine(userId: string): Promise<MyApplication[]> {
    const personId = await this.membership.requirePerson(userId);
    const apps = await this.prisma.jobApplication.findMany({
      where: { personId },
      include: { job: { include: { organisation: { select: { name: true } } } } },
      orderBy: { createdAt: 'desc' },
    });
    return apps.map((a) => ({
      ...toApplication(a),
      job: {
        id: a.job.id,
        title: a.job.title,
        status: a.job.status,
        location: a.job.location,
        state: a.job.state,
        org: { name: a.job.organisation.name },
      },
    }));
  }

  async forJob(userId: string, jobId: string): Promise<Applicant[]> {
    const { orgId } = await this.membership.requireOrg(userId);
    const job = await this.prisma.job.findFirst({ where: { id: jobId, orgId }, select: { id: true } });
    if (!job) throw ApiException.notFound('Job not found.');
    const apps = await this.prisma.jobApplication.findMany({
      where: { jobId },
      include: { person: { select: { waId: true, firstName: true, lastName: true, mobile: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return apps.map((a) => ({ ...toApplication(a), person: a.person }));
  }

  async changeStage(userId: string, id: string, input: StageChangeInput): Promise<JobApplication> {
    const { orgId } = await this.membership.requireOrg(userId);
    const app = await this.prisma.jobApplication.findUnique({
      where: { id },
      include: { job: { select: { orgId: true, title: true } }, person: { select: { userId: true } } },
    });
    if (!app || app.job.orgId !== orgId) throw ApiException.notFound('Application not found.');
    const updated = await this.prisma.$transaction(async (tx) => {
      const u = await tx.jobApplication.update({ where: { id }, data: { stage: input.toStage } });
      await tx.applicationEvent.create({
        data: {
          applicationId: id,
          fromStage: app.stage,
          toStage: input.toStage,
          actorUserId: userId,
          note: input.note ?? null,
        },
      });
      return u;
    });
    await this.audit.record('APPLICATION_STAGE_CHANGED', {
      userId,
      metadata: { applicationId: id, toStage: input.toStage },
    });
    await this.notifications.notify(app.person.userId, {
      kind: input.toStage === 'INTERVIEW' ? 'interview' : 'application',
      title: `Application ${input.toStage.toLowerCase()}`,
      body: `Your application for "${app.job.title}" is now ${input.toStage}.`,
      link: '/dashboard/jobs',
    });
    return toApplication(updated);
  }

  async events(userId: string, id: string): Promise<ApplicationEvent[]> {
    const app = await this.prisma.jobApplication.findUnique({
      where: { id },
      include: { job: { select: { orgId: true } }, person: { select: { userId: true } } },
    });
    if (!app) throw ApiException.notFound('Application not found.');
    const ctx = await this.membership.getContext(userId);
    const isOwner = !!ctx.orgId && app.job.orgId === ctx.orgId;
    const isApplicant = app.person.userId === userId;
    if (!isOwner && !isApplicant) throw ApiException.unauthorized();
    const events = await this.prisma.applicationEvent.findMany({
      where: { applicationId: id },
      orderBy: { createdAt: 'asc' },
    });
    return events.map((e) => ({
      id: e.id,
      fromStage: e.fromStage,
      toStage: e.toStage,
      note: e.note,
      createdAt: e.createdAt.toISOString(),
    }));
  }
}

function toApplication(a: {
  id: string;
  jobId: string;
  personId: string;
  stage: JobApplication['stage'];
  coverNote: string | null;
  createdAt: Date;
  updatedAt: Date;
}): JobApplication {
  return {
    id: a.id,
    jobId: a.jobId,
    personId: a.personId,
    stage: a.stage,
    coverNote: a.coverNote,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  };
}
