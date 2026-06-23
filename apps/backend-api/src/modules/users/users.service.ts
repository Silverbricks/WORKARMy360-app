import { Injectable } from '@nestjs/common';
import type { AuthUser, MeResponse, OrgRole, UserStatus } from '@workarmy/types';
import type { AdminRole, User } from '@workarmy/database';
import { PrismaService } from '../../prisma/prisma.service';
import { ApiException } from '../../common/errors/api-exception';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  /** Build the /auth/me view: auth user + person summary + org membership. */
  async getMe(userId: string): Promise<MeResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        person: {
          include: { orgMemberships: { include: { organisation: true }, take: 1 } },
        },
      },
    });
    if (!user) throw ApiException.unauthorized();

    const membership = user.person?.orgMemberships[0];

    return {
      user: toAuthUser(user),
      person: user.person
        ? {
            waId: user.person.waId,
            accountType: user.person.accountType,
            firstName: user.person.firstName,
            lastName: user.person.lastName,
            profileComplete: user.person.profileComplete,
          }
        : null,
      organisation: membership
        ? {
            id: membership.organisation.id,
            waId: membership.organisation.waId,
            accountType: membership.organisation.accountType,
            name: membership.organisation.name,
            role: membership.role as OrgRole,
          }
        : null,
    };
  }
}

export function toAuthUser(
  user: Pick<User, 'id' | 'email' | 'status' | 'emailVerified' | 'adminRole'>,
): AuthUser {
  return {
    id: user.id,
    email: user.email,
    status: user.status.toLowerCase() as UserStatus,
    emailVerified: user.emailVerified,
    adminRole: (user.adminRole as AdminRole | null) ?? null,
  };
}
