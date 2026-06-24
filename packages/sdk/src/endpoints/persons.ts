import type {
  BecomeProviderInput,
  EmployerSummary,
  OkResponse,
  OrgSummary,
  PersonDetail,
  PersonPreferences,
  PersonPreferencesUpdate,
  PersonProfile,
  PersonProfileUpdate,
  WorkExperience,
  WorkExperienceInput,
} from '@workarmy/types';
import type { HttpClient } from '../http';

export function createPersonsClient(http: HttpClient) {
  return {
    getMe: () => http.request<PersonDetail>('/persons/me'),
    updateProfile: (body: PersonProfileUpdate) =>
      http.request<PersonProfile>('/persons/me/profile', { method: 'PUT', body }),
    getPreferences: () => http.request<PersonPreferences>('/persons/me/preferences'),
    updatePreferences: (body: PersonPreferencesUpdate) =>
      http.request<PersonPreferences>('/persons/me/preferences', { method: 'PUT', body }),
    setPhoto: (documentId: string) =>
      http.request<PersonProfile>('/persons/me/photo', { method: 'PUT', body: { documentId } }),
    complete: () => http.request<OkResponse>('/persons/me/complete', { method: 'POST' }),
    setHireStatus: (hireStatus: string) =>
      http.request<OkResponse>('/persons/me/hire-status', { method: 'PUT', body: { hireStatus } }),
    employers: () => http.request<EmployerSummary[]>('/persons/me/employers'),
    becomeProvider: (body: BecomeProviderInput) =>
      http.request<OrgSummary>('/persons/me/become-provider', { method: 'POST', body }),
    addExperience: (body: WorkExperienceInput) =>
      http.request<WorkExperience>('/persons/me/experience', { method: 'POST', body }),
    updateExperience: (id: string, body: Partial<WorkExperienceInput>) =>
      http.request<WorkExperience>(`/persons/me/experience/${id}`, { method: 'PATCH', body }),
    deleteExperience: (id: string) =>
      http.request<OkResponse>(`/persons/me/experience/${id}`, { method: 'DELETE' }),
  };
}

export type PersonsClient = ReturnType<typeof createPersonsClient>;
