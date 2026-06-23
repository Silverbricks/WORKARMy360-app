'use client';

import { Card } from '@workarmy/ui';
import { getSection } from '@/lib/dashboard-sections';
import { SectionStub } from './SectionStub';
import { MemberDirectory } from './MemberDirectory';
import { VerificationQueue } from './VerificationQueue';
import { JobsModeration } from './JobsModeration';

export function DashboardSection({ slug }: { slug: string }) {
  const section = getSection(slug);
  if (!section) return <Card className="p-6 text-sm text-[#64748B]">Not found.</Card>;
  if (section.kind === 'members') return <MemberDirectory />;
  if (section.kind === 'verifications') return <VerificationQueue />;
  if (section.kind === 'jobs') return <JobsModeration />;
  return <SectionStub section={section} />;
}
