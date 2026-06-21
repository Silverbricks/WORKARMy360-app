/**
 * The labels layer (Principle 3). Every user-facing string is a key here,
 * decoupled from schema and routes. Renaming "Find Work" never touches the DB.
 */
export const enAU = {
  'brand.name': 'WorkArmy',

  // Public navigation
  'nav.findWork': 'Find Work',
  'nav.forEmployers': 'For Employers',
  'nav.forFarms': 'For Farms',
  'nav.forContractors': 'For Contractors',
  'nav.forLabourHire': 'For Labour Hire',
  'nav.forRecruitment': 'For Recruitment Agencies',
  'nav.login': 'Login',
  'nav.register': 'Register',

  // Home / hero
  'home.hero.title': 'Australia’s workforce, connected.',
  'home.hero.subtitle':
    'One platform for finding work and finding staff — across farms, trades, care, hospitality and more.',
  'home.selector.heading': 'I am a…',
  'home.selector.cta': 'Get started',

  // Participant cards
  'participant.jobSeeker.title': 'Job Seeker',
  'participant.jobSeeker.desc': 'Find work, apply and get hired.',
  'participant.employer.title': 'Employer',
  'participant.employer.desc': 'Post jobs and hire staff.',
  'participant.farm.title': 'Farm',
  'participant.farm.desc': 'Recruit seasonal and permanent crews.',
  'participant.contractor.title': 'Contractor',
  'participant.contractor.desc': 'Win projects and supply labour.',
  'participant.labourHire.title': 'Labour Hire Agency',
  'participant.labourHire.desc': 'Employ and supply workers to clients.',
  'participant.recruitment.title': 'Recruitment Agency',
  'participant.recruitment.desc': 'Source and place candidates.',

  // Auth — shared
  'auth.email.label': 'Work email',
  'auth.password.label': 'Password',
  'auth.firstName.label': 'First name',
  'auth.lastName.label': 'Last name',
  'auth.mobile.label': 'Mobile number',
  'auth.haveAccount': 'Already have an account?',
  'auth.noAccount': 'New to WorkArmy?',

  // Register
  'auth.register.title': 'Create your account',
  'auth.register.subtitle': 'Under 30 seconds — no business details needed yet.',
  'auth.register.submit': 'Create account',
  'auth.register.toLogin': 'Log in',

  // Verify
  'auth.verify.title': 'Verify your email',
  'auth.verify.subtitle': 'Enter the 6-digit code we sent to {email}.',
  'auth.verify.submit': 'Verify email',
  'auth.verify.resend': 'Resend code',
  'auth.verify.resent': 'A new code is on its way.',

  // Login
  'auth.login.title': 'Welcome back',
  'auth.login.subtitle': 'Log in to your WorkArmy account.',
  'auth.login.submit': 'Log in',
  'auth.login.forgot': 'Forgot password?',
  'auth.login.toRegister': 'Create one',

  // Forgot / reset
  'auth.forgot.title': 'Reset your password',
  'auth.forgot.subtitle': 'Enter your email and we’ll send a reset link.',
  'auth.forgot.submit': 'Send reset link',
  'auth.forgot.sent': 'If that email exists, a reset link is on its way.',
  'auth.reset.title': 'Choose a new password',
  'auth.reset.subtitle': 'Pick a strong password you don’t use elsewhere.',
  'auth.reset.submit': 'Update password',
  'auth.reset.done': 'Your password has been updated. You can log in now.',

  // Dashboard stub
  'dashboard.greeting': 'Welcome{name}',
  'dashboard.profileStatus.label': 'Profile status',
  'dashboard.profileStatus.incomplete': 'Incomplete',
  'dashboard.profileStatus.complete': 'Complete',
  'dashboard.waId.label': 'WorkArmy ID',
  'dashboard.completeProfile.cta': 'Complete your profile',
  'dashboard.findWork.cta': 'Find work',
  'dashboard.logout': 'Log out',

  // Dashboard navigation
  'dashboard.nav.home': 'Home',
  'dashboard.nav.profile': 'My Profile',
  'dashboard.nav.qualifications': 'Qualifications & Compliance',
  'dashboard.nav.resume': 'Resume Centre',
  'dashboard.nav.preferences': 'Job Preferences',
  'dashboard.nav.jobs': 'Jobs & Applications',
  'dashboard.nav.workerId': 'Digital Worker ID',
  'dashboard.nav.work': 'Work & Earnings',
  'dashboard.nav.community': 'Community & Development',
  'dashboard.nav.support': 'Support Centre',
  'dashboard.nav.services': 'Workforce Services',

  // Dashboard home widgets
  'dashboard.widget.profileCompletion': 'Profile completion',
  'dashboard.widget.verification': 'Verification status',
  'dashboard.widget.employment': 'Employment overview',
  'dashboard.widget.earnings': 'Earnings summary',
  'dashboard.widget.quickActions': 'Quick actions',
  'dashboard.widget.membership': 'Membership',
  'dashboard.membership.free': 'Free',
  'dashboard.verification.notStarted': 'Not started',
  'dashboard.planned': 'Planned',

  // Common
  'common.loading': 'Loading…',
  'common.error.generic': 'Something went wrong. Please try again.',
  'common.required': 'Required',
} as const;
