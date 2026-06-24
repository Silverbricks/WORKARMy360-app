import { notFound } from 'next/navigation';
import { SectionStub } from '@/components/dashboard/SectionStub';
import { JobsApplicationsSection } from '@/components/dashboard/JobsApplicationsSection';
import { ProfileWizard } from '@/components/dashboard/ProfileWizard';
import { PreferencesSection } from '@/components/dashboard/PreferencesSection';
import { QualificationsSection } from '@/components/dashboard/QualificationsSection';
import { ResumeSection } from '@/components/dashboard/ResumeSection';
import { WorkerIdSection } from '@/components/dashboard/WorkerIdSection';
import { WorkSection } from '@/components/dashboard/WorkSection';
import { CommunitySection } from '@/components/dashboard/CommunitySection';
import { SupportSection } from '@/components/dashboard/SupportSection';
import { ServicesSection } from '@/components/dashboard/ServicesSection';
import { ShareProfileSection } from '@/components/dashboard/ShareProfileSection';
import { FeedbackSection } from '@/components/dashboard/FeedbackSection';
import { ReportTicketSection } from '@/components/dashboard/ReportTicketSection';
import { ManualTimesheetSection } from '@/components/dashboard/ManualTimesheetSection';
import { getSection, STUB_SLUGS } from '@/lib/dashboard-sections';
import { EXTRA_SLUGS } from '@/lib/dashboard-nav';

// Only the known sections are valid; anything else 404s. Fully static.
export const dynamicParams = false;

const VALID_SLUGS = [...STUB_SLUGS, ...EXTRA_SLUGS];

export function generateStaticParams() {
  return VALID_SLUGS.map((section) => ({ section }));
}

function sectionElement(slug: string, data: ReturnType<typeof getSection>) {
  switch (slug) {
    case 'profile':
      return <ProfileWizard />;
    case 'preferences':
      return <PreferencesSection />;
    case 'qualifications':
      return <QualificationsSection />;
    case 'resume':
      return <ResumeSection />;
    case 'worker-id':
      return <WorkerIdSection />;
    case 'work':
      return <WorkSection />;
    case 'community':
      return <CommunitySection />;
    case 'support':
      return <SupportSection />;
    case 'services':
      return <ServicesSection />;
    case 'jobs':
      return <JobsApplicationsSection />;
    // Add-ons & share
    case 'share':
      return <ShareProfileSection />;
    case 'manual-timesheet':
      return <ManualTimesheetSection />;
    case 'feedback':
      return <FeedbackSection variant="feedback" />;
    case 'suggestion':
      return <FeedbackSection variant="suggestion" />;
    case 'incident':
      return <ReportTicketSection variant="incident" />;
    case 'report':
      return <ReportTicketSection variant="report" />;
    default:
      return data ? <SectionStub section={data} /> : null;
  }
}

export default async function DashboardSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  if (!VALID_SLUGS.includes(section)) notFound();
  // Browsing every section is open once the OTP gate (handled in the shell) is passed.
  // Only the Apply action requires a verified profile (enforced in Jobs + backend).
  return sectionElement(section, getSection(section));
}
