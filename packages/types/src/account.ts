/**
 * The six WorkArmy participant types. Participant type is an ATTRIBUTE on a
 * person/organisation — never a separate table or system (Principle 2).
 */
export const ACCOUNT_TYPES = [
  'JOB_SEEKER',
  'EMPLOYER',
  'FARM',
  'CONTRACTOR',
  'LABOUR_HIRE',
  'RECRUITMENT_AGENCY',
] as const;

export type AccountType = (typeof ACCOUNT_TYPES)[number];

/** Account types that live in the Users app (workarmy.co). */
export const USERS_APP_ACCOUNT_TYPES: readonly AccountType[] = ['JOB_SEEKER'];

/** Account types that live in the Providers app (platform.workarmy.co). */
export const PROVIDER_ACCOUNT_TYPES: readonly AccountType[] = [
  'EMPLOYER',
  'FARM',
  'CONTRACTOR',
  'LABOUR_HIRE',
  'RECRUITMENT_AGENCY',
];

export function isAccountType(value: unknown): value is AccountType {
  return typeof value === 'string' && (ACCOUNT_TYPES as readonly string[]).includes(value);
}
