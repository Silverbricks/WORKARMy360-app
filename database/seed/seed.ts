import { hashPassword } from '@workarmy/auth';
import { prisma } from '../src/client';

async function main() {
  // Seed the global WA-ID counter so the first allocation yields WA100001
  // (matches the spec example WA123456 — a 6-digit, human-recognisable id).
  await prisma.waIdCounter.upsert({
    where: { id: 'GLOBAL' },
    update: {},
    create: { id: 'GLOBAL', lastValue: 100000n },
  });
  console.log('Seeded wa_id_counters: GLOBAL = 100000 (next WA ID = WA100001)');

  // Seed a Super Admin so the admin portal has a login. Override via env.
  const adminEmail = (process.env.SEED_ADMIN_EMAIL ?? 'admin@workarmy.local').toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'Admin$ecret123';
  const passwordHash = await hashPassword(adminPassword);
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { adminRole: 'SUPER_ADMIN', emailVerified: true, status: 'ACTIVE' },
    create: {
      email: adminEmail,
      passwordHash,
      emailVerified: true,
      status: 'ACTIVE',
      adminRole: 'SUPER_ADMIN',
      identities: { create: { provider: 'LOCAL', providerUserId: adminEmail } },
    },
  });
  console.log(`Seeded SUPER_ADMIN: ${adminEmail}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
