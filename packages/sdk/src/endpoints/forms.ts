import type { FormDefinition, FormInput, FormSubmissionInput, FormSubmissionView, OkResponse } from '@workarmy/types';
import type { HttpClient } from '../http';

/** Form Builder client — dynamic forms + submissions. */
export function createFormsClient(http: HttpClient) {
  return {
    list: () => http.request<FormDefinition[]>('/forms'),
    create: (body: FormInput) => http.request<FormDefinition>('/forms', { method: 'POST', body }),
    update: (id: string, body: FormInput) => http.request<FormDefinition>(`/forms/${id}`, { method: 'PATCH', body }),
    publish: (id: string) => http.request<FormDefinition>(`/forms/${id}/publish`, { method: 'POST' }),
    remove: (id: string) => http.request<OkResponse>(`/forms/${id}`, { method: 'DELETE' }),
    submissions: (id: string) => http.request<FormSubmissionView[]>(`/forms/${id}/submissions`),
    submit: (id: string, body: FormSubmissionInput) =>
      http.request<FormSubmissionView>(`/forms/${id}/submissions`, { method: 'POST', body }),
  };
}

export type FormsClient = ReturnType<typeof createFormsClient>;
