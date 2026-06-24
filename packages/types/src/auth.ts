import type { AccountType } from './account';

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  /** AU mobile, e.g. 0412 345 678. */
  mobile: string;
  accountType: AccountType;
  /** Required for provider account types — becomes the Organisation name. */
  companyName?: string;
  /** Cloudflare Turnstile token; optional when Turnstile is disabled (dev). */
  turnstileToken?: string;
}

export interface RegisterResponse {
  userId: string;
  waId: string;
  /** True when the account must verify its email before logging in (real email
   * sender configured). When false the account is active immediately. */
  requiresVerification: boolean;
  /** ISO timestamp the verification OTP expires at (null when not required). */
  otpExpiresAt: string | null;
}

export interface VerifyEmailRequest {
  email: string;
  code: string;
}

export interface ResendOtpRequest {
  email: string;
}

export interface ResendOtpResponse {
  otpExpiresAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

/** Returned by verify-email / login / refresh. Refresh token rides in an httpOnly cookie. */
export interface AuthTokenResponse {
  accessToken: string;
}
