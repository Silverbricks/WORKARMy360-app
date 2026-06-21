/** Stable machine-readable error codes returned by the API. */
export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'INVALID_CREDENTIALS'
  | 'ACCOUNT_LOCKED'
  | 'EMAIL_TAKEN'
  | 'EMAIL_NOT_VERIFIED'
  | 'OTP_INVALID'
  | 'OTP_EXPIRED'
  | 'OTP_RATE_LIMITED'
  | 'TOKEN_INVALID'
  | 'TOKEN_EXPIRED'
  | 'TURNSTILE_FAILED'
  | 'UNAUTHORIZED'
  | 'NOT_FOUND'
  | 'RATE_LIMITED'
  | 'INTERNAL';

/** Shape every non-2xx API response conforms to. */
export interface ApiError {
  code: ApiErrorCode;
  message: string;
  /** Field-level details, e.g. zod issues keyed by path. */
  details?: Record<string, string[]>;
}

export interface OkResponse {
  ok: true;
}
