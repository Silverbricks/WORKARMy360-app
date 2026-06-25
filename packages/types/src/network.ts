// ---------------------------------------------------------------------------
// Business dashboard — Network: engaged providers/agencies, quotes, reports
// ---------------------------------------------------------------------------

export interface ProviderDirectoryOrg {
  waId: string;
  name: string;
  accountType: string;
  industry: string | null;
  region: string | null;
}

export type EngagementStatus = 'ENGAGED' | 'ENDED';
export interface ProviderEngagement {
  id: string;
  providerName: string;
  providerOrgId: string | null;
  kind: string | null;
  category: string | null;
  location: string | null;
  status: EngagementStatus;
}
export interface ProviderEngagementInput {
  providerName: string;
  providerOrgId?: string;
  kind?: string;
  category?: string;
  location?: string;
}

export type QuoteStatus = 'REQUESTED' | 'QUOTED' | 'ACCEPTED' | 'DECLINED';
export interface QuoteRequest {
  id: string;
  toLabel: string;
  scope: string;
  details: string | null;
  amountCents: number | null;
  status: QuoteStatus;
  createdAt: string;
}
export interface QuoteRequestInput {
  toLabel: string;
  scope: string;
  details?: string;
}

export interface ReportSummary {
  payrollTotal: number;
  hoursTotal: number;
  fillRatePct: number;
  workerRating: number;
  openRoles: number;
  activeWorkers: number;
}
