import type { IconName, LabelKey } from '@workarmy/ui';

export interface SectionGroup {
  title: string;
  items: string[];
}

export interface DashboardSection {
  /** 'home' is special — it renders the live overview at the /dashboard index. */
  slug: string;
  navLabelKey: LabelKey;
  icon: IconName;
  title: string;
  intro?: string;
  groups: SectionGroup[];
}

/**
 * Single source of truth for the Job Seeker dashboard. Drives the sidebar and
 * the dynamic [section] route. Feature lists come straight from the v2.0 spec;
 * each is a "Planned" placeholder until its sprint lands.
 */
export const DASHBOARD_SECTIONS: DashboardSection[] = [
  {
    slug: 'home',
    navLabelKey: 'dashboard.nav.home',
    icon: 'home',
    title: 'Home',
    groups: [],
  },
  {
    slug: 'profile',
    navLabelKey: 'dashboard.nav.profile',
    icon: 'user',
    title: 'My Profile',
    intro: 'Your personal, professional and availability details.',
    groups: [
      {
        title: 'Personal information',
        items: [
          'Profile photo',
          'First & last name',
          'Date of birth',
          'Gender',
          'Nationality',
          'Address',
          'Mobile & email',
          'Emergency contact',
        ],
      },
      {
        title: 'Professional information',
        items: ['Professional summary', 'About me', 'Skills', 'Industries', 'Languages spoken'],
      },
      {
        title: 'Employment history',
        items: ['Current employer', 'Previous employers', 'Work experience', 'References'],
      },
      {
        title: 'Availability',
        items: [
          'Full time / part time / casual',
          'Seasonal / contract',
          'Available days & hours',
          'Blackout dates',
        ],
      },
      {
        title: 'Hire-me status',
        items: [
          'Available immediately',
          'Available soon',
          'Open to opportunities',
          'Not currently looking',
        ],
      },
      {
        title: 'Public profile',
        items: ['Share profile link', 'Download profile PDF', 'Generate public resume'],
      },
    ],
  },
  {
    slug: 'qualifications',
    navLabelKey: 'dashboard.nav.qualifications',
    icon: 'award',
    title: 'Qualifications & Compliance',
    intro: 'Credentials and verification — kept separate from profile completeness.',
    groups: [
      {
        title: 'Qualifications',
        items: ['Certificates', 'Diplomas', 'Degrees', 'Trade qualifications'],
      },
      {
        title: 'Licences',
        items: [
          'Driver licence',
          'Forklift licence',
          'White card',
          'Security licence',
          'Working with children check',
          'First aid certificate',
        ],
      },
      {
        title: 'Verification centre',
        items: ['100-point ID check', 'Right to work check', 'Visa verification', 'Police check'],
      },
      {
        title: 'Compliance management',
        items: ['Expiry tracking', 'Renewal alerts', 'Compliance notifications'],
      },
      {
        title: 'Verification badges',
        items: [
          'Verified Job Seeker',
          'Verified licence',
          'Verified identity',
          'Verified right to work',
        ],
      },
    ],
  },
  {
    slug: 'resume',
    navLabelKey: 'dashboard.nav.resume',
    icon: 'file',
    title: 'Resume Centre',
    intro: 'Build, manage and share your resume, cover letters and portfolio.',
    groups: [
      {
        title: 'Resume builder',
        items: ['Create resume', 'Edit resume', 'AI resume suggestions', 'Resume templates'],
      },
      { title: 'Resume management', items: ['Upload resume', 'Download resume', 'Share resume'] },
      {
        title: 'Cover letter builder',
        items: ['Create cover letter', 'Save templates', 'Share cover letter'],
      },
      {
        title: 'Digital portfolio',
        items: ['Photos', 'Certificates', 'Licences', 'Project work', 'Work samples'],
      },
    ],
  },
  {
    slug: 'preferences',
    navLabelKey: 'dashboard.nav.preferences',
    icon: 'sliders',
    title: 'Job Preferences',
    intro: 'Tell us what and where you want to work — drives your matches.',
    groups: [
      {
        title: 'Preferred locations (max 3)',
        items: ['Up to 3 locations', 'Near me', 'Anywhere in Australia'],
      },
      {
        title: 'Preferred industries',
        items: [
          'Agriculture',
          'Warehousing',
          'Hospitality',
          'Healthcare',
          'Construction',
          'Logistics',
        ],
      },
      {
        title: 'Preferred job types',
        items: [
          'Any suitable job',
          'Farm jobs',
          'Warehouse jobs',
          'Pick & pack',
          'Support work',
          'Healthcare',
          'Hospitality',
          'Construction',
          'Trades',
        ],
      },
      {
        title: 'Job seeker category',
        items: [
          'Permanent / casual / seasonal',
          'Backpacker',
          'Apprentice / trainee',
          'Volunteer',
          'Skilled / professional worker',
          'Farm worker / labourer / tradesperson',
          'Healthcare / hospitality',
          'Warehouse / logistics',
          'Job-ready worker',
          'Other',
        ],
      },
    ],
  },
  {
    slug: 'jobs',
    navLabelKey: 'dashboard.nav.jobs',
    icon: 'search',
    title: 'Jobs & Applications',
    intro: 'Find work, track applications and manage interviews.',
    groups: [
      {
        title: 'Find jobs',
        items: ['Recommended', 'Nearby', 'Urgent', 'Seasonal', 'Featured'],
      },
      { title: 'Saved jobs', items: ['Save job', 'Remove saved job', 'Job alerts'] },
      {
        title: 'Applications',
        items: ['Applied', 'Under review', 'Interview', 'Offered', 'Hired', 'Rejected'],
      },
      {
        title: 'Interviews',
        items: ['Upcoming interviews', 'Video interviews', 'Interview notes', 'Reminders'],
      },
      { title: 'Referrals', items: ['Refer friends', 'Referral rewards', 'Referral tracking'] },
    ],
  },
  {
    slug: 'worker-id',
    navLabelKey: 'dashboard.nav.workerId',
    icon: 'idCard',
    title: 'Digital Worker Identity',
    intro: 'Your portable, verifiable identity on site and online.',
    groups: [
      {
        title: 'Digital Worker ID card',
        items: ['Worker photo', 'Worker number (WA ID)', 'Verification status'],
      },
      {
        title: 'QR Worker Pass',
        items: ['Site check-in', 'Identity verification', 'Workforce validation'],
      },
      { title: 'Digital resume', items: ['Share link', 'QR access', 'Employer access'] },
    ],
  },
  {
    slug: 'work',
    navLabelKey: 'dashboard.nav.work',
    icon: 'wallet',
    title: 'Work & Earnings',
    intro: 'Shifts, timesheets, attendance, earnings and payslips.',
    groups: [
      {
        title: 'Current work',
        items: ['Current employer', 'Current site', 'Current position', 'Current shift'],
      },
      {
        title: 'Shift management',
        items: ['Upcoming shifts', 'Shift calendar', 'Shift swaps', 'Open shifts'],
      },
      {
        title: 'Timesheets',
        items: ['Daily timesheets', 'Weekly timesheets', 'Approved hours'],
      },
      {
        title: 'Attendance',
        items: ['Clock in', 'Clock out', 'GPS attendance', 'Geofence validation'],
      },
      { title: 'Earnings', items: ['Weekly', 'Monthly', 'Annual'] },
      { title: 'Payslips', items: ['Current payslips', 'Payslip history', 'Download PDF'] },
      {
        title: 'Work records',
        items: ['Employment history', 'Hours worked', 'Performance history', 'Previous employers'],
      },
    ],
  },
  {
    slug: 'community',
    navLabelKey: 'dashboard.nav.community',
    icon: 'users',
    title: 'Community & Career Development',
    intro: 'Knowledge, learning, training and worker community.',
    groups: [
      {
        title: 'Knowledge hub',
        items: [
          'Work rights',
          'Fair Work information',
          'Award rates',
          'Tax information',
          'Superannuation',
        ],
      },
      {
        title: 'Learning centre',
        items: [
          'Resume writing',
          'Interview skills',
          'Workplace communication',
          'Leadership skills',
        ],
      },
      { title: 'Training centre', items: ['Online courses', 'Safety training', 'Certifications'] },
      { title: 'Community hub', items: ['Worker groups', 'Regional groups', 'Industry groups'] },
      {
        title: 'Feedback & suggestions',
        items: ['Submit ideas', 'Product feedback', 'Feature requests'],
      },
      { title: 'Success stories', items: ['Worker success stories', 'Career pathways'] },
    ],
  },
  {
    slug: 'support',
    navLabelKey: 'dashboard.nav.support',
    icon: 'lifebuoy',
    title: 'Support Centre',
    intro: 'Help, messages, notifications, incident reporting and settings.',
    groups: [
      { title: 'Support hub', items: ['Help centre', 'FAQs', 'Contact support'] },
      {
        title: 'Report issues',
        items: [
          'Workplace issues',
          'Payroll issues',
          'Safety issues',
          'Accommodation issues',
          'Transport issues',
        ],
      },
      {
        title: 'Emergency support',
        items: ['Emergency contact', 'Workplace incident reporting'],
      },
      {
        title: 'Communications',
        items: [
          'Messages: employers / recruiters / agencies',
          'Notifications: jobs / interviews / compliance / messages',
        ],
      },
      {
        title: 'Settings',
        items: ['Security', 'MFA', 'Privacy', 'Notification preferences', 'Language preferences'],
      },
    ],
  },
  {
    slug: 'services',
    navLabelKey: 'dashboard.nav.services',
    icon: 'gift',
    title: 'Workforce Services',
    intro: 'Accommodation, transport, finance, wellbeing and rewards.',
    groups: [
      {
        title: 'Accommodation hub',
        items: ['I have accommodation', 'I need accommodation', 'Share accommodation'],
      },
      {
        title: 'Transport hub',
        items: ['I have transport', 'I need transport', 'Ride-share opportunities'],
      },
      {
        title: 'Financial services',
        items: ['Tax return assistance', 'Superannuation tracking', 'Worker insurance hub'],
      },
      {
        title: 'Career services',
        items: ['AI career advisor', 'AI job matching', 'Career planning'],
      },
      {
        title: 'Wellbeing services',
        items: ['Wellness resources', 'Mental health support', 'Employee assistance programs'],
      },
      { title: 'Family services', items: ['Family & dependent management', 'Emergency contacts'] },
      {
        title: 'Rewards program',
        items: ['Marketplace discounts', 'Loyalty rewards', 'Referral bonuses'],
      },
    ],
  },
];

export function sectionHref(slug: string): string {
  return slug === 'home' ? '/dashboard' : `/dashboard/${slug}`;
}

export function getSection(slug: string): DashboardSection | undefined {
  return DASHBOARD_SECTIONS.find((s) => s.slug === slug);
}

/** Slugs that have their own stub page (everything except the live Home). */
export const STUB_SLUGS = DASHBOARD_SECTIONS.filter((s) => s.slug !== 'home').map((s) => s.slug);
