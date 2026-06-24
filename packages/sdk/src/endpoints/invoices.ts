import type { Invoice, InvoiceInput, OkResponse } from '@workarmy/types';
import type { HttpClient } from '../http';

export function createInvoicesClient(http: HttpClient) {
  return {
    list: () => http.request<Invoice[]>('/invoices'),
    create: (body: InvoiceInput) => http.request<Invoice>('/invoices', { method: 'POST', body }),
    remove: (id: string) => http.request<OkResponse>(`/invoices/${id}`, { method: 'DELETE' }),
    markPaid: (id: string) => http.request<Invoice>(`/invoices/${id}/paid`, { method: 'POST' }),
  };
}

export type InvoicesClient = ReturnType<typeof createInvoicesClient>;
