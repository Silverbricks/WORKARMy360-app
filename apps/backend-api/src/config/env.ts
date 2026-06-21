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

  TURNSTILE_ENABLED: boolFromString.default('false'),
  TURNSTILE_SECRET: z.string().optional(),

  API_PORT: z.coerce.number().int().positive().default(4000),
  API_GLOBAL_PREFIX: z.string().default('api/v1'),
  CORS_ORIGINS: z
    .string()
    .default('http://localhost:3000')
    .transform((s) => s.split(',').map((x) => x.trim()).filter(Boolean)),
  COOKIE_DOMAIN: z.string().default('localhost'),
  COOKIE_SECURE: boolFromString.default('false'),

  /** Base URL of the Users app — used to build the password-reset link. */
  APP_USERS_URL: z.string().default('http://localhost:3000'),
});

export const env = EnvSchema.parse(process.env);
export type Env = typeof env;

export const REFRESH_COOKIE_NAME = 'wa_refresh';
