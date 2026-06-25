'use client';

import { OrgProfileSection } from './OrgProfileSection';
import { HiringSection } from './HiringSection';
import { WorkforceSection } from './WorkforceSection';
import { MessagesSection } from './MessagesSection';
import { FindStaffSection } from './FindStaffSection';
import { StaffSection } from './StaffSection';
import { MyWorkforceSection } from './MyWorkforceSection';
import { TeamsSection } from './TeamsSection';
import { RostersSection } from './RostersSection';
import { UrgentBulkSection } from './UrgentBulkSection';
import { StaffRequestFormSection } from './StaffRequestFormSection';
import { QuickDispatchSection } from './QuickDispatchSection';
import { HrSection } from './HrSection';
import { TasksSection, QrSection, SitesSection, VisitorsSection } from './OperationsSections';
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
      return <HiringSection />;
    case 'find-staff':
      return <FindStaffSection />;
    case 'staff':
      return <StaffSection />;
    case 'workforce':
      return <MyWorkforceSection />;
    case 'teams':
      return <TeamsSection />;
    case 'rosters':
      return <RostersSection />;
    case 'staffing':
      return <UrgentBulkSection />;
    case 'staff-request':
      return <StaffRequestFormSection />;
    case 'dispatch':
      return <QuickDispatchSection />;
    case 'hr':
      return <HrSection />;
    case 'tasks':
      return <TasksSection />;
    case 'qr':
      return <QrSection />;
    case 'sites':
      return <SitesSection />;
    case 'visitors':
      return <VisitorsSection />;
    case 'operations':
      return <WorkforceSection />;
    case 'support':
      return <MessagesSection />;
    default:
      return <ComingSoonSection slug={slug} />;
  }
}
