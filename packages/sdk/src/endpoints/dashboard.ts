import type { DashboardSummary } from '@workarmy/types';
import type { HttpClient } from '../http';

export function createDashboardClient(http: HttpClient) {
  return {
    /** Aggregated counts for the Business dashboard overview. */
    summary: () => http.request<DashboardSummary>('/dashboard/summary'),
  };
}

export type DashboardClient = ReturnType<typeof createDashboardClient>;
