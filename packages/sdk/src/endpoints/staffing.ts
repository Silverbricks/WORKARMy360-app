import type { Dispatch, DispatchInput, StaffRequest, StaffRequestInput } from '@workarmy/types';
import type { HttpClient } from '../http';

export function createStaffingClient(http: HttpClient) {
  return {
    requests: {
      list: () => http.request<StaffRequest[]>('/staff-requests'),
      create: (body: StaffRequestInput) =>
        http.request<StaffRequest>('/staff-requests', { method: 'POST', body }),
    },
    dispatch: {
      list: () => http.request<Dispatch[]>('/dispatches'),
      create: (body: DispatchInput) => http.request<Dispatch>('/dispatches', { method: 'POST', body }),
    },
  };
}

export type StaffingClient = ReturnType<typeof createStaffingClient>;
