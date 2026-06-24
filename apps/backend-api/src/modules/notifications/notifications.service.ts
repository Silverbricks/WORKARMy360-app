import { Injectable } from '@nestjs/common';
import type { Notification } from '@workarmy/types';
import { PrismaService } from '../../prisma/prisma.service';

export interface NotifyInput {
  kind: string;
  title: string;
  body?: string;
  link?: string;
}

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Best-effort — never throws into the calling flow. */
  async notify(userId: string, n: NotifyInput): Promise<void> {
    try {
      await this.prisma.notification.create({
        data: { userId, kind: n.kind, title: n.title, body: n.body ?? null, link: n.link ?? null },
      });
    } catch {
      // notifications are non-critical
    }
  }

  async list(userId: string): Promise<Notification[]> {
    const rows = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return rows.map((n) => ({
      id: n.id,
      kind: n.kind,
      title: n.title,
      body: n.body,
      link: n.link,
      read: !!n.readAt,
      createdAt: n.createdAt.toISOString(),
    }));
  }

  async markRead(userId: string, id: string): Promise<{ ok: true }> {
    await this.prisma.notification.updateMany({
      where: { id, userId, readAt: null },
      data: { readAt: new Date() },
    });
    return { ok: true as const };
  }

  async markAllRead(userId: string): Promise<{ ok: true }> {
    await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
    return { ok: true as const };
  }
}
