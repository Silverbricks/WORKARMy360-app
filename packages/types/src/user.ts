import type { AccountType } from './account';
import type { AdminRole, OrgSummary } from './organisation';

export type UserStatus = 'pending' | 'active' | 'suspended';

/** The auth-only view of a user (never includes profile fields — Principle 2). */
export interface AuthUser {
  id: string;
  email: string;
  status: UserStatus;
  emailVerified: boolean;
  adminRole: AdminRole | null;
}

/** The person (human) summary — identity/profile lives here, not on `users`. */
export interface PersonSummary {
  waId: string;
  accountType: AccountType;
  firstName: string | null;
  lastName: string | null;
  /** Profile completeness flag — a UX progress signal, NOT compliance (Principle 4). */
  profileComplete: boolean;
  /** Profile completeness percentage (0–100), for the dashboard progress widget. */
  profileCompleteness: number;
}

export interface MeResponse {
  user: AuthUser;
  person: PersonSummary | null;
  organisation: OrgSummary | null;
}

/** Claims carried in the short-lived access token. */
export interface AccessTokenClaims {
  sub: string;
  email: string;
}
