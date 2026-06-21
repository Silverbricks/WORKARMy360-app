/** Token lifetimes and abuse limits. Centralised so policy lives in one place. */

export const ACCESS_TTL_SECONDS = 15 * 60; // 15 minutes
export const REFRESH_TTL_DAYS = 30;
export const REFRESH_TTL_SECONDS = REFRESH_TTL_DAYS * 24 * 60 * 60;

export const OTP_TTL_SECONDS = 10 * 60; // 10 minutes
export const RESET_TTL_SECONDS = 15 * 60; // 15 minutes

export const MAX_FAILED_LOGINS = 10;
export const LOCKOUT_SECONDS = 5 * 60; // 5 minutes after MAX_FAILED_LOGINS

export const MAX_OTP_ATTEMPTS = 5; // wrong-code attempts per active OTP
export const OTP_RESEND_WINDOW_SECONDS = 60 * 60; // 1 hour
export const MAX_OTP_SENDS_PER_WINDOW = 3; // sends per window

export const BCRYPT_ROUNDS = 12;
