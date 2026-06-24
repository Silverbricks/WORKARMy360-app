import { notFound } from 'next/navigation';
import { SectionStub } from '@/components/dashboard/SectionStub';
import { JobsApplicationsSection } from '@/components/dashboard/JobsApplicationsSection';
import { ProfileSection } from '@/components/dashboard/ProfileSection';
import { PreferencesSection } from '@/components/dashboard/PreferencesSection';
import { QualificationsSection } from '@/components/dashboard/QualificationsSection';
import { ResumeSection } from '@/components/dashboard/ResumeSection';
import { WorkerIdSection } from '@/components/dashboard/WorkerIdSection';
import { WorkSection } from '@/components/dashboard/WorkSection';
import { CommunitySection } from '@/components/dashboard/CommunitySection';
import { getSection, STUB_SLUGS } from '@/lib/dashboard-sections';

// Only the known sections are valid; anything else 404s. Fully static.
export const dynamicParams = false;

export function generateStaticParams() {
  return STUB_SLUGS.map((section) => ({ section }));
}

export default async function DashboardSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  const data = getSection(section);
  if (!data || data.slug === 'home') notFound();
  // Live sections; the rest are shells.
  if (data.slug === 'profile') return <ProfileSection />;
  if (data.slug === 'preferences') return <PreferencesSection />;
  if (data.slug === 'qualifications') return <QualificationsSection />;
  if (data.slug === 'resume') return <ResumeSection />;
  if (data.slug === 'worker-id') return <WorkerIdSection />;
  if (data.slug === 'work') return <WorkSection />;
  if (data.slug === 'community') return <CommunitySection />;
  if (data.slug === 'jobs') return <JobsApplicationsSection />;
  return <SectionStub section={data} />;
}
