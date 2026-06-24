export type DocumentKind = 'LICENCE' | 'INSURANCE' | 'ID' | 'CERTIFICATE' | 'OTHER';

export const DOCUMENT_KINDS: readonly DocumentKind[] = [
  'LICENCE',
  'INSURANCE',
  'ID',
  'CERTIFICATE',
  'OTHER',
];

/** A stored file owned by a person (or org). Served via /files/:id/download. */
export interface DocumentView {
  id: string;
  kind: DocumentKind;
  fileName: string;
  mimeType: string | null;
  sizeBytes: number | null;
  createdAt: string;
}
