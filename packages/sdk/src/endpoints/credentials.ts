import type {
  CredentialInput,
  CredentialView,
  OkResponse,
  VerificationRequest,
  VerificationView,
} from '@workarmy/types';
import type { HttpClient } from '../http';

export function createCredentialsClient(http: HttpClient) {
  return {
    list: () => http.request<CredentialView[]>('/persons/me/credentials'),
    add: (body: CredentialInput) =>
      http.request<CredentialView>('/persons/me/credentials', { method: 'POST', body }),
    remove: (id: string) =>
      http.request<OkResponse>(`/persons/me/credentials/${id}`, { method: 'DELETE' }),
    verifications: () => http.request<VerificationView[]>('/persons/me/verifications'),
    requestVerification: (body: VerificationRequest) =>
      http.request<VerificationView>('/persons/me/verifications', { method: 'POST', body }),
  };
}

export type CredentialsClient = ReturnType<typeof createCredentialsClient>;
