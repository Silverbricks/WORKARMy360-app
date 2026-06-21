import { Injectable } from '@nestjs/common';
import { generateOpaqueToken, hashToken, REFRESH_TTL_SECONDS } from '@workarmy/auth';
import { PrismaService } from '../../prisma/prisma.service';
import { ApiException } from '../../common/errors/api-exception';
import type { RequestContext } from '../../common/http-context';

export interface IssuedRefresh {
  token: string;
  expiresAt: Date;
}

@Injectable()
export class SessionService {
  constructor(private readonly prisma: PrismaService) {}

  /** Create a new refresh session; only the hash is stored. */
  async issue(userId: string, ctx: RequestContext): Promise<IssuedRefresh> {
    const token = generateOpaqueToken();
    const expiresAt = new Date(Date.now() + REFRESH_TTL_SECONDS * 1000);
    await this.prisma.session.create({
      data: {
        userId,
        refreshTokenHash: hashToken(token),
        expiresAt,
        ipAddress: ctx.ip,
        userAgent: ctx.userAgent,
      },
    });
    return { token, expiresAt };
  }

  /** Validate + rotate a refresh token (revoke old, issue new). */
  async rotate(
    rawToken: string,
    ctx: RequestContext,
  ): Promise<{ userId: string; refresh: IssuedRefresh }> {
    const session = await this.prisma.session.findUnique({
      where: { refreshTokenHash: hashToken(rawToken) },
    });
    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      throw ApiException.unauthorized('Session expired. Please log in again.', 'TOKEN_EXPIRED');
    }
    const refresh = await this.issue(session.userId, ctx);
    await this.prisma.session.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });
    return { userId: session.userId, refresh };
  }

  async revoke(rawToken: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { refreshTokenHash: hashToken(rawToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
