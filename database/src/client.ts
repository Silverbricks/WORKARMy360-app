import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { __waPrisma?: PrismaClient };

/** Shared PrismaClient singleton — used by seed scripts and tooling. The
 * NestJS backend uses its own lifecycle-managed PrismaService instead. */
export const prisma =
  globalForPrisma.__waPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['warn', 'error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.__waPrisma = prisma;
}
