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
 * Grouped navigation for the Job Seeker dashboard. Each item links to a section
 * route, deep-linking a tab with `?tab=` where the section has tabs.
 */
export const DASHBOARD_NAV: NavGroup[] = [
  {
    title: null,
    items: [{ label: 'Dashboard', href: '/dashboard', icon: 'home' }],
  },
  {
    title: 'My Career',
    items: [
      { label: 'Get Job Faster', href: '/dashboard/get-job-faster', icon: 'zap' },
      { label: 'Resume Centre', href: '/dashboard/resume', icon: 'file' },
      { label: 'Find Jobs', href: '/dashboard/jobs?tab=find', icon: 'search' },
      { label: 'Applications', href: '/dashboard/jobs?tab=applied', icon: 'briefcase' },
      { label: 'Saved Jobs', href: '/dashboard/jobs?tab=saved', icon: 'star' },
      { label: 'Interviews', href: '/dashboard/jobs?tab=interviews', icon: 'calendar' },
      { label: 'Previous Jobs', href: '/dashboard/jobs?tab=previous', icon: 'clock' },
      { label: 'Job Preferences', href: '/dashboard/preferences', icon: 'sliders' },
    ],
  },
  {
    title: 'Shifts & Work',
    items: [
      { label: 'Find Shifts', href: '/dashboard/work?tab=shifts', icon: 'calendar' },
      { label: 'Swap Shifts', href: '/dashboard/swap-shifts', icon: 'repeat' },
      { label: 'Share Jobs & Shifts', href: '/dashboard/share-jobs', icon: 'share' },
      { label: 'My Timesheets', href: '/dashboard/work?tab=timesheets', icon: 'clock' },
      { label: 'Pay Slips', href: '/dashboard/work?tab=payslips', icon: 'wallet' },
      { label: 'Invoices', href: '/dashboard/invoices', icon: 'receipt' },
      { label: 'Lodge Tax Return', href: '/dashboard/lodge-tax', icon: 'file' },
      { label: 'Work Record', href: '/dashboard/work?tab=employers', icon: 'briefcase' },
      { label: 'Clock In / Out', href: '/dashboard/work?tab=shifts', icon: 'clock' },
    ],
  },
  {
    title: 'Profile & ID',
    items: [
      { label: 'Digital Worker ID', href: '/dashboard/worker-id', icon: 'idCard' },
      { label: 'Work Readiness', href: '/dashboard/work-readiness', icon: 'shield' },
      { label: 'Share with Employers', href: '/dashboard/share', icon: 'send' },
      { label: 'Qualifications', href: '/dashboard/qualifications', icon: 'award' },
      { label: 'Become a Provider', href: '/dashboard/work?tab=employers', icon: 'building' },
    ],
  },
  {
    title: 'My Employers',
    items: [
      { label: 'Current Employers', href: '/dashboard/employers?tab=current', icon: 'building' },
      { label: 'Previous Employers', href: '/dashboard/employers?tab=previous', icon: 'briefcase' },
    ],
  },
  {
    title: 'Community & Growth',
    items: [
      { label: 'Grow Time', href: '/dashboard/grow', icon: 'sprout' },
      { label: 'Knowledge Hub', href: '/dashboard/community?tab=knowledge', icon: 'file' },
      { label: 'Pools & Teams', href: '/dashboard/pools', icon: 'users' },
      { label: 'Share Your Ideas', href: '/dashboard/ideas', icon: 'lightbulb' },
      { label: 'Workforce Services', href: '/dashboard/services', icon: 'gift' },
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
      { label: 'FAQ', href: '/dashboard/support?tab=help', icon: 'helpCircle' },
      { label: 'Settings', href: '/dashboard/support?tab=settings', icon: 'settings' },
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
  {
    title: 'WorkArmy',
    items: [{ label: 'WorkArmy App', href: '/dashboard/app', icon: 'smartphone' }],
  },
];

/** Add-on / extra routes that aren't part of DASHBOARD_SECTIONS but are valid pages. */
export const EXTRA_SLUGS = [
  'share',
  'manual-timesheet',
  'feedback',
  'suggestion',
  'incident',
  'report',
  'get-job-faster',
  'work-readiness',
  'my-tax',
  'lodge-tax',
  'invoices',
  'swap-shifts',
  'share-jobs',
  'pools',
  'ideas',
  'grow',
  'app',
  'employers',
] as const;
