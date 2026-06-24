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

  // Seed read-only knowledge hub articles (idempotent by slug).
  const articles = [
    {
      slug: 'understanding-pay-rates',
      title: 'Understanding pay rates & awards',
      category: 'Pay rates',
      body: 'Most Australian jobs are covered by a Modern Award that sets minimum pay, penalty rates and allowances. Casual workers usually get a 25% loading instead of paid leave. Check the Fair Work Pay Calculator for your industry and classification, and always confirm your rate in writing before starting.',
    },
    {
      slug: 'your-work-rights',
      title: 'Your work rights in Australia',
      category: 'Work rights',
      body: 'Everyone working in Australia has the same basic rights regardless of visa status: minimum wage, safe conditions, breaks, and superannuation. You cannot be asked to pay for a job, hand over your passport, or work unpaid "trials" beyond a brief demonstration. If something feels wrong, contact the Fair Work Ombudsman.',
    },
    {
      slug: 'how-to-write-a-resume',
      title: 'How to write a great resume',
      category: 'How-to',
      body: 'Keep it to 1–2 pages. Start with a short summary, then list recent experience with what you actually did and achieved. Add your licences and tickets (white card, forklift, RSA). Tailor the top of your resume to each job. In WorkArmy you can build a shareable resume and a QR worker pass from your profile.',
    },
    {
      slug: 'build-in-demand-skills',
      title: 'Build in-demand skills',
      category: 'Skills',
      body: 'Short certificates can open doors fast: white card (construction), forklift licence, RSA/RSG (hospitality), first aid, and a manual driver licence. Many can be done in a day or online. Add each one to your Qualifications and request verification so employers can trust them at a glance.',
    },
    {
      slug: 'tax-and-super-basics',
      title: 'Tax & superannuation basics',
      category: 'Pay rates',
      body: 'Give every employer your Tax File Number and complete a TFN declaration so you are taxed correctly. Employers must pay super (a percentage of your earnings) into a fund on top of your wage. Keep your payslips — they show your gross pay, tax withheld and super. You can claim a tax refund after 30 June.',
    },
  ];
  for (const a of articles) {
    await prisma.knowledgeArticle.upsert({
      where: { slug: a.slug },
      update: { title: a.title, category: a.category, body: a.body, published: true },
      create: a,
    });
  }
  console.log(`Seeded ${articles.length} knowledge articles`);
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
