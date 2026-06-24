import type { DocumentView, OkResponse } from '@workarmy/types';
import type { HttpClient } from '../http';

export function createFilesClient(http: HttpClient) {
  return {
    list: () => http.request<DocumentView[]>('/files/me'),
    remove: (id: string) => http.request<OkResponse>(`/files/${id}`, { method: 'DELETE' }),
    upload: (file: File, kind: string = 'OTHER') => {
      const form = new FormData();
      form.append('file', file);
      return http.request<DocumentView>(`/files?kind=${encodeURIComponent(kind)}`, {
        method: 'POST',
        body: form,
      });
    },
  };
}

export type FilesClient = ReturnType<typeof createFilesClient>;
