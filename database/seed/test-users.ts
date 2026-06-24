import { hashPassword } from '@workarmy/auth';
import type { AccountType, AdminRole } from '@prisma/client';
import { prisma } from '../src/client';
import { allocateWaId } from '../src/wa-id';

/**
 * Seed one ready-to-use test account per user type. Writes directly to the DB
 * (bypassing the password-strength rule) so every account shares one simple
 * password for testing. Idempotent: re-running just resets the password.
 *
 * Override the shared password with SEED_TEST_PASSWORD.
 */
const PASSWORD = process.env.SEED_TEST_PASSWORD ?? 'provider@123';

interface Spec {
  email: string;
  firstName: string;
  lastName: string;
  /** Member type (omit for admin-only accounts). */
  accountType?: AccountType;
  /** Organisation name for provider types. */
  org?: string;
  adminRole?: AdminRole;
}

const SPECS: Spec[] = [
  { email: 'jobseeker@workarmy.com', firstName: 'Jamie', lastName: 'Seeker', accountType: 'JOB_SEEKER' },
  { email: 'employer@workarmy.com', firstName: 'Erin', lastName: 'Employer', accountType: 'EMPLOYER', org: 'Test Employer Pty Ltd' },
  { email: 'farm@workarmy.com', firstName: 'Fran', lastName: 'Farmer', accountType: 'FARM', org: 'Test Farm' },
  { email: 'contractor@workarmy.com', firstName: 'Cory', lastName: 'Contractor', accountType: 'CONTRACTOR', org: 'Test Contracting' },
  { email: 'labourhire@workarmy.com', firstName: 'Lee', lastName: 'Hire', accountType: 'LABOUR_HIRE', org: 'Test Labour Hire' },
  { email: 'recruitment@workarmy.com', firstName: 'Riya', lastName: 'Recruiter', accountType: 'RECRUITMENT_AGENCY', org: 'Test Recruitment' },
  { email: 'admin@workarmy.com', firstName: 'Sam', lastName: 'Admin', adminRole: 'SUPER_ADMIN' },
  { email: 'subadmin@workarmy.com', firstName: 'Sue', lastName: 'SubAdmin', adminRole: 'SUB_ADMIN' },
];

const PROVIDER_TYPES: AccountType[] = ['EMPLOYER', 'FARM', 'CONTRACTOR', 'LABOUR_HIRE', 'RECRUITMENT_AGENCY'];

async function ensureCounter() {
  await prisma.waIdCounter.upsert({
    where: { id: 'GLOBAL' },
    update: {},
    create: { id: 'GLOBAL', lastValue: 100000n },
  });
}

async function ensure(spec: Spec, passwordHash: string) {
  const email = spec.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: { passwordHash, emailVerified: true, status: 'ACTIVE', adminRole: spec.adminRole ?? null },
    });
    console.log(`↻ reset password: ${email}`);
    return;
  }

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email,
        passwordHash,
        emailVerified: true,
        status: 'ACTIVE',
        adminRole: spec.adminRole ?? null,
        identities: { create: { provider: 'LOCAL', providerUserId: email } },
      },
    });

    // Admin-only accounts have no person/org (admins are auth users).
    if (!spec.accountType) return;

    const waId = await allocateWaId(tx);
    const person = await tx.person.create({
      data: {
        userId: user.id,
        waId,
        accountType: spec.accountType,
        firstName: spec.firstName,
        lastName: spec.lastName,
        mobile: '0400000000',
      },
    });

    if (PROVIDER_TYPES.includes(spec.accountType)) {
      const orgWaId = await allocateWaId(tx);
      await tx.organisation.create({
        data: {
          waId: orgWaId,
          accountType: spec.accountType,
          name: spec.org ?? `${spec.firstName} ${spec.lastName}`,
          members: { create: { personId: person.id, role: 'owner' } },
          profile: { create: {} },
          verifications: { create: { status: 'PENDING' } },
        },
      });
    }
  });
  console.log(`✓ created: ${email} (${spec.adminRole ?? spec.accountType})`);
}

async function main() {
  await ensureCounter();
  const passwordHash = await hashPassword(PASSWORD);
  for (const spec of SPECS) {
    await ensure(spec, passwordHash);
  }
  console.log(`\nAll test accounts ready. Password for every account: ${PASSWORD}`);
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
