// ---------------------------------------------------------------------------
// Business dashboard — Staff: org workers, teams, worker directory, rosters
// ---------------------------------------------------------------------------

/** A standing worker linked to an org (on-call / urgent flags). */
export interface OrgWorker {
  id: string;
  personId: string;
  waId: string;
  name: string;
  staffType: string | null;
  onCall: boolean;
  urgentAvailable: boolean;
  availabilityNote: string | null;
  teamId: string | null;
  active: boolean;
}

export interface OrgWorkerInput {
  /** Worker's WorkArmy ID (e.g. WA100123). */
  waId: string;
  staffType?: string;
  onCall?: boolean;
  urgentAvailable?: boolean;
  availabilityNote?: string;
}

export interface OrgWorkerUpdate {
  staffType?: string;
  onCall?: boolean;
  urgentAvailable?: boolean;
  availabilityNote?: string;
  teamId?: string | null;
  active?: boolean;
}

export interface TeamMember {
  id: string;
  personId: string;
  waId: string;
  name: string;
  roleInTeam: string | null;
}

export interface Team {
  id: string;
  name: string;
  description: string | null;
  supervisorMemberId: string | null;
  members: TeamMember[];
}

export interface TeamInput {
  name: string;
  description?: string;
  supervisorMemberId?: string;
}

export interface TeamMemberInput {
  waId: string;
  roleInTeam?: string;
}

/** A browsable, published availability card (Find Job Seekers). No PII. */
export interface WorkerDirectoryItem {
  waId: string;
  name: string;
  headline: string | null;
  skills: string | null;
  state: string | null;
  suburb: string | null;
  availability: string | null;
  workType: string | null;
  availableFrom: string | null;
  urgentShifts: boolean;
  qualification: string | null;
}

export interface WorkerDirectoryQuery {
  q?: string;
  state?: string;
  workType?: string;
  urgent?: boolean;
}

export interface WorkerInviteInput {
  message?: string;
}

export interface RosterAssignment {
  id: string;
  waId: string;
  name: string;
  /** AssignmentStatus: ASSIGNED | CONFIRMED | ACCEPTED | DECLINED | COMPLETED | … */
  status: string;
}

export interface RosterShift {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  start: string; // HH:mm
  end: string; // HH:mm
  teamId: string | null;
  published: boolean;
  assignments: RosterAssignment[];
}

export interface RosterInput {
  title: string;
  date: string; // YYYY-MM-DD
  start: string; // HH:mm
  end: string; // HH:mm
  teamId?: string;
  waIds?: string[];
}

export interface RosterAssignInput {
  waId: string;
}

export interface RosterRespondInput {
  response: 'ACCEPTED' | 'DECLINED' | 'CONFIRMED';
}

export interface WhosTurningUpDay {
  date: string;
  confirmed: number;
  pending: number;
  declined: number;
  assignments: RosterAssignment[];
}
