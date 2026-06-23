import { notFound } from 'next/navigation';
import { SectionStub } from '@/components/dashboard/SectionStub';
import { JobsApplicationsSection } from '@/components/dashboard/JobsApplicationsSection';
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
  // 'jobs' is live (browse + apply + my applications); the rest are shells.
  if (data.slug === 'jobs') return <JobsApplicationsSection />;
  return <SectionStub section={data} />;
}
