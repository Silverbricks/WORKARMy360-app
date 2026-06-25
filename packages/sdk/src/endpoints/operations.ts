import type {
  OkResponse,
  QrInput,
  Site,
  SiteInput,
  SiteQrCode,
  Task,
  TaskInput,
  TaskStatus,
  Visitor,
  VisitorInput,
} from '@workarmy/types';
import type { HttpClient } from '../http';

export function createOperationsClient(http: HttpClient) {
  return {
    sites: {
      list: () => http.request<Site[]>('/sites'),
      create: (body: SiteInput) => http.request<Site>('/sites', { method: 'POST', body }),
      remove: (id: string) => http.request<OkResponse>(`/sites/${id}`, { method: 'DELETE' }),
    },
    tasks: {
      list: () => http.request<Task[]>('/tasks'),
      create: (body: TaskInput) => http.request<Task>('/tasks', { method: 'POST', body }),
      setStatus: (id: string, body: { status: TaskStatus }) =>
        http.request<Task>(`/tasks/${id}/status`, { method: 'POST', body }),
    },
    qr: {
      list: () => http.request<SiteQrCode[]>('/qr-codes'),
      create: (body: QrInput) => http.request<SiteQrCode>('/qr-codes', { method: 'POST', body }),
    },
    visitors: {
      list: () => http.request<Visitor[]>('/visitors'),
      checkIn: (body: VisitorInput) => http.request<Visitor>('/visitors', { method: 'POST', body }),
      checkOut: (id: string) => http.request<Visitor>(`/visitors/${id}/checkout`, { method: 'POST' }),
    },
  };
}

export type OperationsClient = ReturnType<typeof createOperationsClient>;
