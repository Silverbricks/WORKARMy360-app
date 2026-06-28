import { Injectable } from '@nestjs/common';
import type { AdminRole, VerificationStatus } from '@workarmy/database';
import { PrismaService } from '../../prisma/prisma.service';
import { ApiException } from '../errors/api-exception';

export interface UserContext {
  userId: string;
  personId: string | null;
  orgId: string | null;
  orgRole: string | null;
  orgVerificationStatus: VerificationStatus | null;
  adminRole: AdminRole | null;
}

/** Resolves a user's person / org / admin context (the token carries only sub+email). */
@Injectable()
export class MembershipService {
  constructor(private readonly prisma: PrismaService) {}

  async getContext(userId: string): Promise<UserContext> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        person: {
          include: {
            orgMemberships: {
              take: 1,
              // Deterministic when a person belongs to >1 org: oldest membership wins.
              orderBy: { createdAt: 'asc' },
              include: { organisation: { select: { verificationStatus: true } } },
            },
          },
        },
      },
    });
    if (!user) throw ApiException.unauthorized();
    const membership = user.person?.orgMemberships[0];
    return {
      userId,
      personId: user.person?.id ?? null,
      orgId: membership?.orgId ?? null,
      orgRole: membership?.role ?? null,
      orgVerificationStatus: membership?.organisation.verificationStatus ?? null,
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

  /**
   * The current user's org, requiring it be verified (APPROVED). Gates posting
   * jobs / hiring / staff requests. 400 if the org is still pending/rejected.
   */
  async requireVerifiedOrg(userId: string): Promise<{ orgId: string; personId: string }> {
    const ctx = await this.getContext(userId);
    if (!ctx.orgId || !ctx.personId) {
      throw ApiException.unauthorized('This action requires a provider organisation.');
    }
    if (ctx.orgVerificationStatus !== 'APPROVED') {
      throw ApiException.badRequest(
        'VALIDATION_ERROR',
        'Your business needs to be verified before you can do this. We’ll review it shortly.',
      );
    }
    return { orgId: ctx.orgId, personId: ctx.personId };
  }

  /** The current user's person id, or 401. */
  async requirePerson(userId: string): Promise<string> {
    const ctx = await this.getContext(userId);
    if (!ctx.personId) throw ApiException.unauthorized();
    return ctx.personId;
  }

  /** Require the user's org role be one of `roles` (e.g. owner/admin). */
  async requireOrgRole(userId: string, roles: string[]): Promise<{ orgId: string; personId: string }> {
    const ctx = await this.getContext(userId);
    if (!ctx.orgId || !ctx.personId) {
      throw ApiException.unauthorized('This action requires a provider organisation.');
    }
    if (!ctx.orgRole || !roles.includes(ctx.orgRole)) {
      throw ApiException.unauthorized('You don’t have permission for this action.');
    }
    return { orgId: ctx.orgId, personId: ctx.personId };
  }
}
