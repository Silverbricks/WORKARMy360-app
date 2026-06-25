import { notFound } from 'next/navigation';
import { DashboardSection } from '@/components/dashboard/DashboardSection';
import { SECTION_SLUGS } from '@/lib/dashboard-nav';

// Only the known sections are valid; anything else 404s. Fully static.
export const dynamicParams = false;

export function generateStaticParams() {
  return SECTION_SLUGS.map((section) => ({ section }));
}

export default async function DashboardSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  if (!(SECTION_SLUGS as readonly string[]).includes(section)) notFound();
  return <DashboardSection slug={section} />;
}
