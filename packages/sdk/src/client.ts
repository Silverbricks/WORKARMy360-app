import { HttpClient, type HttpClientOptions } from './http';
import { createAuthClient } from './endpoints/auth';
import { createPersonsClient } from './endpoints/persons';
import { createFilesClient } from './endpoints/files';
import { createCredentialsClient } from './endpoints/credentials';
import { createResumeClient } from './endpoints/resume';
import { createWorkClient } from './endpoints/work';
import { createWorkLogClient } from './endpoints/worklog';
import { createWorkReadinessClient } from './endpoints/work-readiness';
import { createInvoicesClient } from './endpoints/invoices';
import { createCommunityClient } from './endpoints/community';
import { createSupportClient } from './endpoints/support';
import { createServicesClient } from './endpoints/services';
import { createOrganisationsClient } from './endpoints/organisations';
import { createJobsClient } from './endpoints/jobs';
import { createApplicationsClient } from './endpoints/applications';
import { createDashboardClient } from './endpoints/dashboard';
import { createStaffClient } from './endpoints/staff';
import { createStaffingClient } from './endpoints/staffing';
import { createHrClient } from './endpoints/hr';
import { createOperationsClient } from './endpoints/operations';
import { createNetworkClient } from './endpoints/network';
import { createAccountsClient } from './endpoints/accounts';
import { createBusinessClient } from './endpoints/business';
import { createPlannerClient } from './endpoints/planner';
import { createAdminClient } from './endpoints/admin';

export type WorkArmyClientOptions = HttpClientOptions;

/** Build a typed WorkArmy API client. Apps use this — never raw fetch. */
export function createClient(opts: WorkArmyClientOptions) {
  const http = new HttpClient(opts);
  return {
    http,
    auth: createAuthClient(http),
    persons: createPersonsClient(http),
    files: createFilesClient(http),
    credentials: createCredentialsClient(http),
    resume: createResumeClient(http),
    work: createWorkClient(http),
    worklog: createWorkLogClient(http),
    workReadiness: createWorkReadinessClient(http),
    invoices: createInvoicesClient(http),
    community: createCommunityClient(http),
    support: createSupportClient(http),
    services: createServicesClient(http),
    organisations: createOrganisationsClient(http),
    jobs: createJobsClient(http),
    applications: createApplicationsClient(http),
    dashboard: createDashboardClient(http),
    staff: createStaffClient(http),
    staffing: createStaffingClient(http),
    hr: createHrClient(http),
    operations: createOperationsClient(http),
    network: createNetworkClient(http),
    accounts: createAccountsClient(http),
    business: createBusinessClient(http),
    planner: createPlannerClient(http),
    admin: createAdminClient(http),
  };
}

export type WorkArmyClient = ReturnType<typeof createClient>;
