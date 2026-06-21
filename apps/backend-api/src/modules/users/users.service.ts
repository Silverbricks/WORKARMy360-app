import { Injectable } from '@nestjs/common';
import type { AuthUser, MeResponse, UserStatus } from '@workarmy/types';
import type { User } from '@workarmy/database';
import { PrismaService } from '../../prisma/prisma.service';
import { ApiException } from '../../common/errors/api-exception';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  /** Build the /auth/me view (auth user + person summary). */
  async getMe(userId: string): Promise<MeResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { person: true },
    });
    if (!user) throw ApiException.unauthorized();

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
    };
  }
}

export function toAuthUser(user: Pick<User, 'id' | 'email' | 'status' | 'emailVerified'>): AuthUser {
  return {
    id: user.id,
    email: user.email,
    status: user.status.toLowerCase() as UserStatus,
    emailVerified: user.emailVerified,
  };
}
