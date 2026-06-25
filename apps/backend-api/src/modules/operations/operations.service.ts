import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import type { Site, SiteQrCode, Task, Visitor } from '@workarmy/types';
import type {
  QrInputData,
  SiteInputData,
  TaskInputData,
  VisitorInputData,
} from '@workarmy/validation';
import { PrismaService } from '../../prisma/prisma.service';
import { MembershipService } from '../../common/membership/membership.service';
import { ApiException } from '../../common/errors/api-exception';

const iso = (d: Date) => d.toISOString();

@Injectable()
export class OperationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly membership: MembershipService,
  ) {}

  // ---- Sites ----
  async listSites(userId: string): Promise<Site[]> {
    const { orgId } = await this.membership.requireOrg(userId);
    const rows = await this.prisma.site.findMany({ where: { orgId }, orderBy: { createdAt: 'desc' } });
    return rows.map((s) => ({ id: s.id, name: s.name, addressLine: s.addressLine, suburb: s.suburb, state: s.state, postcode: s.postcode, active: s.active }));
  }
  async createSite(userId: string, input: SiteInputData): Promise<Site> {
    const { orgId } = await this.membership.requireOrg(userId);
    const s = await this.prisma.site.create({
      data: { orgId, name: input.name, addressLine: input.addressLine?.trim() || null, suburb: input.suburb?.trim() || null, state: input.state?.trim() || null, postcode: input.postcode?.trim() || null },
    });
    return { id: s.id, name: s.name, addressLine: s.addressLine, suburb: s.suburb, state: s.state, postcode: s.postcode, active: s.active };
  }
  async removeSite(userId: string, id: string): Promise<{ ok: true }> {
    const { orgId } = await this.membership.requireOrg(userId);
    await this.prisma.site.deleteMany({ where: { id, orgId } });
    return { ok: true as const };
  }

  // ---- Tasks ----
  async listTasks(userId: string): Promise<Task[]> {
    const { orgId } = await this.membership.requireOrg(userId);
    const rows = await this.prisma.task.findMany({ where: { orgId }, orderBy: { createdAt: 'desc' } });
    return rows.map(toTask);
  }
  async createTask(userId: string, input: TaskInputData): Promise<Task> {
    const { orgId } = await this.membership.requireOrg(userId);
    const t = await this.prisma.task.create({
      data: { orgId, title: input.title, description: input.description?.trim() || null, assigneeName: input.assigneeName?.trim() || null, source: input.source?.trim() || null, siteId: input.siteId ?? null, dueAt: input.dueAt?.trim() || null },
    });
    return toTask(t);
  }
  async setTaskStatus(userId: string, id: string, status: Task['status']): Promise<Task> {
    const { orgId } = await this.membership.requireOrg(userId);
    const existing = await this.prisma.task.findFirst({ where: { id, orgId }, select: { id: true } });
    if (!existing) throw ApiException.notFound('Task not found.');
    const t = await this.prisma.task.update({ where: { id }, data: { status } });
    return toTask(t);
  }

  // ---- QR codes ----
  async listQr(userId: string): Promise<SiteQrCode[]> {
    const { orgId } = await this.membership.requireOrg(userId);
    const rows = await this.prisma.siteQrCode.findMany({ where: { orgId }, orderBy: { createdAt: 'desc' } });
    return rows.map(toQr);
  }
  async createQr(userId: string, input: QrInputData): Promise<SiteQrCode> {
    const { orgId } = await this.membership.requireOrg(userId);
    let siteName = input.siteName?.trim() || null;
    if (input.siteId) {
      const site = await this.prisma.site.findFirst({ where: { id: input.siteId, orgId }, select: { name: true } });
      if (site) siteName = site.name;
    }
    const token = 'WA-QR-' + randomBytes(4).toString('hex').toUpperCase();
    const q = await this.prisma.siteQrCode.create({
      data: { orgId, siteId: input.siteId ?? null, siteName, leaderName: input.leaderName?.trim() || null, token },
    });
    return toQr(q);
  }

  // ---- Visitors ----
  async listVisitors(userId: string): Promise<Visitor[]> {
    const { orgId } = await this.membership.requireOrg(userId);
    const rows = await this.prisma.visitor.findMany({ where: { orgId }, orderBy: { checkInAt: 'desc' }, take: 100 });
    return rows.map(toVisitor);
  }
  async checkInVisitor(userId: string, input: VisitorInputData): Promise<Visitor> {
    const { orgId } = await this.membership.requireOrg(userId);
    const v = await this.prisma.visitor.create({
      data: { orgId, name: input.name, company: input.company?.trim() || null, kind: input.kind ?? 'VISITOR', siteName: input.siteName?.trim() || null, host: input.host?.trim() || null },
    });
    return toVisitor(v);
  }
  async checkOutVisitor(userId: string, id: string): Promise<Visitor> {
    const { orgId } = await this.membership.requireOrg(userId);
    const existing = await this.prisma.visitor.findFirst({ where: { id, orgId }, select: { id: true } });
    if (!existing) throw ApiException.notFound('Visitor not found.');
    const v = await this.prisma.visitor.update({ where: { id }, data: { checkOutAt: new Date(), status: 'CHECKED_OUT' } });
    return toVisitor(v);
  }
}

function toTask(t: { id: string; title: string; description: string | null; assigneeName: string | null; source: string | null; siteId: string | null; dueAt: string | null; status: Task['status']; createdAt: Date }): Task {
  return { id: t.id, title: t.title, description: t.description, assigneeName: t.assigneeName, source: t.source, siteId: t.siteId, dueAt: t.dueAt, status: t.status, createdAt: iso(t.createdAt) };
}
function toQr(q: { id: string; siteId: string | null; siteName: string | null; leaderName: string | null; token: string; active: boolean; createdAt: Date }): SiteQrCode {
  return { id: q.id, siteId: q.siteId, siteName: q.siteName, leaderName: q.leaderName, token: q.token, active: q.active, createdAt: iso(q.createdAt) };
}
function toVisitor(v: { id: string; name: string; company: string | null; kind: Visitor['kind']; siteName: string | null; host: string | null; checkInAt: Date; checkOutAt: Date | null; status: Visitor['status'] }): Visitor {
  return { id: v.id, name: v.name, company: v.company, kind: v.kind, siteName: v.siteName, host: v.host, checkInAt: iso(v.checkInAt), checkOutAt: v.checkOutAt ? iso(v.checkOutAt) : null, status: v.status };
}
