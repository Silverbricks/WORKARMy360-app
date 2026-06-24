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
 * Grouped navigation for the Job Seeker dashboard. Each item links to an existing
 * section route, deep-linking a tab with `?tab=` where the section has tabs.
 */
export const DASHBOARD_NAV: NavGroup[] = [
  {
    title: null,
    items: [{ label: 'Home', href: '/dashboard', icon: 'home' }],
  },
  {
    title: 'My Career',
    items: [
      { label: 'Resume Centre', href: '/dashboard/resume', icon: 'file' },
      { label: 'Find Jobs', href: '/dashboard/jobs?tab=find', icon: 'search' },
      { label: 'Applications', href: '/dashboard/jobs?tab=applied', icon: 'briefcase' },
      { label: 'Saved Jobs', href: '/dashboard/jobs?tab=saved', icon: 'star' },
      { label: 'Interviews', href: '/dashboard/jobs?tab=interviews', icon: 'calendar' },
      { label: 'Job Preferences', href: '/dashboard/preferences', icon: 'sliders' },
    ],
  },
  {
    title: 'Shifts & Work',
    items: [
      { label: 'Find Shifts', href: '/dashboard/work?tab=shifts', icon: 'calendar' },
      { label: 'Timesheets', href: '/dashboard/work?tab=timesheets', icon: 'clock' },
      { label: 'Payslips', href: '/dashboard/work?tab=payslips', icon: 'wallet' },
      { label: 'Work Record', href: '/dashboard/work?tab=employers', icon: 'briefcase' },
    ],
  },
  {
    title: 'Profile & ID',
    items: [
      { label: 'My Profile', href: '/dashboard/profile', icon: 'user' },
      { label: 'Worker ID', href: '/dashboard/worker-id', icon: 'idCard' },
      { label: 'Share with Employers', href: '/dashboard/share', icon: 'share' },
      { label: 'Qualifications', href: '/dashboard/qualifications', icon: 'award' },
    ],
  },
  {
    title: 'My Employers',
    items: [{ label: 'My Employers', href: '/dashboard/work?tab=employers', icon: 'building' }],
  },
  {
    title: 'Community & Growth',
    items: [
      { label: 'Community', href: '/dashboard/community', icon: 'users' },
      { label: 'Workforce Services', href: '/dashboard/services', icon: 'gift' },
    ],
  },
  {
    title: 'Support',
    items: [
      { label: 'Support Centre', href: '/dashboard/support', icon: 'lifebuoy' },
      { label: 'Messages', href: '/dashboard/support?tab=messages', icon: 'message', badge: 'messages' },
      {
        label: 'Notifications',
        href: '/dashboard/support?tab=notifications',
        icon: 'bell',
        badge: 'notifications',
      },
    ],
  },
  {
    title: 'Add-ons',
    items: [
      { label: 'Manual Timesheet', href: '/dashboard/manual-timesheet', icon: 'clock' },
      { label: 'Feedback', href: '/dashboard/feedback', icon: 'message' },
      { label: 'Suggestion Box', href: '/dashboard/suggestion', icon: 'star' },
      { label: 'Incident Form', href: '/dashboard/incident', icon: 'alertTriangle' },
      { label: 'Report Form', href: '/dashboard/report', icon: 'file' },
    ],
  },
];

/** Add-on / share routes that aren't part of DASHBOARD_SECTIONS but are valid pages. */
export const EXTRA_SLUGS = [
  'share',
  'manual-timesheet',
  'feedback',
  'suggestion',
  'incident',
  'report',
] as const;
