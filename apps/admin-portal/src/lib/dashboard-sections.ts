import type { IconName } from '@workarmy/ui';

export type AdminSectionKind = 'home' | 'members' | 'verifications' | 'jobs' | 'stub';

export interface AdminSection {
  slug: string;
  navLabel: string;
  icon: IconName;
  kind: AdminSectionKind;
  title: string;
  intro?: string;
  groups?: { title: string; items: string[] }[];
}

export const ADMIN_SECTIONS: AdminSection[] = [
  { slug: 'home', navLabel: 'Dashboard', icon: 'home', kind: 'home', title: 'Dashboard' },
  {
    slug: 'members',
    navLabel: 'Member Directory',
    icon: 'users',
    kind: 'members',
    title: 'Member Directory',
    intro: 'People and organisations, by WorkArmy ID.',
  },
  {
    slug: 'verifications',
    navLabel: 'Verification Queue',
    icon: 'shield',
    kind: 'verifications',
    title: 'Verification Queue',
    intro: 'Approve or reject pending organisations.',
  },
  {
    slug: 'jobs',
    navLabel: 'Jobs Moderation',
    icon: 'briefcase',
    kind: 'jobs',
    title: 'Jobs Moderation',
    intro: 'Review and take down jobs.',
  },
  {
    slug: 'settings',
    navLabel: 'Settings',
    icon: 'settings',
    kind: 'stub',
    title: 'Settings',
    groups: [{ title: 'Platform', items: ['Feature flags', 'Sub-admins', 'Audit log'] }],
  },
];

export const ADMIN_SLUGS = ADMIN_SECTIONS.filter((s) => s.slug !== 'home').map((s) => s.slug);

export function getSection(slug: string): AdminSection | undefined {
  return ADMIN_SECTIONS.find((s) => s.slug === slug);
}
