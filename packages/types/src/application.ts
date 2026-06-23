import type { Job } from './job';

export type ApplicationStage =
  | 'APPLIED'
  | 'SHORTLISTED'
  | 'INTERVIEW'
  | 'OFFERED'
  | 'HIRED'
  | 'REJECTED'
  | 'WITHDRAWN';

export const APPLICATION_STAGES: readonly ApplicationStage[] = [
  'APPLIED',
  'SHORTLISTED',
  'INTERVIEW',
  'OFFERED',
  'HIRED',
  'REJECTED',
  'WITHDRAWN',
];

export interface JobApplication {
  id: string;
  jobId: string;
  personId: string;
  stage: ApplicationStage;
  coverNote: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Job seeker's own application, with the job attached. */
export interface MyApplication extends JobApplication {
  job: Pick<Job, 'id' | 'title' | 'status' | 'location' | 'state'> & {
    org: { name: string };
  };
}

/** An applicant as seen by the hiring org. */
export interface Applicant extends JobApplication {
  person: { waId: string; firstName: string | null; lastName: string | null; mobile: string | null };
}

export interface ApplyInput {
  coverNote?: string;
}

export interface StageChangeInput {
  toStage: ApplicationStage;
  note?: string;
}

export interface ApplicationEvent {
  id: string;
  fromStage: ApplicationStage | null;
  toStage: ApplicationStage;
  note: string | null;
  createdAt: string;
}
