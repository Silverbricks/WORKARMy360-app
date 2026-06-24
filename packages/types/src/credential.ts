import type { DocumentView } from './document';
import type { VerificationStatus } from './admin';

export type CredentialVerification = 'NONE' | VerificationStatus;

/** A qualification / licence / ID held by a person, with its file + verification state. */
export interface CredentialView {
  id: string;
  type: string;
  identifier: string | null;
  issuer: string | null;
  expiresAt: string | null;
  document: DocumentView | null;
  verificationStatus: CredentialVerification;
  createdAt: string;
}

export interface CredentialInput {
  type: string;
  identifier?: string;
  issuer?: string;
  expiresAt?: string;
  documentId?: string;
}

/** A verification request raised by a person against one of their credentials. */
export interface VerificationView {
  id: string;
  status: VerificationStatus;
  credentialType: string | null;
  reviewNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

export interface VerificationRequest {
  credentialId: string;
}
