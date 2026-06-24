import type { AccountType } from './account';

/** Hire-me status (a self-declared availability signal, not compliance). */
export type HireStatus = 'AVAILABLE_NOW' | 'AVAILABLE_SOON' | 'OPEN' | 'NOT_LOOKING';

/** The Job Seeker profile — identity/profile data lives on the person, not the user. */
export interface PersonProfile {
  // personal
  photoUrl: string | null;
  photoDocumentId: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  nationality: string | null;
  addressLine: string | null;
  suburb: string | null;
  state: string | null;
  postcode: string | null;
  emergencyName: string | null;
  emergencyPhone: string | null;
  // professional
  headline: string | null;
  about: string | null;
  skills: string | null;
  industries: string | null;
  languages: string | null;
  // availability
  availability: string | null;
  availableDays: string | null;
  availableHours: string | null;
  // hire-me status
  hireStatus: string | null;
  /** UX progress metric (0–100), NOT compliance (Principle 4). */
  completeness: number;
}

/** Partial update — also carries the identity fields that live on the person row. */
export interface PersonProfileUpdate {
  firstName?: string;
  lastName?: string;
  mobile?: string;
  photoUrl?: string;
  dateOfBirth?: string;
  gender?: string;
  nationality?: string;
  addressLine?: string;
  suburb?: string;
  state?: string;
  postcode?: string;
  emergencyName?: string;
  emergencyPhone?: string;
  headline?: string;
  about?: string;
  skills?: string;
  industries?: string;
  languages?: string;
  availability?: string;
  availableDays?: string;
  availableHours?: string;
  hireStatus?: string;
}

export interface WorkExperience {
  id: string;
  employer: string;
  position: string | null;
  employmentType: string | null;
  location: string | null;
  startDate: string | null;
  endDate: string | null;
  current: boolean;
  summary: string | null;
}

export interface WorkExperienceInput {
  employer: string;
  position?: string;
  employmentType?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  current?: boolean;
  summary?: string;
}

/** Job preferences — drive matching. Kept separate from completeness (Principle 4). */
export interface PersonPreferences {
  seekerCategory: string | null;
  userTypes: string | null;
  preferredLocations: string | null;
  preferredIndustries: string | null;
  preferredJobTypes: string | null;
  preferredPayMin: number | null;
  willingToRelocate: boolean;
}

export interface PersonPreferencesUpdate {
  seekerCategory?: string;
  userTypes?: string;
  preferredLocations?: string;
  preferredIndustries?: string;
  preferredJobTypes?: string;
  preferredPayMin?: number;
  willingToRelocate?: boolean;
}

/** Job-seeker user types (a self-declared attribute, not a subtype — Principle 2). */
export const USER_TYPES = [
  'Permanent',
  'Casual',
  'Seasonal',
  'Backpacker',
  'Apprentice',
  'Trainee',
  'Volunteer',
  'Skilled',
  'Professional',
] as const;

/** Full Job Seeker view returned by GET /persons/me. */
export interface PersonDetail {
  waId: string;
  accountType: AccountType;
  firstName: string | null;
  lastName: string | null;
  mobile: string | null;
  email: string;
  profile: PersonProfile | null;
  preferences: PersonPreferences | null;
  experiences: WorkExperience[];
}
