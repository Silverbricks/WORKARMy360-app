import { Injectable } from '@nestjs/common';
import type { Job, JobListing, Paginated } from '@workarmy/types';
import { PrismaService } from '../../prisma/prisma.service';
import { MembershipService } from '../../common/membership/membership.service';
import { AuditService } from '../audit/audit.service';
import { ApiException } from '../../common/errors/api-exception';
import type { DbJob, DbOrg, JobBrowseQueryData, JobInputData } from './jobs.types';

const iso = (d: Date | null): string | null => (d ? d.toISOString() : null);

@Injectable()
export class JobsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly membership: MembershipService,
    private readonly audit: AuditService,
  ) {}

  async mine(userId: string): Promise<Job[]> {
    const { orgId } = await this.membership.requireOrg(userId);
    const jobs = await this.prisma.job.findMany({ where: { orgId }, orderBy: { createdAt: 'desc' } });
    return jobs.map(toJob);
  }

  async create(userId: string, input: JobInputData): Promise<Job> {
    const { orgId } = await this.membership.requireOrg(userId);
    const job = await this.prisma.job.create({ data: { orgId, ...toData(input) } });
    return toJob(job);
  }

  async update(userId: string, id: string, input: JobInputData): Promise<Job> {
    const { orgId } = await this.membership.requireOrg(userId);
    await this.ensureOwned(id, orgId);
    const job = await this.prisma.job.update({ where: { id }, data: toData(input) });
    return toJob(job);
  }

  async publish(userId: string, id: string): Promise<Job> {
    const { orgId } = await this.membership.requireOrg(userId);
    await this.ensureOwned(id, orgId);
    const job = await this.prisma.job.update({
      where: { id },
      data: { status: 'PUBLISHED', publishedAt: new Date() },
    });
    await this.audit.record('JOB_PUBLISHED', { userId, metadata: { jobId: id } });
    return toJob(job);
  }

  async close(userId: string, id: string): Promise<Job> {
    const { orgId } = await this.membership.requireOrg(userId);
    await this.ensureOwned(id, orgId);
    const job = await this.prisma.job.update({
      where: { id },
      data: { status: 'CLOSED', closedAt: new Date() },
    });
    await this.audit.record('JOB_CLOSED', { userId, metadata: { jobId: id } });
    return toJob(job);
  }

  async get(id: string): Promise<JobListing> {
    const job = await this.prisma.job.findUnique({
      where: { id },
      include: { organisation: true, _count: { select: { applications: true } } },
    });
    if (!job) throw ApiException.notFound('Job not found.');
    return toListing(job, job.organisation, job._count.applications);
  }

  async browse(userId: string, q: JobBrowseQueryData): Promise<Paginated<JobListing>> {
    const page = q.page ?? 1;
    const pageSize = q.pageSize ?? 20;
    const where = {
      status: 'PUBLISHED' as const,
      ...(q.state ? { state: q.state } : {}),
      ...(q.category ? { category: q.category } : {}),
      ...(q.q
        ? {
            OR: [
              { title: { contains: q.q, mode: 'insensitive' as const } },
              { description: { contains: q.q, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.job.findMany({
        where,
        include: { organisation: true, _count: { select: { applications: true } } },
        orderBy: { publishedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.job.count({ where }),
    ]);

    const ctx = await this.membership.getContext(userId);
    let applied = new Set<string>();
    let saved = new Set<string>();
    if (ctx.personId && items.length) {
      const ids = items.map((j) => j.id);
      const [apps, savedRows] = await Promise.all([
        this.prisma.jobApplication.findMany({
          where: { personId: ctx.personId, jobId: { in: ids } },
          select: { jobId: true },
        }),
        this.prisma.savedJob.findMany({
          where: { personId: ctx.personId, jobId: { in: ids } },
          select: { jobId: true },
        }),
      ]);
      applied = new Set(apps.map((a) => a.jobId));
      saved = new Set(savedRows.map((s) => s.jobId));
    }

    return {
      items: items.map((j) =>
        toListing(j, j.organisation, j._count.applications, applied.has(j.id), saved.has(j.id)),
      ),
      total,
      page,
      pageSize,
    };
  }

  async save(userId: string, jobId: string): Promise<{ ok: true }> {
    const personId = await this.membership.requirePerson(userId);
    const job = await this.prisma.job.findUnique({ where: { id: jobId }, select: { id: true } });
    if (!job) throw ApiException.notFound('Job not found.');
    try {
      await this.prisma.savedJob.create({ data: { personId, jobId } });
    } catch {
      // unique violation → already saved; idempotent.
    }
    return { ok: true as const };
  }

  async unsave(userId: string, jobId: string): Promise<{ ok: true }> {
    const personId = await this.membership.requirePerson(userId);
    await this.prisma.savedJob.deleteMany({ where: { personId, jobId } });
    return { ok: true as const };
  }

  async saved(userId: string): Promise<JobListing[]> {
    const personId = await this.membership.requirePerson(userId);
    const rows = await this.prisma.savedJob.findMany({
      where: { personId },
      orderBy: { createdAt: 'desc' },
      include: {
        job: { include: { organisation: true, _count: { select: { applications: true } } } },
      },
    });
    const jobIds = rows.map((r) => r.jobId);
    const apps = jobIds.length
      ? await this.prisma.jobApplication.findMany({
          where: { personId, jobId: { in: jobIds } },
          select: { jobId: true },
        })
      : [];
    const applied = new Set(apps.map((a) => a.jobId));
    return rows.map((r) =>
      toListing(r.job, r.job.organisation, r.job._count.applications, applied.has(r.jobId), true),
    );
  }

  private async ensureOwned(id: string, orgId: string): Promise<void> {
    const existing = await this.prisma.job.findFirst({ where: { id, orgId }, select: { id: true } });
    if (!existing) throw ApiException.notFound('Job not found.');
  }
}

function toData(input: JobInputData) {
  return {
    title: input.title,
    description: input.description ?? null,
    category: input.category ?? null,
    employmentType: input.employmentType ?? null,
    location: input.location ?? null,
    suburb: input.suburb ?? null,
    state: input.state ?? null,
    payMin: input.payMin ?? null,
    payMax: input.payMax ?? null,
    payUnit: input.payUnit ?? null,
    positions: input.positions ?? 1,
    startDate: input.startDate ? new Date(input.startDate) : null,
  };
}

function toJob(j: DbJob): Job {
  return {
    id: j.id,
    orgId: j.orgId,
    title: j.title,
    description: j.description,
    status: j.status,
    category: j.category,
    employmentType: j.employmentType,
    location: j.location,
    suburb: j.suburb,
    state: j.state,
    payMin: j.payMin,
    payMax: j.payMax,
    payUnit: j.payUnit,
    positions: j.positions,
    startDate: iso(j.startDate),
    publishedAt: iso(j.publishedAt),
    closedAt: iso(j.closedAt),
    createdAt: j.createdAt.toISOString(),
    updatedAt: j.updatedAt.toISOString(),
  };
}

function toListing(
  j: DbJob,
  org: DbOrg,
  applicantCount: number,
  applied?: boolean,
  saved?: boolean,
): JobListing {
  return {
    ...toJob(j),
    org: { name: org.name, accountType: org.accountType },
    applicantCount,
    applied,
    saved,
  };
}
