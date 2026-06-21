import type { AccountType } from '@workarmy/types';

/**
 * Constant chrome — identical on every page (marketing and app). Per product
 * direction: charcoal header + white workspace. This is the single TS source of
 * truth; the same values are mirrored into the Tailwind `@theme` in globals.css.
 */
export const chrome = {
  headerBg: '#1B1F24',
  headerText: '#FFFFFF',
  appBg: '#F8FAFC',
  surface: '#FFFFFF',
  border: '#E5E7EB',
  textPrimary: '#1E293B',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
} as const;

export const status = {
  success: '#16A34A',
  warning: '#F59E0B',
  error: '#DC2626',
  info: '#2563EB',
} as const;

/**
 * Per-account-type accent. The chrome stays charcoal; only this accent changes
 * so users instantly recognise their context. The app shell sets `--accent`
 * from the signed-in account type — components read `var(--accent)`.
 */
export const accentByAccountType: Record<AccountType, string> = {
  JOB_SEEKER: '#2563EB',
  EMPLOYER: '#BE7327',
  FARM: '#65A30D',
  CONTRACTOR: '#7C3AED',
  LABOUR_HIRE: '#2563EB',
  RECRUITMENT_AGENCY: '#0891B2',
};

/** Admin accents (not AccountTypes — used by the admin portal in a later sprint). */
export const adminAccent = {
  SUPER_ADMIN: '#4B5563',
  SUB_ADMIN: '#374151',
} as const;

export const DEFAULT_ACCENT = accentByAccountType.JOB_SEEKER;

export function accentFor(accountType: AccountType | null | undefined): string {
  return accountType ? accentByAccountType[accountType] : DEFAULT_ACCENT;
}
