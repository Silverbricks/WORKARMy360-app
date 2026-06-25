import type {
  OkResponse,
  ProviderDirectoryOrg,
  ProviderEngagement,
  ProviderEngagementInput,
  QuoteRequest,
  QuoteRequestInput,
  ReportSummary,
} from '@workarmy/types';
import type { HttpClient } from '../http';

export function createNetworkClient(http: HttpClient) {
  return {
    directory: () => http.request<ProviderDirectoryOrg[]>('/provider-directory'),
    engagements: {
      list: () => http.request<ProviderEngagement[]>('/provider-engagements'),
      create: (body: ProviderEngagementInput) =>
        http.request<ProviderEngagement>('/provider-engagements', { method: 'POST', body }),
      toggle: (id: string) =>
        http.request<ProviderEngagement>(`/provider-engagements/${id}/toggle`, { method: 'POST' }),
      remove: (id: string) =>
        http.request<OkResponse>(`/provider-engagements/${id}`, { method: 'DELETE' }),
    },
    quotes: {
      list: () => http.request<QuoteRequest[]>('/quote-requests'),
      create: (body: QuoteRequestInput) =>
        http.request<QuoteRequest>('/quote-requests', { method: 'POST', body }),
    },
    reports: () => http.request<ReportSummary>('/reports'),
  };
}

export type NetworkClient = ReturnType<typeof createNetworkClient>;
