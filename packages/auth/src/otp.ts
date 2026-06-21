import { createHash, randomInt } from 'node:crypto';
import { safeEqualHex } from './tokens';

/** A cryptographically-random 6-digit code, zero-padded. */
export function generateOtp(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, '0');
}

/** SHA-256 hex digest of the code — OTPs are stored hashed, never plaintext. */
export function hashOtp(code: string): string {
  return createHash('sha256').update(code).digest('hex');
}

/** Constant-time check of a candidate code against a stored hash. */
export function compareOtp(code: string, hash: string): boolean {
  return safeEqualHex(hashOtp(code), hash);
}
