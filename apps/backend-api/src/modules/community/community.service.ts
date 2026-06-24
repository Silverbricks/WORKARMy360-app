import { Injectable } from '@nestjs/common';
import type { Feedback, Group, KnowledgeArticle, KnowledgeSummary } from '@workarmy/types';
import type { FeedbackInputData, GroupInputData } from '@workarmy/validation';
import { PrismaService } from '../../prisma/prisma.service';
import { MembershipService } from '../../common/membership/membership.service';
import { ApiException } from '../../common/errors/api-exception';

@Injectable()
export class CommunityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly membership: MembershipService,
  ) {}

  async knowledge(category?: string): Promise<KnowledgeSummary[]> {
    const rows = await this.prisma.knowledgeArticle.findMany({
      where: { published: true, ...(category ? { category } : {}) },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((a) => ({
      slug: a.slug,
      title: a.title,
      category: a.category,
      excerpt: a.body.length > 160 ? `${a.body.slice(0, 160)}…` : a.body,
    }));
  }

  async article(slug: string): Promise<KnowledgeArticle> {
    const a = await this.prisma.knowledgeArticle.findUnique({ where: { slug } });
    if (!a || !a.published) throw ApiException.notFound('Article not found.');
    return { slug: a.slug, title: a.title, category: a.category, body: a.body };
  }

  async groups(userId: string): Promise<Group[]> {
    const personId = await this.membership.requirePerson(userId);
    const rows = await this.prisma.group.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { members: true } }, members: { where: { personId }, select: { id: true } } },
    });
    return rows.map((g) => ({
      id: g.id,
      kind: g.kind,
      name: g.name,
      description: g.description,
      memberCount: g._count.members,
      joined: g.members.length > 0,
    }));
  }

  async myGroups(userId: string): Promise<Group[]> {
    const personId = await this.membership.requirePerson(userId);
    const memberships = await this.prisma.groupMember.findMany({
      where: { personId },
      include: { group: { include: { _count: { select: { members: true } } } } },
    });
    return memberships.map((m) => ({
      id: m.group.id,
      kind: m.group.kind,
      name: m.group.name,
      description: m.group.description,
      memberCount: m.group._count.members,
      joined: true,
    }));
  }

  async createGroup(userId: string, input: GroupInputData): Promise<Group> {
    const personId = await this.membership.requirePerson(userId);
    const g = await this.prisma.group.create({
      data: {
        kind: input.kind,
        name: input.name,
        description: input.description || null,
        ownerPersonId: personId,
        members: { create: { personId, role: 'owner' } },
      },
      include: { _count: { select: { members: true } } },
    });
    return { id: g.id, kind: g.kind, name: g.name, description: g.description, memberCount: g._count.members, joined: true };
  }

  async join(userId: string, groupId: string): Promise<{ ok: true }> {
    const personId = await this.membership.requirePerson(userId);
    const g = await this.prisma.group.findUnique({ where: { id: groupId }, select: { id: true } });
    if (!g) throw ApiException.notFound('Group not found.');
    try {
      await this.prisma.groupMember.create({ data: { groupId, personId } });
    } catch {
      // already a member — idempotent
    }
    return { ok: true as const };
  }

  async leave(userId: string, groupId: string): Promise<{ ok: true }> {
    const personId = await this.membership.requirePerson(userId);
    await this.prisma.groupMember.deleteMany({ where: { groupId, personId } });
    return { ok: true as const };
  }

  async submitFeedback(userId: string, input: FeedbackInputData): Promise<Feedback> {
    const personId = await this.membership.requirePerson(userId);
    const f = await this.prisma.feedback.create({
      data: { personId, kind: input.kind, message: input.message },
    });
    return { id: f.id, kind: f.kind, message: f.message, createdAt: f.createdAt.toISOString() };
  }

  async myFeedback(userId: string): Promise<Feedback[]> {
    const personId = await this.membership.requirePerson(userId);
    const rows = await this.prisma.feedback.findMany({
      where: { personId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((f) => ({ id: f.id, kind: f.kind, message: f.message, createdAt: f.createdAt.toISOString() }));
  }
}
