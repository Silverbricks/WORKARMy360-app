import { DashboardSection } from '@/components/dashboard/DashboardSection';
import { ALL_SECTION_SLUGS } from '@/lib/dashboard-sections';

export const dynamicParams = false;

export function generateStaticParams() {
  return ALL_SECTION_SLUGS.map((section) => ({ section }));
}

export default async function DashboardSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  return <DashboardSection slug={section} />;
}
