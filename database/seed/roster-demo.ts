import { hashPassword } from '@workarmy/auth';
import type { RosterSource } from '@prisma/client';
import { prisma } from '../src/client';
import { allocateWaId } from '../src/wa-id';

/**
 * Seed a demo workforce into ONE organisation so the roster is immediately
 * exercisable: workers with varied sources, a team, sites (real AU suburbs so
 * the Weather module geocodes), and a couple of credentials + a leave record so
 * the conflict/gate smarts actually show. Idempotent.
 *
 *   Target org:  SEED_ORG_EMAIL env or argv[2] (owner's login email);
 *                falls back to the oldest organisation.
 *   Worker pw:   SEED_TEST_PASSWORD env (default below). All demo workers share it.
 *
 * Run on the server:
 *   cd /var/www/workarmy && SEED_ORG_EMAIL=biz@workarmy.au \
 *     pnpm --filter @workarmy/database exec tsx seed/roster-demo.ts
 */
const PASSWORD = process.env.SEED_TEST_PASSWORD ?? 'Worker#2026';

interface WorkerSpec {
  first: string;
  last: string;
  mobile: string;
  skills: string;
  suburb: string;
  state: string;
  source: RosterSource;
  staffType: string;
  onCall?: boolean;
  urgent?: boolean;
  team?: boolean;
}

const WORKERS: WorkerSpec[] = [
  { first: 'John', last: 'Smith', mobile: '0412000001', skills: 'Fruit Picker, Forklift, First Aid', suburb: 'Shepparton', state: 'VIC', source: 'COMPANY', staffType: 'Picker', onCall: true, team: true },
  { first: 'Emma', last: 'Brown', mobile: '0412000002', skills: 'Pack Shed, Team Lead', suburb: 'Shepparton', state: 'VIC', source: 'COMPANY', staffType: 'Pack lead', team: true },
  { first: 'David', last: 'Lee', mobile: '0412000003', skills: 'Tractor, Machinery, White Card', suburb: 'Mildura', state: 'VIC', source: 'CONTRACTOR', staffType: 'Tractor op' },
  { first: 'Aisha', last: 'Khan', mobile: '0412000004', skills: 'Fruit Picker, Packing', suburb: 'Mildura', state: 'VIC', source: 'AGENCY', staffType: 'Picker', urgent: true },
  { first: 'Liam', last: 'Nguyen', mobile: '0412000005', skills: 'Pruner, Harvest', suburb: 'Bendigo', state: 'VIC', source: 'SOLE_TRADER', staffType: 'Pruner', team: true },
  { first: 'Sofia', last: 'Garcia', mobile: '0412000006', skills: 'Fruit Picker, Aged Care', suburb: 'Bendigo', state: 'VIC', source: 'AGENCY', staffType: 'Picker', urgent: true },
];

const SITES = [
  { name: 'Block A — North', suburb: 'Shepparton', state: 'VIC' },
  { name: 'Packing Shed 2', suburb: 'Shepparton', state: 'VIC' },
];

function nameOf(w: WorkerSpec) {
  return `${w.first} ${w.last}`;
}
function isoDate(offsetDays: number) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

async function resolveOrgId(): Promise<string> {
  const email = (process.env.SEED_ORG_EMAIL ?? process.argv[2] ?? 'biz@workarmy.au').toLowerCase();
  const owner = await prisma.user.findUnique({
    where: { email },
    include: { person: { include: { orgMemberships: { orderBy: { createdAt: 'asc' }, take: 1 } } } },
  });
  const fromOwner = owner?.person?.orgMemberships[0]?.orgId ?? null;
  if (fromOwner) return fromOwner;
  const org = await prisma.organisation.findFirst({ orderBy: { createdAt: 'asc' } });
  if (!org) throw new Error('No organisation found to seed into. Create a provider account first.');
  console.log(`(no org for ${email} — using oldest org "${org.name}")`);
  return org.id;
}

async function ensureWorkerPerson(w: WorkerSpec, passwordHash: string): Promise<string> {
  const email = `${w.first}.${w.last}@demo.workarmy.au`.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email }, include: { person: true } });
  if (existing?.person) return existing.person.id;

  return prisma.$transaction(async (tx) => {
    const waId = await allocateWaId(tx);
    const user = await tx.user.create({
      data: {
        email,
        passwordHash,
        emailVerified: true,
        status: 'ACTIVE',
        identities: { create: { provider: 'LOCAL', providerUserId: email } },
      },
    });
    const person = await tx.person.create({
      data: {
        userId: user.id,
        waId,
        accountType: 'JOB_SEEKER',
        firstName: w.first,
        lastName: w.last,
        mobile: w.mobile,
        mobileVerified: true,
        profile: {
          create: { skills: w.skills, suburb: w.suburb, state: w.state, availability: 'casual', hireStatus: 'AVAILABLE_NOW' },
        },
      },
    });
    return person.id;
  });
}

async function main() {
  await prisma.waIdCounter.upsert({ where: { id: 'GLOBAL' }, update: {}, create: { id: 'GLOBAL', lastValue: 100000n } });
  const orgId = await resolveOrgId();
  const passwordHash = await hashPassword(PASSWORD);

  // Team
  let team = await prisma.team.findFirst({ where: { orgId, name: 'Farm Team' } });
  if (!team) team = await prisma.team.create({ data: { orgId, name: 'Farm Team', description: 'Seasonal farm crew' } });

  // Sites
  for (const s of SITES) {
    const exists = await prisma.site.findFirst({ where: { orgId, name: s.name } });
    if (!exists) await prisma.site.create({ data: { orgId, ...s } });
  }

  // Workers → persons + OrgWorker links
  const personByName = new Map<string, string>();
  for (const w of WORKERS) {
    const personId = await ensureWorkerPerson(w, passwordHash);
    personByName.set(nameOf(w), personId);
    await prisma.orgWorker.upsert({
      where: { orgId_personId: { orgId, personId } },
      update: { staffType: w.staffType, source: w.source, onCall: !!w.onCall, urgentAvailable: !!w.urgent, teamId: w.team ? team.id : null, active: true },
      create: { orgId, personId, staffType: w.staffType, source: w.source, onCall: !!w.onCall, urgentAvailable: !!w.urgent, teamId: w.team ? team.id : null, active: true },
      });
    if (w.team) {
      const tm = await prisma.teamMember.findFirst({ where: { teamId: team.id, personId } });
      if (!tm) await prisma.teamMember.create({ data: { teamId: team.id, personId, roleInTeam: w.staffType } });
    }
  }

  // Credentials — one expired right-to-work (triggers CREDENTIAL_EXPIRED when the
  // Agriculture gate is on) + one valid White Card.
  const sofia = personByName.get('Sofia Garcia');
  if (sofia) {
    const has = await prisma.credential.findFirst({ where: { personId: sofia, type: 'right-to-work' } });
    if (!has) await prisma.credential.create({ data: { personId: sofia, type: 'right-to-work', identifier: 'Subclass 417', expiresAt: new Date(isoDate(-20)) } });
  }
  const david = personByName.get('David Lee');
  if (david) {
    const has = await prisma.credential.findFirst({ where: { personId: david, type: 'white-card' } });
    if (!has) await prisma.credential.create({ data: { personId: david, type: 'white-card', identifier: 'WC-88213', expiresAt: new Date(isoDate(365)) } });
  }

  // Approved leave for Emma this week (triggers ON_LEAVE by name match).
  const leaveExists = await prisma.leaveRequest.findFirst({ where: { orgId, personName: 'Emma Brown', status: 'APPROVED' } });
  if (!leaveExists) {
    await prisma.leaveRequest.create({
      data: { orgId, personName: 'Emma Brown', type: 'ANNUAL', startDate: isoDate(0), endDate: isoDate(4), status: 'APPROVED', reason: 'Annual leave (demo)' },
    });
  }

  console.log(`\n✓ Demo workforce seeded into org ${orgId}`);
  console.log(`  ${WORKERS.length} workers (sources: company/contractor/agency/sole trader), 1 team, ${SITES.length} sites`);
  console.log(`  + 1 expired visa (Sofia), 1 White Card (David), approved leave (Emma this week)`);
  console.log(`  Worker logins: <first>.<last>@demo.workarmy.au · password: ${PASSWORD}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
