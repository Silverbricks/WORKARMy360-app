'use client';

import { OrgProfileSection } from './OrgProfileSection';
import { HiringSection } from './HiringSection';
import { WorkforceSection } from './WorkforceSection';
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
import { NetworkSection, ReportsSection } from './NetworkSections';
import { PayRunsSection, BusinessDocsSection, PieceRatesSection } from './AccountsSections';
import { BillingSection, BusinessCardSection, RequirementsSection } from './BusinessSections';
import { ComplianceSection, DocumentsSection } from './ComplianceSections';
import { SupportSection, FeedbackSection } from './SupportSections';
import { StaffCalculatorSection, TeamAdminsSection } from './PolishSections';
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
    case 'network':
      return <NetworkSection />;
    case 'reports':
      return <ReportsSection />;
    case 'pay-runs':
      return <PayRunsSection />;
    case 'accounts':
      return <BusinessDocsSection />;
    case 'piece-rates':
      return <PieceRatesSection />;
    case 'operations':
      return <WorkforceSection />;
    case 'membership':
    case 'billing':
      return <BillingSection />;
    case 'business-card':
      return <BusinessCardSection />;
    case 'requirements':
      return <RequirementsSection />;
    case 'compliance':
      return <ComplianceSection />;
    case 'documents':
      return <DocumentsSection />;
    case 'support':
      return <SupportSection />;
    case 'feedback':
      return <FeedbackSection />;
    case 'staff-calculator':
      return <StaffCalculatorSection />;
    case 'team-admins':
      return <TeamAdminsSection />;
    default:
      return <ComingSoonSection slug={slug} />;
  }
}
