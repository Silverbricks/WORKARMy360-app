// ---------------------------------------------------------------------------
// Business dashboard — Accounts: pay runs, business docs, piece rates
// ---------------------------------------------------------------------------

export type PayRunStatus = 'DRAFT' | 'FINALISED' | 'PAID';
export interface PayRun {
  id: string;
  periodStart: string;
  periodEnd: string;
  status: PayRunStatus;
  grossPay: number;
  payg: number;
  superAmount: number;
  netPay: number;
  workers: number;
  abaGenerated: boolean;
  stpLodged: boolean;
  createdAt: string;
}
export interface PayRunInput {
  periodStart: string;
  periodEnd: string;
}

export type BusinessDocType = 'INVOICE' | 'QUOTE' | 'PROPOSAL';
export type BusinessDocStatus = 'DRAFT' | 'SENT' | 'ACCEPTED' | 'PAID' | 'DECLINED' | 'VOID';
export interface BusinessDocLine {
  id: string;
  description: string;
  qty: number;
  rateCents: number;
  lineTotalCents: number;
}
export interface BusinessDoc {
  id: string;
  type: BusinessDocType;
  number: string;
  clientName: string;
  clientAbn: string | null;
  date: string;
  gst: boolean;
  notes: string | null;
  status: BusinessDocStatus;
  subtotalCents: number;
  gstCents: number;
  totalCents: number;
  createdAt: string;
  lines: BusinessDocLine[];
}
export interface BusinessDocLineInput {
  description: string;
  qty: number;
  /** Rate in dollars (server converts to cents). */
  rate: number;
}
export interface BusinessDocInput {
  type?: BusinessDocType;
  number?: string;
  clientName: string;
  clientAbn?: string;
  date?: string;
  gst?: boolean;
  notes?: string;
  lines: BusinessDocLineInput[];
}

export interface PieceRate {
  id: string;
  name: string;
  unitLabel: string;
  rateCents: number;
  minWageCents: number | null;
  active: boolean;
}
export interface PieceRateInput {
  name: string;
  unitLabel: string;
  /** Rate in dollars. */
  rate: number;
  /** Optional award-floor hourly check, in dollars. */
  minWage?: number;
}
