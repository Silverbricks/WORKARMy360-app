import type { OkResponse, WorkLog, WorkLogInput } from '@workarmy/types';
import type { HttpClient } from '../http';

export function createWorkLogClient(http: HttpClient) {
  return {
    list: () => http.request<WorkLog[]>('/worklog'),
    create: (body: WorkLogInput) => http.request<WorkLog>('/worklog', { method: 'POST', body }),
    remove: (id: string) => http.request<OkResponse>(`/worklog/${id}`, { method: 'DELETE' }),
  };
}

export type WorkLogClient = ReturnType<typeof createWorkLogClient>;
