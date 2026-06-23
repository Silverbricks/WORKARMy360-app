import type { AccountType } from './account';

export type VerificationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface MemberDirectoryItem {
  kind: 'person' | 'organisation';
  id: string;
  waId: string;
  name: string;
  email: string | null;
  accountType: AccountType;
  createdAt: string;
}

export interface VerificationItem {
  id: string;
  status: VerificationStatus;
  subject: { kind: 'organisation' | 'person'; id: string; waId: string; name: string };
  reviewNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

export interface ModerationJob {
  id: string;
  title: string;
  status: string;
  orgName: string;
  state: string | null;
  createdAt: string;
}

export interface AdminStats {
  persons: number;
  organisations: number;
  jobs: number;
  applications: number;
  pendingVerifications: number;
}

export interface ReviewInput {
  note?: string;
}
