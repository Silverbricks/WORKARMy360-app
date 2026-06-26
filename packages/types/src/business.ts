// ---------------------------------------------------------------------------
// Business dashboard — Membership/billing, Business card, Requirements
// ---------------------------------------------------------------------------

export interface Plan {
  code: string;
  name: string;
  priceCents: number;
  interval: string;
  blurb: string;
  features: string[];
}

export type SubscriptionStatus = 'ACTIVE' | 'TRIALING' | 'PAST_DUE' | 'CANCELLED';
export interface Subscription {
  planCode: string;
  status: SubscriptionStatus;
  currentPeriodEnd: string | null;
  paymentLast4: string | null;
  paymentBrand: string | null;
}

export type MemberInvoiceStatus = 'OPEN' | 'PAID';
export interface MemberInvoice {
  id: string;
  number: string;
  amountCents: number;
  status: MemberInvoiceStatus;
  issuedAt: string;
  paidAt: string | null;
}

export interface BusinessCard {
  headline: string | null;
  tagline: string | null;
  about: string | null;
  publicSlug: string | null;
  published: boolean;
  contactEmail: string | null;
  contactPhone: string | null;
}
export interface BusinessCardInput {
  headline?: string;
  tagline?: string;
  about?: string;
  publicSlug?: string;
  published?: boolean;
  contactEmail?: string;
  contactPhone?: string;
}

export type RequirementKind = 'NEED_STAFF' | 'NEED_CLIENTS' | 'OFFER_SERVICE';
export type RequirementAudience = 'B2B' | 'B2C' | 'BOTH';
export type RequirementStatus = 'OPEN' | 'CLOSED';
export interface Requirement {
  id: string;
  kind: RequirementKind;
  audience: RequirementAudience;
  title: string;
  description: string | null;
  location: string | null;
  status: RequirementStatus;
  createdAt: string;
}
export interface RequirementInput {
  kind?: RequirementKind;
  audience?: RequirementAudience;
  title: string;
  description?: string;
  location?: string;
}
