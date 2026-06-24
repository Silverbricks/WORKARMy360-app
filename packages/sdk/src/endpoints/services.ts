import type { OkResponse, ServiceListing, ServiceListingInput } from '@workarmy/types';
import { toQueryString, type HttpClient } from '../http';

export function createServicesClient(http: HttpClient) {
  return {
    list: (category?: string) =>
      http.request<ServiceListing[]>(`/services${toQueryString({ category })}`),
    create: (body: ServiceListingInput) =>
      http.request<ServiceListing>('/services', { method: 'POST', body }),
    remove: (id: string) => http.request<OkResponse>(`/services/${id}`, { method: 'DELETE' }),
  };
}

export type ServicesClient = ReturnType<typeof createServicesClient>;
