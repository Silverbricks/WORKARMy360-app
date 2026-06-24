export type Engagement = 'employee' | 'contract';
export type TaxLodgementKind = 'personal' | 'abn';
export type TaxLodgementStatus = 'requested' | 'in_progress' | 'completed';

export interface TaxLodgement {
  id: string;
  kind: TaxLodgementKind;
  financialYear: string; // e.g. "2024-25"
  note: string | null;
  status: TaxLodgementStatus;
  createdAt: string;
}

export interface TaxLodgementInput {
  kind: TaxLodgementKind;
  financialYear: string;
  note?: string;
}

export interface TaxShare {
  id: string;
  employer: string;
  passwordProtected: boolean;
  sharedAt: string;
}

export interface TaxShareInput {
  employer: string;
  passwordProtected?: boolean;
}

/** Work readiness (Gate 3) + tax details for the signed-in seeker. */
export interface WorkReadiness {
  engagement: Engagement | null;
  tfn: string | null;
  abn: string | null;
  hasSuper: boolean;
  superFund: string | null;
  superMember: string | null;
  bankBsb: string | null;
  bankAccount: string | null;
  noCashAck: boolean;
  bankLater: boolean;
  /** Server-computed: TFN/ABN (per engagement) + super + bank + no-cash ack. */
  workReady: boolean;
  lodgements: TaxLodgement[];
  shares: TaxShare[];
}

export interface WorkReadinessInput {
  engagement?: Engagement;
  tfn?: string;
  abn?: string;
  hasSuper?: boolean;
  superFund?: string;
  superMember?: string;
  bankBsb?: string;
  bankAccount?: string;
  noCashAck?: boolean;
  bankLater?: boolean;
}
