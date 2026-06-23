import type {
  AdminStats,
  MemberDirectoryItem,
  ModerationJob,
  OkResponse,
  Paginated,
  ReviewInput,
  VerificationItem,
  VerificationStatus,
} from '@workarmy/types';
import { toQueryString, type HttpClient } from '../http';

export function createAdminClient(http: HttpClient) {
  return {
    stats: () => http.request<AdminStats>('/admin/stats'),
    members: (q = '', page = 1) =>
      http.request<Paginated<MemberDirectoryItem>>(`/admin/members${toQueryString({ q, page })}`),
    verifications: (status: VerificationStatus = 'PENDING') =>
      http.request<VerificationItem[]>(`/admin/verifications${toQueryString({ status })}`),
    approve: (id: string, body: ReviewInput = {}) =>
      http.request<OkResponse>(`/admin/verifications/${id}/approve`, { method: 'POST', body }),
    reject: (id: string, body: ReviewInput = {}) =>
      http.request<OkResponse>(`/admin/verifications/${id}/reject`, { method: 'POST', body }),
    jobs: (status = '') => http.request<ModerationJob[]>(`/admin/jobs${toQueryString({ status })}`),
    closeJob: (id: string) => http.request<OkResponse>(`/admin/jobs/${id}/close`, { method: 'POST' }),
  };
}

export type AdminClient = ReturnType<typeof createAdminClient>;
