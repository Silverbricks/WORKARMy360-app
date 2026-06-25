import type { IconName } from '@workarmy/ui';

export interface NavItem {
  label: string;
  href: string;
  icon: IconName;
  /** Optional live badge source rendered in the topbar / sidebar. */
  badge?: 'messages' | 'notifications';
}

export interface NavGroup {
  /** null renders with no group header (the Overview group). */
  title: string | null;
  items: NavItem[];
}

/**
 * One unified Business/Employer dashboard nav, shown to every provider account
 * type (Employer, Farm, Contractor, Labour Hire, Recruitment). Items deep-link a
 * tab with `?tab=` where the section has tabs. Mirrors the Job Seeker app pattern.
 */
export const DASHBOARD_NAV: NavGroup[] = [
  {
    title: null,
    items: [{ label: 'Dashboard', href: '/dashboard', icon: 'home' }],
  },
  {
    title: 'Hiring',
    items: [
      { label: 'Find Job Seekers', href: '/dashboard/find-staff', icon: 'search' },
      { label: 'Post a Job', href: '/dashboard/jobs?tab=post', icon: 'plus' },
      { label: 'Jobs & Shifts', href: '/dashboard/jobs?tab=open', icon: 'briefcase' },
      { label: 'Applicants & Hiring', href: '/dashboard/jobs?tab=applicants', icon: 'users' },
      { label: 'Shortlist & Interviews', href: '/dashboard/jobs?tab=interviews', icon: 'star' },
    ],
  },
  {
    title: 'Urgent & Bulk',
    items: [
      { label: 'Urgent & Bulk Staffing', href: '/dashboard/staffing?tab=urgent', icon: 'zap' },
      { label: 'Create Staff Request', href: '/dashboard/staff-request', icon: 'clipboard' },
      { label: 'Quick Dispatch', href: '/dashboard/dispatch', icon: 'send' },
    ],
  },
  {
    title: 'Staff',
    items: [
      { label: 'Staff Directory', href: '/dashboard/staff?tab=directory', icon: 'users' },
      { label: 'On-Call & Urgent', href: '/dashboard/staff?tab=oncall', icon: 'bell' },
      { label: 'My Workforce', href: '/dashboard/workforce', icon: 'users' },
      { label: 'Teams & Supervisors', href: '/dashboard/teams', icon: 'hardhat' },
      { label: 'Rosters', href: '/dashboard/rosters', icon: 'calendar' },
      { label: "Who's Turning Up", href: '/dashboard/rosters?tab=turnup', icon: 'check' },
      { label: 'Staff Calculator', href: '/dashboard/staff-calculator', icon: 'sliders' },
    ],
  },
  {
    title: 'HR',
    items: [
      { label: 'HR Overview', href: '/dashboard/hr', icon: 'briefcase' },
      { label: 'Leave', href: '/dashboard/hr?tab=leave', icon: 'calendar' },
      { label: 'HR Documents', href: '/dashboard/hr?tab=docs', icon: 'file' },
      { label: 'Reviews', href: '/dashboard/hr?tab=reviews', icon: 'star' },
      { label: 'Onboarding', href: '/dashboard/hr?tab=onboarding', icon: 'user' },
      { label: 'Warnings & Incidents', href: '/dashboard/hr?tab=warnings', icon: 'alertTriangle' },
    ],
  },
  {
    title: 'Operations',
    items: [
      { label: 'Task Management', href: '/dashboard/tasks', icon: 'clipboard' },
      { label: 'QR Clock-In', href: '/dashboard/qr', icon: 'qrcode' },
      { label: 'Timesheets', href: '/dashboard/operations?tab=timesheets', icon: 'clock' },
      { label: 'Attendance', href: '/dashboard/operations?tab=attendance', icon: 'clock' },
      { label: 'Sites & Locations', href: '/dashboard/sites', icon: 'mapPin' },
      { label: 'Visitor Management', href: '/dashboard/visitors', icon: 'idCard' },
    ],
  },
  {
    title: 'Network',
    items: [
      { label: 'Service Providers & Agencies', href: '/dashboard/network', icon: 'building' },
      { label: 'Reports', href: '/dashboard/reports', icon: 'file' },
    ],
  },
  {
    title: 'Accounts',
    items: [
      { label: 'Pay Runs', href: '/dashboard/pay-runs', icon: 'wallet' },
      { label: 'Invoices, Quotes & Proposals', href: '/dashboard/accounts?tab=docs', icon: 'receipt' },
      { label: 'Piece Rates', href: '/dashboard/piece-rates', icon: 'sliders' },
      { label: 'Accounts & Billing', href: '/dashboard/billing', icon: 'wallet' },
    ],
  },
  {
    title: 'Business',
    items: [
      { label: 'Business Card & Page', href: '/dashboard/business-card', icon: 'idCard' },
      { label: 'My Requirements', href: '/dashboard/requirements', icon: 'lightbulb' },
    ],
  },
  {
    title: 'Compliance',
    items: [
      { label: 'Compliance Hub', href: '/dashboard/compliance', icon: 'shield' },
      { label: 'Verification', href: '/dashboard/compliance?tab=verify', icon: 'check' },
      { label: 'Documents', href: '/dashboard/documents', icon: 'file' },
      { label: 'Labour Hire Licence', href: '/dashboard/compliance?tab=lhl', icon: 'award' },
      { label: 'OH&S & Inductions', href: '/dashboard/compliance?tab=ohs', icon: 'hardhat' },
    ],
  },
  {
    title: 'Support',
    items: [
      { label: 'Messages', href: '/dashboard/support?tab=messages', icon: 'message', badge: 'messages' },
      {
        label: 'Notifications',
        href: '/dashboard/support?tab=notifications',
        icon: 'bell',
        badge: 'notifications',
      },
      { label: 'Support Hub', href: '/dashboard/support?tab=help', icon: 'lifebuoy' },
      { label: 'Feedback', href: '/dashboard/feedback', icon: 'message' },
      { label: 'FAQ', href: '/dashboard/support?tab=faq', icon: 'helpCircle' },
      { label: 'Settings', href: '/dashboard/support?tab=settings', icon: 'settings' },
    ],
  },
];

/**
 * Every valid `/dashboard/[section]` slug (home is the index route, excluded).
 * Source of truth for `generateStaticParams`. Includes account-menu-only slugs
 * (profile, team-admins, membership) not present in the sidebar nav.
 */
export const SECTION_SLUGS = [
  'find-staff',
  'jobs',
  'staffing',
  'staff-request',
  'dispatch',
  'staff',
  'workforce',
  'teams',
  'rosters',
  'staff-calculator',
  'hr',
  'tasks',
  'qr',
  'operations',
  'sites',
  'visitors',
  'network',
  'reports',
  'pay-runs',
  'accounts',
  'piece-rates',
  'billing',
  'business-card',
  'requirements',
  'compliance',
  'documents',
  'support',
  'feedback',
  // account-menu reachable
  'profile',
  'team-admins',
  'membership',
] as const;

export type SectionSlug = (typeof SECTION_SLUGS)[number];

/** Human label for a slug — used by the temporary "coming soon" stub. */
export function navLabelForSlug(slug: string): string {
  for (const group of DASHBOARD_NAV) {
    for (const item of group.items) {
      const path = item.href.split('?')[0];
      if (path === `/dashboard/${slug}`) return item.label;
    }
  }
  const fallback: Record<string, string> = {
    profile: 'Business Profile',
    'team-admins': 'Team & Admins',
    membership: 'Membership & Billing',
  };
  return fallback[slug] ?? slug;
}
