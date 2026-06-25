// ---------------------------------------------------------------------------
// Business dashboard — HR: leave, reviews, onboarding, warnings
// ---------------------------------------------------------------------------

export type LeaveType = 'ANNUAL' | 'SICK' | 'UNPAID' | 'OTHER';
export type LeaveStatus = 'REQUESTED' | 'APPROVED' | 'DECLINED' | 'CANCELLED';

export interface LeaveRequest {
  id: string;
  personName: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  reason: string | null;
  status: LeaveStatus;
  createdAt: string;
}
export interface LeaveInput {
  personName: string;
  type?: LeaveType;
  startDate: string;
  endDate: string;
  reason?: string;
}

export interface PerformanceReview {
  id: string;
  personName: string;
  rating: number;
  comments: string | null;
  period: string | null;
  createdAt: string;
}
export interface PerformanceReviewInput {
  personName: string;
  rating: number;
  comments?: string;
  period?: string;
}

export type OnboardingKind = 'ONBOARDING' | 'OFFBOARDING';
export type OnboardingStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETE';

export interface OnboardingCase {
  id: string;
  personName: string;
  kind: OnboardingKind;
  step: string | null;
  status: OnboardingStatus;
  createdAt: string;
}
export interface OnboardingInput {
  personName: string;
  kind?: OnboardingKind;
  step?: string;
}

export type WarningKind = 'WARNING' | 'INCIDENT';
export type WarningSeverity = 'LOW' | 'MEDIUM' | 'HIGH';

export interface Warning {
  id: string;
  personName: string;
  kind: WarningKind;
  severity: WarningSeverity;
  summary: string;
  details: string | null;
  occurredAt: string | null;
  createdAt: string;
}
export interface WarningInput {
  personName: string;
  kind?: WarningKind;
  severity?: WarningSeverity;
  summary: string;
  details?: string;
  occurredAt?: string;
}

export interface HrOverview {
  pendingLeave: number;
  reviews: number;
  onboarding: number;
  warnings: number;
}
