import type { DocumentView } from './document';
import type { WorkExperience } from './person';

export interface CoverLetter {
  title: string;
  body: string;
}

/** The seeker's own resume view (GET /persons/me/resume). */
export interface ResumeView {
  headline: string | null;
  summary: string | null;
  coverLetters: CoverLetter[];
  document: DocumentView | null;
  shareToken: string;
  isPublic: boolean;
}

export interface ResumeUpdate {
  headline?: string;
  summary?: string;
  coverLetters?: CoverLetter[];
  /** Set the uploaded resume file, or null to detach. */
  documentId?: string | null;
}

/** Public, shareable CV (GET /public/resume/:token — no auth). */
export interface PublicResume {
  waId: string;
  firstName: string | null;
  lastName: string | null;
  headline: string | null;
  summary: string | null;
  photoDocumentId: string | null;
  resumeDocumentId: string | null;
  skills: string | null;
  experiences: WorkExperience[];
  credentials: { type: string; verified: boolean }[];
}
