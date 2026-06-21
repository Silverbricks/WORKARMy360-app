import type { AccountType } from './account';

export type UserStatus = 'pending' | 'active' | 'suspended';

/** The auth-only view of a user (never includes profile fields — Principle 2). */
export interface AuthUser {
  id: string;
  email: string;
  status: UserStatus;
  emailVerified: boolean;
}

/** The person (human) summary — identity/profile lives here, not on `users`. */
export interface PersonSummary {
  waId: string;
  accountType: AccountType;
  firstName: string | null;
  lastName: string | null;
  /** Profile completeness flag — a UX progress signal, NOT compliance (Principle 4). */
  profileComplete: boolean;
}

export interface MeResponse {
  user: AuthUser;
  person: PersonSummary | null;
}

/** Claims carried in the short-lived access token. */
export interface AccessTokenClaims {
  sub: string;
  email: string;
}
