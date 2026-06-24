import type {
  TaxLodgement,
  TaxLodgementInput,
  TaxShare,
  TaxShareInput,
  WorkReadiness,
  WorkReadinessInput,
} from '@workarmy/types';
import type { HttpClient } from '../http';

export function createWorkReadinessClient(http: HttpClient) {
  return {
    get: () => http.request<WorkReadiness>('/work-readiness'),
    update: (body: WorkReadinessInput) =>
      http.request<WorkReadiness>('/work-readiness', { method: 'PUT', body }),
    listLodgements: () => http.request<TaxLodgement[]>('/work-readiness/lodgements'),
    addLodgement: (body: TaxLodgementInput) =>
      http.request<TaxLodgement>('/work-readiness/lodgements', { method: 'POST', body }),
    listShares: () => http.request<TaxShare[]>('/work-readiness/shares'),
    addShare: (body: TaxShareInput) =>
      http.request<TaxShare>('/work-readiness/shares', { method: 'POST', body }),
  };
}

export type WorkReadinessClient = ReturnType<typeof createWorkReadinessClient>;
