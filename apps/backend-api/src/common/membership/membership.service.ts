import { Injectable } from '@nestjs/common';
import type { AdminRole } from '@workarmy/database';
import { PrismaService } from '../../prisma/prisma.service';
import { ApiException } from '../errors/api-exception';

export interface UserContext {
  userId: string;
  personId: string | null;
  orgId: string | null;
  orgRole: string | null;
  adminRole: AdminRole | null;
}

/** Resolves a user's person / org / admin context (the token carries only sub+email). */
@Injectable()
export class MembershipService {
  constructor(private readonly prisma: PrismaService) {}

  async getContext(userId: string): Promise<UserContext> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { person: { include: { orgMemberships: { take: 1 } } } },
    });
    if (!user) throw ApiException.unauthorized();
    const membership = user.person?.orgMemberships[0];
    return {
      userId,
      personId: user.person?.id ?? null,
      orgId: membership?.orgId ?? null,
      orgRole: membership?.role ?? null,
      adminRole: user.adminRole ?? null,
    };
  }

  /** The current user's org, or 403 if they don't belong to one. */
  async requireOrg(userId: string): Promise<{ orgId: string; personId: string }> {
    const ctx = await this.getContext(userId);
    if (!ctx.orgId || !ctx.personId) {
      throw ApiException.unauthorized('This action requires a provider organisation.');
    }
    return { orgId: ctx.orgId, personId: ctx.personId };
  }

  /** The current user's person id, or 401. */
  async requirePerson(userId: string): Promise<string> {
    const ctx = await this.getContext(userId);
    if (!ctx.personId) throw ApiException.unauthorized();
    return ctx.personId;
  }
}
