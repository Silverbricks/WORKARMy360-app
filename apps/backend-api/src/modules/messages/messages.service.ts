import { Injectable } from '@nestjs/common';
import type { ConversationThread, ConversationView } from '@workarmy/types';
import { PrismaService } from '../../prisma/prisma.service';
import { MembershipService } from '../../common/membership/membership.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ApiException } from '../../common/errors/api-exception';

const personName = (p: { firstName: string | null; lastName: string | null; waId: string }): string =>
  `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim() || p.waId;

@Injectable()
export class MessagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly membership: MembershipService,
    private readonly notifications: NotificationsService,
  ) {}

  private async unreadMap(convIds: string[], notUserId: string): Promise<Map<string, number>> {
    if (convIds.length === 0) return new Map();
    const rows = await this.prisma.message.groupBy({
      by: ['conversationId'],
      where: { conversationId: { in: convIds }, readAt: null, senderUserId: { not: notUserId } },
      _count: { _all: true },
    });
    return new Map(rows.map((r) => [r.conversationId, r._count._all]));
  }

  // --- worker side ---
  async listForPerson(userId: string): Promise<ConversationView[]> {
    const personId = await this.membership.requirePerson(userId);
    const convs = await this.prisma.conversation.findMany({
      where: { personId },
      orderBy: { updatedAt: 'desc' },
      include: { organisation: true, messages: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });
    const unread = await this.unreadMap(convs.map((c) => c.id), userId);
    return convs.map((c) => ({
      id: c.id,
      counterparty: { name: c.organisation.name, waId: c.organisation.waId },
      lastMessage: c.messages[0]?.body ?? null,
      updatedAt: c.updatedAt.toISOString(),
      unread: unread.get(c.id) ?? 0,
    }));
  }

  async threadForPerson(userId: string, convId: string): Promise<ConversationThread> {
    const personId = await this.membership.requirePerson(userId);
    const conv = await this.prisma.conversation.findFirst({
      where: { id: convId, personId },
      include: { organisation: true, messages: { orderBy: { createdAt: 'asc' } } },
    });
    if (!conv) throw ApiException.notFound('Conversation not found.');
    await this.prisma.message.updateMany({
      where: { conversationId: convId, readAt: null, senderUserId: { not: userId } },
      data: { readAt: new Date() },
    });
    return {
      id: conv.id,
      counterparty: { name: conv.organisation.name },
      messages: conv.messages.map((m) => ({
        id: m.id,
        body: m.body,
        mine: m.senderUserId === userId,
        createdAt: m.createdAt.toISOString(),
      })),
    };
  }

  async startFromPerson(userId: string, orgWaId: string, body: string): Promise<ConversationThread> {
    const personId = await this.membership.requirePerson(userId);
    const org = await this.prisma.organisation.findUnique({ where: { waId: orgWaId } });
    if (!org) throw ApiException.badRequest('VALIDATION_ERROR', 'No organisation with that WA ID.');
    const conv = await this.prisma.conversation.upsert({
      where: { personId_orgId: { personId, orgId: org.id } },
      update: { updatedAt: new Date() },
      create: { personId, orgId: org.id },
    });
    await this.prisma.message.create({ data: { conversationId: conv.id, senderUserId: userId, body } });
    return this.threadForPerson(userId, conv.id);
  }

  async sendFromPerson(userId: string, convId: string, body: string): Promise<ConversationThread> {
    const personId = await this.membership.requirePerson(userId);
    const conv = await this.prisma.conversation.findFirst({ where: { id: convId, personId } });
    if (!conv) throw ApiException.notFound('Conversation not found.');
    await this.prisma.message.create({ data: { conversationId: convId, senderUserId: userId, body } });
    await this.prisma.conversation.update({ where: { id: convId }, data: { updatedAt: new Date() } });
    return this.threadForPerson(userId, convId);
  }

  // --- provider side ---
  async listForOrg(userId: string): Promise<ConversationView[]> {
    const { orgId } = await this.membership.requireOrg(userId);
    const convs = await this.prisma.conversation.findMany({
      where: { orgId },
      orderBy: { updatedAt: 'desc' },
      include: { person: true, messages: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });
    const unread = await this.unreadMap(convs.map((c) => c.id), userId);
    return convs.map((c) => ({
      id: c.id,
      counterparty: { name: personName(c.person), waId: c.person.waId },
      lastMessage: c.messages[0]?.body ?? null,
      updatedAt: c.updatedAt.toISOString(),
      unread: unread.get(c.id) ?? 0,
    }));
  }

  async threadForOrg(userId: string, convId: string): Promise<ConversationThread> {
    const { orgId } = await this.membership.requireOrg(userId);
    const conv = await this.prisma.conversation.findFirst({
      where: { id: convId, orgId },
      include: { person: true, messages: { orderBy: { createdAt: 'asc' } } },
    });
    if (!conv) throw ApiException.notFound('Conversation not found.');
    await this.prisma.message.updateMany({
      where: { conversationId: convId, readAt: null, senderUserId: { not: userId } },
      data: { readAt: new Date() },
    });
    return {
      id: conv.id,
      counterparty: { name: personName(conv.person) },
      messages: conv.messages.map((m) => ({
        id: m.id,
        body: m.body,
        mine: m.senderUserId === userId,
        createdAt: m.createdAt.toISOString(),
      })),
    };
  }

  async sendFromOrg(userId: string, convId: string, body: string): Promise<ConversationThread> {
    const { orgId } = await this.membership.requireOrg(userId);
    const conv = await this.prisma.conversation.findFirst({
      where: { id: convId, orgId },
      include: { person: { select: { userId: true } } },
    });
    if (!conv) throw ApiException.notFound('Conversation not found.');
    await this.prisma.message.create({ data: { conversationId: convId, senderUserId: userId, body } });
    await this.prisma.conversation.update({ where: { id: convId }, data: { updatedAt: new Date() } });
    await this.notifications.notify(conv.person.userId, {
      kind: 'message',
      title: 'New message',
      body: 'You have a new message from an organisation.',
      link: '/dashboard/support',
    });
    return this.threadForOrg(userId, convId);
  }
}
