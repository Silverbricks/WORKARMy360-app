import type { PublicResume, ResumeUpdate, ResumeView } from '@workarmy/types';
import type { HttpClient } from '../http';

export function createResumeClient(http: HttpClient) {
  return {
    getMe: () => http.request<ResumeView>('/persons/me/resume'),
    update: (body: ResumeUpdate) =>
      http.request<ResumeView>('/persons/me/resume', { method: 'PUT', body }),
    setShare: (isPublic: boolean) =>
      http.request<ResumeView>('/persons/me/resume/share', { method: 'POST', body: { isPublic } }),
    /** Public CV by share token (no auth required). */
    public: (token: string) => http.request<PublicResume>(`/public/resume/${token}`),
  };
}

export type ResumeClient = ReturnType<typeof createResumeClient>;
