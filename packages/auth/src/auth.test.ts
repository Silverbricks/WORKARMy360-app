import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from './password';
import { compareOtp, generateOtp, hashOtp } from './otp';
import { generateOpaqueToken, hashToken, safeEqualHex } from './tokens';
import { signAccessToken, verifyAccessToken } from './jwt';

describe('password', () => {
  it('hashes and verifies', async () => {
    const hash = await hashPassword('Sup3r$ecret!');
    expect(hash).not.toBe('Sup3r$ecret!');
    expect(await verifyPassword('Sup3r$ecret!', hash)).toBe(true);
    expect(await verifyPassword('wrong', hash)).toBe(false);
  });

  it('rejects an empty stored hash', async () => {
    expect(await verifyPassword('anything', '')).toBe(false);
  });
});

describe('otp', () => {
  it('generates a 6-digit code', () => {
    for (let i = 0; i < 50; i++) {
      expect(generateOtp()).toMatch(/^\d{6}$/);
    }
  });

  it('hashes and compares in constant time', () => {
    const code = generateOtp();
    const hash = hashOtp(code);
    expect(hash).not.toBe(code);
    expect(compareOtp(code, hash)).toBe(true);
    expect(compareOtp('000000', hashOtp('111111'))).toBe(false);
  });
});

describe('tokens', () => {
  it('generates distinct opaque tokens', () => {
    const a = generateOpaqueToken();
    const b = generateOpaqueToken();
    expect(a).not.toBe(b);
    expect(a.length).toBeGreaterThan(20);
  });

  it('hashes tokens and matches via safeEqualHex', () => {
    const t = generateOpaqueToken();
    expect(safeEqualHex(hashToken(t), hashToken(t))).toBe(true);
    expect(safeEqualHex(hashToken(t), hashToken('other'))).toBe(false);
  });
});

describe('jwt', () => {
  const secret = 'test-secret-at-least-32-characters-long!!';

  it('signs and verifies access tokens', () => {
    const token = signAccessToken({ sub: 'user-1', email: 'a@b.co' }, secret, 60);
    const claims = verifyAccessToken(token, secret);
    expect(claims.sub).toBe('user-1');
    expect(claims.email).toBe('a@b.co');
    expect(claims.exp).toBeGreaterThan(claims.iat);
  });

  it('rejects a token signed with a different secret', () => {
    const token = signAccessToken({ sub: 'user-1', email: 'a@b.co' }, secret, 60);
    expect(() => verifyAccessToken(token, 'a-different-secret-value-32-chars-xx')).toThrow();
  });

  it('rejects an expired token', () => {
    const token = signAccessToken({ sub: 'user-1', email: 'a@b.co' }, secret, -1);
    expect(() => verifyAccessToken(token, secret)).toThrow();
  });
});
