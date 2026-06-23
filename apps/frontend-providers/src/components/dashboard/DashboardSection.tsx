'use client';

import { Card } from '@workarmy/ui';
import { getSection } from '@/lib/dashboard-sections';
import { useMe } from './DashboardShell';
import { SectionStub } from './SectionStub';
import { OrgProfileSection } from './OrgProfileSection';
import { JobsSection } from './JobsSection';

export function DashboardSection({ slug }: { slug: string }) {
  const me = useMe();
  const section = getSection(me.organisation.accountType, slug);

  if (!section) {
    return (
      <Card className="p-6 text-sm text-[#64748B]">
        This section isn’t available for your account type.
      </Card>
    );
  }
  if (section.kind === 'profile') return <OrgProfileSection />;
  if (section.kind === 'jobs') return <JobsSection title={section.title} />;
  return <SectionStub section={section} />;
}
