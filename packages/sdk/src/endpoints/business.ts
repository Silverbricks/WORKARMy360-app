import type {
  BusinessCard,
  BusinessCardInput,
  CredentialInput,
  CredentialView,
  MemberInvoice,
  OkResponse,
  OrgAdmin,
  OrgAdminInput,
  Plan,
  Requirement,
  RequirementInput,
  Subscription,
  VerificationRequest,
  VerificationView,
} from '@workarmy/types';
import type { HttpClient } from '../http';

export function createBusinessClient(http: HttpClient) {
  return {
    plans: () => http.request<Plan[]>('/plans'),
    subscription: {
      get: () => http.request<Subscription>('/subscription'),
      subscribe: (body: { planCode: string }) =>
        http.request<Subscription>('/subscription', { method: 'POST', body }),
      cancel: () => http.request<Subscription>('/subscription/cancel', { method: 'POST' }),
      setPayment: (body: { last4: string; brand: string }) =>
        http.request<Subscription>('/subscription/payment', { method: 'POST', body }),
    },
    memberInvoices: () => http.request<MemberInvoice[]>('/member-invoices'),
    card: {
      get: () => http.request<BusinessCard>('/business-card'),
      update: (body: BusinessCardInput) =>
        http.request<BusinessCard>('/business-card', { method: 'PUT', body }),
    },
    requirements: {
      list: () => http.request<Requirement[]>('/requirements'),
      create: (body: RequirementInput) =>
        http.request<Requirement>('/requirements', { method: 'POST', body }),
      close: (id: string) => http.request<Requirement>(`/requirements/${id}/close`, { method: 'POST' }),
      remove: (id: string) => http.request<OkResponse>(`/requirements/${id}`, { method: 'DELETE' }),
    },
    admins: {
      list: () => http.request<OrgAdmin[]>('/org-admins'),
      add: (body: OrgAdminInput) => http.request<OrgAdmin>('/org-admins', { method: 'POST', body }),
      remove: (id: string) => http.request<OkResponse>(`/org-admins/${id}`, { method: 'DELETE' }),
    },
    compliance: {
      credentials: () => http.request<CredentialView[]>('/org-credentials'),
      addCredential: (body: CredentialInput) =>
        http.request<CredentialView>('/org-credentials', { method: 'POST', body }),
      removeCredential: (id: string) =>
        http.request<OkResponse>(`/org-credentials/${id}`, { method: 'DELETE' }),
      verifications: () => http.request<VerificationView[]>('/org-verifications'),
      requestVerification: (body: VerificationRequest) =>
        http.request<VerificationView>('/org-verifications', { method: 'POST', body }),
    },
  };
}

export type BusinessClient = ReturnType<typeof createBusinessClient>;
