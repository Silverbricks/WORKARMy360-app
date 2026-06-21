import type { Request } from 'express';

export interface RequestContext {
  ip: string | null;
  userAgent: string | null;
}

/** Extract client IP + user-agent for audit + session metadata. */
export function requestContext(req: Request): RequestContext {
  const forwarded = req.headers['x-forwarded-for'];
  const ip =
    (typeof forwarded === 'string' ? forwarded.split(',')[0]?.trim() : undefined) ??
    req.ip ??
    null;
  return {
    ip: ip ?? null,
    userAgent: req.headers['user-agent'] ?? null,
  };
}
