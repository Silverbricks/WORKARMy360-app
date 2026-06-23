import { HttpClient, type HttpClientOptions } from './http';
import { createAuthClient } from './endpoints/auth';
import { createOrganisationsClient } from './endpoints/organisations';
import { createJobsClient } from './endpoints/jobs';
import { createApplicationsClient } from './endpoints/applications';
import { createAdminClient } from './endpoints/admin';

export type WorkArmyClientOptions = HttpClientOptions;

/** Build a typed WorkArmy API client. Apps use this — never raw fetch. */
export function createClient(opts: WorkArmyClientOptions) {
  const http = new HttpClient(opts);
  return {
    http,
    auth: createAuthClient(http),
    organisations: createOrganisationsClient(http),
    jobs: createJobsClient(http),
    applications: createApplicationsClient(http),
    admin: createAdminClient(http),
  };
}

export type WorkArmyClient = ReturnType<typeof createClient>;
