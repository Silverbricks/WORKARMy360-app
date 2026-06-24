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
import { GatedSection } from '@/components/dashboard/GatedSection';
import { getSection, STUB_SLUGS } from '@/lib/dashboard-sections';

// Only the known sections are valid; anything else 404s. Fully static.
export const dynamicParams = false;

export function generateStaticParams() {
  return STUB_SLUGS.map((section) => ({ section }));
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
  const data = getSection(section);
  if (!data || data.slug === 'home') notFound();
  // Profile (the wizard) is always open; every other section is locked until the
  // profile is complete.
  return <GatedSection slug={data.slug}>{sectionElement(data.slug, data)}</GatedSection>;
}
