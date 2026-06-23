import type {
  Applicant,
  ApplicationEvent,
  ApplyInput,
  JobApplication,
  MyApplication,
  StageChangeInput,
} from '@workarmy/types';
import type { HttpClient } from '../http';

export function createApplicationsClient(http: HttpClient) {
  return {
    apply: (jobId: string, body: ApplyInput = {}) =>
      http.request<JobApplication>(`/jobs/${jobId}/apply`, { method: 'POST', body }),
    /** The current job seeker's applications. */
    mine: () => http.request<MyApplication[]>('/applications/me'),
    /** Applicants to a job (org owner). */
    forJob: (jobId: string) => http.request<Applicant[]>(`/jobs/${jobId}/applications`),
    changeStage: (id: string, body: StageChangeInput) =>
      http.request<JobApplication>(`/applications/${id}/stage`, { method: 'PATCH', body }),
    events: (id: string) => http.request<ApplicationEvent[]>(`/applications/${id}/events`),
  };
}

export type ApplicationsClient = ReturnType<typeof createApplicationsClient>;
