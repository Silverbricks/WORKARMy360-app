import type { AccountType } from '@workarmy/types';
import type { IconName } from '@workarmy/ui';

export type SectionKind = 'home' | 'profile' | 'jobs' | 'stub';

export interface SectionGroup {
  title: string;
  items: string[];
}

export interface SectionDef {
  slug: string;
  navLabel: string;
  icon: IconName;
  kind: SectionKind;
  title: string;
  intro?: string;
  groups?: SectionGroup[];
}

const home: SectionDef = { slug: 'home', navLabel: 'Home', icon: 'home', kind: 'home', title: 'Home' };

const documents: SectionDef = {
  slug: 'documents',
  navLabel: 'Documents',
  icon: 'file',
  kind: 'stub',
  title: 'Documents',
  intro: 'Upload and manage your organisation’s documents.',
  groups: [{ title: 'Documents', items: ['Upload', 'Categories', 'Expiry tracking'] }],
};

const compliance: SectionDef = {
  slug: 'compliance',
  navLabel: 'Compliance',
  icon: 'shield',
  kind: 'stub',
  title: 'Compliance',
  intro: 'Insurances, licences and verification — kept separate from profile completeness.',
  groups: [
    { title: 'Insurance & licences', items: ['Public liability', 'Workers’ comp', 'Labour-hire licence'] },
    { title: 'Verification', items: ['ABN check', 'Status badges', 'Renewal alerts'] },
  ],
};

const billing: SectionDef = {
  slug: 'billing',
  navLabel: 'Billing',
  icon: 'wallet',
  kind: 'stub',
  title: 'Billing',
  intro: 'Membership and invoices.',
  groups: [{ title: 'Billing', items: ['Plan', 'Payment method', 'Invoices'] }],
};

const profile = (navLabel: string): SectionDef => ({
  slug: 'profile',
  navLabel,
  icon: 'building',
  kind: 'profile',
  title: navLabel,
  intro: 'Your organisation’s public profile. Drives completeness and matching.',
});

const jobs = (navLabel: string): SectionDef => ({
  slug: 'jobs',
  navLabel,
  icon: 'briefcase',
  kind: 'jobs',
  title: navLabel,
  intro: 'Post work, publish it, and manage applicants through the hiring pipeline.',
});

const stub = (slug: string, navLabel: string, icon: IconName, groups: SectionGroup[]): SectionDef => ({
  slug,
  navLabel,
  icon,
  kind: 'stub',
  title: navLabel,
  groups,
});

export const SECTIONS_BY_ACCOUNT_TYPE: Record<AccountType, SectionDef[]> = {
  JOB_SEEKER: [home],
  EMPLOYER: [
    home,
    profile('Company Profile'),
    jobs('Jobs'),
    stub('team', 'Team', 'users', [{ title: 'Team', items: ['Invite teammates', 'Roles & permissions'] }]),
    documents,
    compliance,
    billing,
  ],
  FARM: [
    home,
    profile('Farm Profile'),
    jobs('Seasonal Jobs'),
    stub('workforce', 'Workforce', 'users', [
      { title: 'Crews', items: ['Crew rosters', 'Harvest teams', 'Supervisors'] },
    ]),
    stub('accommodation', 'Accommodation', 'home', [
      { title: 'Accommodation', items: ['Listings', 'Allocations'] },
    ]),
    documents,
    compliance,
  ],
  CONTRACTOR: [
    home,
    profile('Contractor Profile'),
    jobs('Projects'),
    stub('invitations', 'Invitations', 'mail', [
      { title: 'Invitations', items: ['Open invitations', 'Quotes'] },
    ]),
    documents,
    compliance,
    billing,
  ],
  LABOUR_HIRE: [
    home,
    profile('Agency Profile'),
    jobs('Jobs'),
    stub('workforce', 'Workforce', 'users', [
      { title: 'Workforce', items: ['Supplied workers', 'Availability'] },
    ]),
    stub('clients', 'Clients', 'building', [{ title: 'Clients', items: ['Client list', 'Placements'] }]),
    documents,
    compliance,
    billing,
  ],
  RECRUITMENT_AGENCY: [
    home,
    profile('Agency Profile'),
    jobs('Jobs'),
    stub('candidates', 'Candidates', 'users', [
      { title: 'Pipeline', items: ['Sourced', 'Shortlists', 'Placements'] },
    ]),
    stub('clients', 'Clients', 'building', [{ title: 'Clients', items: ['Client list', 'Roles'] }]),
    documents,
    billing,
  ],
};

export function getSections(accountType: AccountType): SectionDef[] {
  return SECTIONS_BY_ACCOUNT_TYPE[accountType] ?? SECTIONS_BY_ACCOUNT_TYPE.EMPLOYER;
}

export function getSection(accountType: AccountType, slug: string): SectionDef | undefined {
  return getSections(accountType).find((s) => s.slug === slug);
}

/** Union of all non-home slugs (for generateStaticParams). */
export const ALL_SECTION_SLUGS: string[] = Array.from(
  new Set(
    Object.values(SECTIONS_BY_ACCOUNT_TYPE)
      .flat()
      .map((s) => s.slug)
      .filter((s) => s !== 'home'),
  ),
);
