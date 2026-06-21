import bcrypt from 'bcryptjs';
import { BCRYPT_ROUNDS } from './constants';

/**
 * Password hashing. Sprint 1 uses bcryptjs (pure JS — no native build on
 * Windows). The `PASSWORD_HASHER=argon2` switch is reserved for a later sprint
 * once the toolchain is confirmed; until then bcrypt is the only implementation.
 */
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  if (!hash) return false;
  return bcrypt.compare(plain, hash);
}
