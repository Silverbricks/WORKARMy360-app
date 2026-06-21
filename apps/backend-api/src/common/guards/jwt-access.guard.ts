import { type CanActivate, type ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { verifyAccessToken } from '@workarmy/auth';
import type { Request } from 'express';
import { env } from '../../config/env';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { ApiException } from '../errors/api-exception';

/** Global guard: requires a valid Bearer access token unless the route is @Public(). */
@Injectable()
export class JwtAccessGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (isPublic) return true;

    const req = ctx.switchToHttp().getRequest<Request & { user?: unknown }>();
    const header = req.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
    if (!token) throw ApiException.unauthorized('Authentication required.');

    try {
      const claims = verifyAccessToken(token, env.JWT_ACCESS_SECRET);
      req.user = { sub: claims.sub, email: claims.email };
      return true;
    } catch {
      throw ApiException.unauthorized('Session expired. Please log in again.', 'TOKEN_EXPIRED');
    }
  }
}
