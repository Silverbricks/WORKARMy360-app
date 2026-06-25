import { z } from 'zod';

const boolFromString = z
  .enum(['true', 'false'])
  .transform((v) => v === 'true');

const EnvSchema = z.object({
  NODE_ENV: z.string().default('development'),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DIRECT_URL: z.string().optional(),

  JWT_ACCESS_SECRET: z.string().min(16, 'JWT_ACCESS_SECRET must be at least 16 chars'),
  JWT_REFRESH_SECRET: z.string().min(16, 'JWT_REFRESH_SECRET must be at least 16 chars'),
  ACCESS_TOKEN_TTL: z.coerce.number().int().positive().default(900),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(30),
  PASSWORD_HASHER: z.enum(['bcrypt', 'argon2']).default('bcrypt'),

  EMAIL_PROVIDER: z.enum(['console', 'resend']).default('console'),
  EMAIL_FROM: z.string().default('WorkArmy <no-reply@workarmy.co>'),
  RESEND_API_KEY: z.string().optional(),

  // SMS (mobile OTP). 'console' logs the code; 'twilio' sends real texts.
  SMS_PROVIDER: z.enum(['console', 'twilio']).default('console'),
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  // A Twilio number, an alphanumeric sender ID (AU), or a Messaging Service SID (MG…).
  TWILIO_FROM: z.string().optional(),

  // File uploads (stored on the server disk).
  UPLOAD_DIR: z.string().default('./uploads'),
  MAX_UPLOAD_MB: z.coerce.number().int().positive().default(10),

  TURNSTILE_ENABLED: boolFromString.default('false'),
  TURNSTILE_SECRET: z.string().optional(),

  API_PORT: z.coerce.number().int().positive().default(4000),
  API_GLOBAL_PREFIX: z.string().default('api/v1'),
  CORS_ORIGINS: z
    .string()
    .default('http://localhost:3000')
    .transform((s) => s.split(',').map((x) => x.trim()).filter(Boolean)),
  // Empty domain => host-only cookie (correct for cross-site prod, e.g. a
  // Railway API domain + a Vercel frontend). Set a domain only for shared roots.
  COOKIE_DOMAIN: z.string().default(''),
  COOKIE_SECURE: boolFromString.default('false'),
  // 'none' is required for cross-site cookies (and must be paired with Secure).
  COOKIE_SAMESITE: z.enum(['lax', 'strict', 'none']).default('lax'),

  /** Base URL of the Users app — used to build the password-reset link. */
  APP_USERS_URL: z.string().default('http://localhost:3000'),
});

export const env = EnvSchema.parse(process.env);
export type Env = typeof env;

export const REFRESH_COOKIE_NAME = 'wa_refresh';
