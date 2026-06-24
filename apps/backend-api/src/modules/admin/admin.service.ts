import { Injectable } from '@nestjs/common';
import type { JobStatus, VerificationStatus } from '@workarmy/database';
import type {
  AdminStats,
  MemberDirectoryItem,
  ModerationJob,
  OkResponse,
  Paginated,
  VerificationItem,
} from '@workarmy/types';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ApiException } from '../../common/errors/api-exception';

const MEMBERS_PAGE_SIZE = 25;

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async stats(): Promise<AdminStats> {
    const [persons, organisations, jobs, applications, pendingVerifications] =
      await this.prisma.$transaction([
        this.prisma.person.count(),
        this.prisma.organisation.count(),
        this.prisma.job.count(),
        this.prisma.jobApplication.count(),
        this.prisma.verification.count({ where: { status: 'PENDING' } }),
      ]);
    return { persons, organisations, jobs, applications, pendingVerifications };
  }

  async members(q: string, page = 1): Promise<Paginated<MemberDirectoryItem>> {
    const [persons, orgs] = await this.prisma.$transaction([
      this.prisma.person.findMany({
        include: { user: { select: { email: true } } },
        orderBy: { createdAt: 'desc' },
        take: 500,
      }),
      this.prisma.organisation.findMany({ orderBy: { createdAt: 'desc' }, take: 500 }),
    ]);

    let items: MemberDirectoryItem[] = [
      ...persons.map((p) => ({
        kind: 'person' as const,
        id: p.id,
        waId: p.waId,
        name: `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim() || '(no name)',
        email: p.user.email,
        accountType: p.accountType,
        createdAt: p.createdAt.toISOString(),
      })),
      ...orgs.map((o) => ({
        kind: 'organisation' as const,
        id: o.id,
        waId: o.waId,
        name: o.name,
        email: null,
        accountType: o.accountType,
        createdAt: o.createdAt.toISOString(),
      })),
    ];

    if (q) {
      const s = q.toLowerCase();
      items = items.filter(
        (i) =>
          i.name.toLowerCase().includes(s) ||
          i.waId.toLowerCase().includes(s) ||
          (i.email ? i.email.toLowerCase().includes(s) : false),
      );
    }
    items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const total = items.length;
    const start = (page - 1) * MEMBERS_PAGE_SIZE;
    return { items: items.slice(start, start + MEMBERS_PAGE_SIZE), total, page, pageSize: MEMBERS_PAGE_SIZE };
  }

  async verifications(status: VerificationStatus): Promise<VerificationItem[]> {
    const rows = await this.prisma.verification.findMany({
      where: { status },
      include: { organisation: true, person: true, credential: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return rows.map((v) => {
      const subject: VerificationItem['subject'] = v.organisation
        ? {
            kind: 'organisation' as const,
            id: v.organisation.id,
            waId: v.organisation.waId,
            name: v.organisation.name,
          }
        : v.person
          ? {
              kind: 'person' as const,
              id: v.person.id,
              waId: v.person.waId,
              name:
                `${v.person.firstName ?? ''} ${v.person.lastName ?? ''}`.trim() ||
                (v.credential ? v.credential.type : '(person)'),
            }
          : { kind: 'organisation' as const, id: '', waId: '', name: '(unknown)' };
      return {
        id: v.id,
        status: v.status,
        subject,
        reviewNote: v.reviewNote,
        reviewedAt: v.reviewedAt ? v.reviewedAt.toISOString() : null,
        createdAt: v.createdAt.toISOString(),
      };
    });
  }

  async review(
    userId: string,
    id: string,
    status: 'APPROVED' | 'REJECTED',
    note?: string,
  ): Promise<OkResponse> {
    const existing = await this.prisma.verification.findUnique({ where: { id }, select: { id: true } });
    if (!existing) throw ApiException.notFound('Verification not found.');
    await this.prisma.verification.update({
      where: { id },
      data: { status, reviewedByUserId: userId, reviewNote: note ?? null, reviewedAt: new Date() },
    });
    await this.audit.record(status === 'APPROVED' ? 'ORG_VERIFIED' : 'ORG_REJECTED', {
      userId,
      metadata: { verificationId: id },
    });
    return { ok: true };
  }

  async jobs(status: string): Promise<ModerationJob[]> {
    const rows = await this.prisma.job.findMany({
      where: status ? { status: status as JobStatus } : {},
      include: { organisation: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return rows.map((j) => ({
      id: j.id,
      title: j.title,
      status: j.status,
      orgName: j.organisation.name,
      state: j.state,
      createdAt: j.createdAt.toISOString(),
    }));
  }

  async closeJob(userId: string, id: string): Promise<OkResponse> {
    const job = await this.prisma.job.findUnique({ where: { id }, select: { id: true } });
    if (!job) throw ApiException.notFound('Job not found.');
    await this.prisma.job.update({ where: { id }, data: { status: 'CLOSED', closedAt: new Date() } });
    await this.audit.record('JOB_CLOSED', { userId, metadata: { jobId: id, byAdmin: true } });
    return { ok: true };
  }
}
