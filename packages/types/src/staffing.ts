// ---------------------------------------------------------------------------
// Business dashboard — Urgent & Bulk: staff requests + quick dispatch
// ---------------------------------------------------------------------------

export type StaffRequestType = 'URGENT_SHIFT' | 'BULK_CREW' | 'STANDARD';
export type StaffRequestUrgency = 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
export type StaffRequestStatus =
  | 'DRAFT'
  | 'SENT'
  | 'ACKNOWLEDGED'
  | 'FILLED'
  | 'CLOSED'
  | 'CANCELLED';
export type RecipientChannel = 'SUPER_ADMIN' | 'CONTRACTOR' | 'AGENCY' | 'NETWORK';

export interface StaffRequestRecipient {
  id: string;
  channel: RecipientChannel;
  recipientLabel: string | null;
  status: string;
}

export interface StaffRequest {
  id: string;
  type: StaffRequestType;
  urgency: StaffRequestUrgency;
  status: StaffRequestStatus;
  roleTitle: string;
  industry: string | null;
  description: string | null;
  employmentType: string | null;
  site: string | null;
  siteAddress: string | null;
  suburb: string | null;
  state: string | null;
  startDate: string | null;
  shiftType: string | null;
  startTime: string | null;
  finishTime: string | null;
  headcountTotal: number;
  headcountMale: number | null;
  headcountFemale: number | null;
  headcountAny: number | null;
  days: string | null;
  skills: string | null;
  licences: string | null;
  experience: string | null;
  english: string | null;
  ppe: string | null;
  ppeSupplied: boolean;
  reportToName: string | null;
  reportToRole: string | null;
  reportToMobile: string | null;
  reportToLocation: string | null;
  siteNotes: string | null;
  payRate: string | null;
  payBasis: string | null;
  award: string | null;
  transport: boolean;
  accommodation: boolean;
  meals: boolean;
  additionalNotes: string | null;
  sendToSuperAdmin: boolean;
  createdAt: string;
  recipients: StaffRequestRecipient[];
}

export interface StaffRequestInput {
  type?: StaffRequestType;
  urgency?: StaffRequestUrgency;
  roleTitle: string;
  industry?: string;
  description?: string;
  employmentType?: string;
  site?: string;
  siteAddress?: string;
  suburb?: string;
  state?: string;
  startDate?: string;
  shiftType?: string;
  startTime?: string;
  finishTime?: string;
  headcountTotal?: number;
  headcountMale?: number;
  headcountFemale?: number;
  headcountAny?: number;
  days?: string;
  skills?: string;
  licences?: string;
  experience?: string;
  english?: string;
  ppe?: string;
  ppeSupplied?: boolean;
  reportToName?: string;
  reportToRole?: string;
  reportToMobile?: string;
  reportToLocation?: string;
  siteNotes?: string;
  payRate?: string;
  payBasis?: string;
  award?: string;
  transport?: boolean;
  accommodation?: boolean;
  meals?: boolean;
  additionalNotes?: string;
  /** Labels of contractors / agencies to also send to. */
  partnerLabels?: string[];
}

export type DispatchChannel = 'ON_CALL' | 'CONTRACTORS' | 'AGENCIES' | 'NETWORK';

export interface DispatchTarget {
  id: string;
  channel: DispatchChannel;
  targetLabel: string | null;
  state: string;
}

export interface Dispatch {
  id: string;
  message: string;
  roleNeeded: string | null;
  headcount: number | null;
  whenAt: string | null;
  status: string;
  createdAt: string;
  targets: DispatchTarget[];
}

export interface DispatchInput {
  message: string;
  roleNeeded?: string;
  headcount?: number;
  whenAt?: string;
  channels: DispatchChannel[];
}
