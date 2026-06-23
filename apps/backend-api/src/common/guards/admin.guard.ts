import { type CanActivate, type ExecutionContext, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { ApiException } from '../errors/api-exception';
import { MembershipService } from '../membership/membership.service';

/** Requires the authenticated user to have an adminRole. Runs after JwtAccessGuard. */
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly membership: MembershipService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<Request & { user?: { sub: string } }>();
    const userId = req.user?.sub;
    if (!userId) throw ApiException.unauthorized();
    const m = await this.membership.getContext(userId);
    if (!m.adminRole) throw ApiException.unauthorized('Admin access required.');
    return true;
  }
}
