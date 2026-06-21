import { z } from 'zod';

/** Email — trimmed, lowercased, RFC-ish. */
export const auEmail = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, 'Email is required')
  .email('Enter a valid email address')
  .max(254);

/**
 * Australian mobile number. Accepts spaces/brackets/dashes and the +61 or 0
 * forms; normalises to a compact string (e.g. "0412345678" / "+61412345678").
 */
export const auMobile = z
  .string()
  .trim()
  .transform((s) => s.replace(/[\s()-]/g, ''))
  .refine((v) => /^(?:\+?61|0)4\d{8}$/.test(v), 'Enter a valid Australian mobile number');

/**
 * Strong password: min 10 chars with lower, upper, digit and symbol.
 * (10+ per the provider onboarding spec; superset of the worker rule.)
 */
export const strongPassword = z
  .string()
  .min(10, 'Use at least 10 characters')
  .max(128, 'Password is too long')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{10,}$/,
    'Include upper & lower case, a number and a symbol',
  );

/** 6-digit one-time code. */
export const otpCode = z
  .string()
  .trim()
  .regex(/^\d{6}$/, 'Enter the 6-digit code');

/** A person/contact name field. */
export const personName = z
  .string()
  .trim()
  .min(1, 'Required')
  .max(80, 'Too long');

/**
 * Cheap password-strength score (0–4) for a UI meter. Pure, no node deps, so it
 * is safe to import in the browser. Server enforcement is `strongPassword`.
 */
export function passwordStrength(pw: string): number {
  let score = 0;
  if (pw.length >= 10) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z\d]/.test(pw)) score++;
  return score;
}
