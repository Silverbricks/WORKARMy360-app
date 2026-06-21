import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { AccessTokenClaims } from '@workarmy/types';
import type { Request } from 'express';

/** Injects the authenticated user's token claims (set by JwtAccessGuard). */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AccessTokenClaims => {
    const req = ctx.switchToHttp().getRequest<Request & { user: AccessTokenClaims }>();
    return req.user;
  },
);
