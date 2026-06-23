import type { AccountType } from './account';

export type AdminRole = 'SUPER_ADMIN' | 'SUB_ADMIN';
export type OrgRole = 'owner' | 'admin' | 'member';

/** Org membership summary returned in /auth/me for provider users. */
export interface OrgSummary {
  id: string;
  waId: string;
  accountType: AccountType;
  name: string;
  role: OrgRole;
}

export interface OrgProfile {
  legalName: string | null;
  tradingName: string | null;
  abn: string | null;
  structure: string | null;
  industry: string | null;
  workforceSize: string | null;
  about: string | null;
  website: string | null;
  addressLine: string | null;
  suburb: string | null;
  state: string | null;
  postcode: string | null;
  region: string | null;
  completeness: number;
}

export interface OrgProfileUpdate {
  legalName?: string;
  tradingName?: string;
  abn?: string;
  structure?: string;
  industry?: string;
  workforceSize?: string;
  about?: string;
  website?: string;
  addressLine?: string;
  suburb?: string;
  state?: string;
  postcode?: string;
  region?: string;
}

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  position: string | null;
  email: string | null;
  phone: string | null;
  roleTag: string | null;
  isPrimary: boolean;
  isBilling: boolean;
  isEmergency: boolean;
  isSignatory: boolean;
}

export interface ContactInput {
  firstName: string;
  lastName: string;
  position?: string;
  email?: string;
  phone?: string;
  roleTag?: string;
  isPrimary?: boolean;
  isBilling?: boolean;
  isEmergency?: boolean;
  isSignatory?: boolean;
}

export interface OrganisationDetail {
  id: string;
  waId: string;
  accountType: AccountType;
  name: string;
  profile: OrgProfile | null;
  contacts: Contact[];
}
