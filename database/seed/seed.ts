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
