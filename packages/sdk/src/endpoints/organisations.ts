import type {
  Contact,
  ContactInput,
  OkResponse,
  OrganisationDetail,
  OrgProfile,
  OrgProfileUpdate,
} from '@workarmy/types';
import type { HttpClient } from '../http';

export function createOrganisationsClient(http: HttpClient) {
  return {
    getMe: () => http.request<OrganisationDetail>('/organisations/me'),
    updateProfile: (body: OrgProfileUpdate) =>
      http.request<OrgProfile>('/organisations/me/profile', { method: 'PUT', body }),
    addContact: (body: ContactInput) =>
      http.request<Contact>('/organisations/me/contacts', { method: 'POST', body }),
    updateContact: (id: string, body: Partial<ContactInput>) =>
      http.request<Contact>(`/organisations/me/contacts/${id}`, { method: 'PATCH', body }),
    deleteContact: (id: string) =>
      http.request<OkResponse>(`/organisations/me/contacts/${id}`, { method: 'DELETE' }),
  };
}

export type OrganisationsClient = ReturnType<typeof createOrganisationsClient>;
