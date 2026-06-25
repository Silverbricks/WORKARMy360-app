import type {
  BusinessDoc,
  BusinessDocInput,
  BusinessDocStatus,
  OkResponse,
  PayRun,
  PayRunInput,
  PayRunStatus,
  PieceRate,
  PieceRateInput,
} from '@workarmy/types';
import type { HttpClient } from '../http';

export function createAccountsClient(http: HttpClient) {
  return {
    payRuns: {
      list: () => http.request<PayRun[]>('/pay-runs'),
      build: (body: PayRunInput) => http.request<PayRun>('/pay-runs', { method: 'POST', body }),
      setStatus: (id: string, body: { status: PayRunStatus }) =>
        http.request<PayRun>(`/pay-runs/${id}/status`, { method: 'POST', body }),
    },
    docs: {
      list: () => http.request<BusinessDoc[]>('/business-docs'),
      create: (body: BusinessDocInput) =>
        http.request<BusinessDoc>('/business-docs', { method: 'POST', body }),
      setStatus: (id: string, body: { status: BusinessDocStatus }) =>
        http.request<BusinessDoc>(`/business-docs/${id}/status`, { method: 'POST', body }),
      remove: (id: string) => http.request<OkResponse>(`/business-docs/${id}`, { method: 'DELETE' }),
    },
    pieceRates: {
      list: () => http.request<PieceRate[]>('/piece-rates'),
      create: (body: PieceRateInput) => http.request<PieceRate>('/piece-rates', { method: 'POST', body }),
      remove: (id: string) => http.request<OkResponse>(`/piece-rates/${id}`, { method: 'DELETE' }),
    },
  };
}

export type AccountsClient = ReturnType<typeof createAccountsClient>;
