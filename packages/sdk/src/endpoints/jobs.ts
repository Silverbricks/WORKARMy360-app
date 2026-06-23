import type { Job, JobBrowseQuery, JobInput, JobListing, Paginated } from '@workarmy/types';
import { toQueryString, type HttpClient } from '../http';

export function createJobsClient(http: HttpClient) {
  return {
    /** Jobs owned by the current org (provider). */
    mine: () => http.request<Job[]>('/jobs/me'),
    create: (body: JobInput) => http.request<Job>('/jobs', { method: 'POST', body }),
    update: (id: string, body: JobInput) => http.request<Job>(`/jobs/${id}`, { method: 'PATCH', body }),
    publish: (id: string) => http.request<Job>(`/jobs/${id}/publish`, { method: 'POST' }),
    close: (id: string) => http.request<Job>(`/jobs/${id}/close`, { method: 'POST' }),
    get: (id: string) => http.request<JobListing>(`/jobs/${id}`),
    /** Public browse of published jobs (job seekers). */
    browse: (query: JobBrowseQuery = {}) =>
      http.request<Paginated<JobListing>>(`/jobs${toQueryString({ ...query })}`),
  };
}

export type JobsClient = ReturnType<typeof createJobsClient>;
