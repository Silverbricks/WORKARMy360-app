import jwt from 'jsonwebtoken';
import type { AccessTokenClaims } from '@workarmy/types';
import { ACCESS_TTL_SECONDS } from './constants';

export type VerifiedAccessToken = AccessTokenClaims & { iat: number; exp: number };

export function signAccessToken(
  claims: AccessTokenClaims,
  secret: string,
  ttlSeconds: number = ACCESS_TTL_SECONDS,
): string {
  return jwt.sign(claims, secret, { algorithm: 'HS256', expiresIn: ttlSeconds });
}

/** Verifies signature + expiry. Throws on invalid/expired token. */
export function verifyAccessToken(token: string, secret: string): VerifiedAccessToken {
  return jwt.verify(token, secret, { algorithms: ['HS256'] }) as VerifiedAccessToken;
}
