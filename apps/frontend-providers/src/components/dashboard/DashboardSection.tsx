'use client';

import { OrgProfileSection } from './OrgProfileSection';
import { JobsSection } from './JobsSection';
import { WorkforceSection } from './WorkforceSection';
import { MessagesSection } from './MessagesSection';
import { ComingSoonSection } from './ComingSoonSection';

/**
 * Maps a `/dashboard/[section]` slug to its component. Phase 0 reuses the four
 * existing real sections; everything else renders a temporary placeholder until
 * its phase wires it up.
 */
export function DashboardSection({ slug }: { slug: string }) {
  switch (slug) {
    case 'profile':
      return <OrgProfileSection />;
    case 'jobs':
      return <JobsSection title="Jobs & Shifts" />;
    case 'workforce':
      return <WorkforceSection />;
    case 'support':
      return <MessagesSection />;
    default:
      return <ComingSoonSection slug={slug} />;
  }
}
