import { Injectable } from '@nestjs/common';
import type {
  BusinessCard,
  CredentialView,
  MemberInvoice,
  Plan,
  Requirement,
  Subscription,
  VerificationView,
} from '@workarmy/types';
import type {
  BusinessCardData,
  CredentialInputData,
  PaymentMethodData,
  RequirementInputData,
} from '@workarmy/validation';
import { PrismaService } from '../../prisma/prisma.service';
import { MembershipService } from '../../common/membership/membership.service';
import { ApiException } from '../../common/errors/api-exception';

const PLANS: Plan[] = [
  { code: 'free', name: 'Free', priceCents: 0, interval: 'mo', blurb: 'Browse workers, 1 active job', features: ['Browse the worker directory', '1 active job post', 'Basic profile & business page'] },
  { code: 'starter', name: 'Starter', priceCents: 2900, interval: 'mo', blurb: '5 active jobs, basic roster', features: ['Everything in Free', '5 active job posts', 'Basic rosters & timesheets', 'Applicant pipeline'] },
  { code: 'growth', name: 'Growth', priceCents: 9900, interval: 'mo', blurb: '50 workers, HR, dispatch', features: ['Everything in Starter', 'Up to 50 active workers', 'HR (leave, reviews, onboarding)', 'Urgent & bulk dispatch', 'QR clock-in'] },
  { code: 'pro', name: 'Professional', priceCents: 24900, interval: 'mo', blurb: 'Unlimited, pay runs, reports', features: ['Everything in Growth', 'Unlimited workers', 'Pay runs (PAYG, super, STP)', 'Invoices, quotes & proposals', 'Full reports & exports'] },
  { code: 'enterprise', name: 'Enterprise', priceCents: 0, interval: 'custom', blurb: 'Multi-site, account manager', features: ['Everything in Professional', 'Multi-site & multi-entity', 'Dedicated account manager', 'API & integrations'] },
];

@Injectable()
export class BusinessService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly membership: MembershipService,
  ) {}

  plans(): Plan[] {
    return PLANS;
  }

  // ---- Subscription ----
  async getSubscription(userId: string): Promise<Subscription> {
    const { orgId } = await this.membership.requireOrg(userId);
    const sub = await this.prisma.subscription.upsert({
      where: { orgId },
      update: {},
      create: { orgId },
    });
    return toSub(sub);
  }

  async subscribe(userId: string, planCode: string): Promise<Subscription> {
    const { orgId } = await this.membership.requireOrg(userId);
    const plan = PLANS.find((p) => p.code === planCode);
    if (!plan) throw ApiException.badRequest('VALIDATION_ERROR', 'Unknown plan.');
    const sub = await this.prisma.subscription.upsert({
      where: { orgId },
      update: { planCode, status: 'ACTIVE', currentPeriodEnd: periodEnd() },
      create: { orgId, planCode, status: 'ACTIVE', currentPeriodEnd: periodEnd() },
    });
    if (plan.priceCents > 0) {
      const count = await this.prisma.memberInvoice.count({ where: { orgId } });
      await this.prisma.memberInvoice.create({
        data: {
          orgId,
          number: `WA-${new Date().getFullYear()}-${1000 + count + 1}`,
          amountCents: plan.priceCents,
          status: 'PAID',
          issuedAt: new Date().toISOString().slice(0, 10),
          paidAt: new Date().toISOString().slice(0, 10),
        },
      });
    }
    return toSub(sub);
  }

  async cancel(userId: string): Promise<Subscription> {
    const { orgId } = await this.membership.requireOrg(userId);
    const sub = await this.prisma.subscription.upsert({
      where: { orgId },
      update: { status: 'CANCELLED' },
      create: { orgId, status: 'CANCELLED' },
    });
    return toSub(sub);
  }

  async setPayment(userId: string, input: PaymentMethodData): Promise<Subscription> {
    const { orgId } = await this.membership.requireOrg(userId);
    const sub = await this.prisma.subscription.upsert({
      where: { orgId },
      update: { paymentLast4: input.last4, paymentBrand: input.brand },
      create: { orgId, paymentLast4: input.last4, paymentBrand: input.brand },
    });
    return toSub(sub);
  }

  async memberInvoices(userId: string): Promise<MemberInvoice[]> {
    const { orgId } = await this.membership.requireOrg(userId);
    const rows = await this.prisma.memberInvoice.findMany({ where: { orgId }, orderBy: { issuedAt: 'desc' } });
    return rows.map((m) => ({ id: m.id, number: m.number, amountCents: m.amountCents, status: m.status, issuedAt: m.issuedAt, paidAt: m.paidAt }));
  }

  // ---- Business card ----
  async getCard(userId: string): Promise<BusinessCard> {
    const { orgId } = await this.membership.requireOrg(userId);
    const c = await this.prisma.businessCard.findUnique({ where: { orgId } });
    return c
      ? { headline: c.headline, tagline: c.tagline, about: c.about, publicSlug: c.publicSlug, published: c.published, contactEmail: c.contactEmail, contactPhone: c.contactPhone }
      : { headline: null, tagline: null, about: null, publicSlug: null, published: false, contactEmail: null, contactPhone: null };
  }

  async updateCard(userId: string, input: BusinessCardData): Promise<BusinessCard> {
    const { orgId } = await this.membership.requireOrg(userId);
    const data = {
      headline: input.headline ?? null,
      tagline: input.tagline ?? null,
      about: input.about ?? null,
      publicSlug: input.publicSlug?.trim() ? input.publicSlug.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-') : null,
      published: input.published ?? false,
      contactEmail: input.contactEmail ?? null,
      contactPhone: input.contactPhone ?? null,
    };
    const c = await this.prisma.businessCard.upsert({ where: { orgId }, update: data, create: { orgId, ...data } });
    return { headline: c.headline, tagline: c.tagline, about: c.about, publicSlug: c.publicSlug, published: c.published, contactEmail: c.contactEmail, contactPhone: c.contactPhone };
  }

  // ---- Requirements ----
  async listRequirements(userId: string): Promise<Requirement[]> {
    const { orgId } = await this.membership.requireOrg(userId);
    const rows = await this.prisma.requirement.findMany({ where: { orgId }, orderBy: { createdAt: 'desc' } });
    return rows.map(toReq);
  }
  async createRequirement(userId: string, input: RequirementInputData): Promise<Requirement> {
    const { orgId } = await this.membership.requireOrg(userId);
    const r = await this.prisma.requirement.create({
      data: { orgId, kind: input.kind ?? 'NEED_STAFF', audience: input.audience ?? 'BOTH', title: input.title, description: input.description?.trim() || null, location: input.location?.trim() || null },
    });
    return toReq(r);
  }
  async closeRequirement(userId: string, id: string): Promise<Requirement> {
    const { orgId } = await this.membership.requireOrg(userId);
    const existing = await this.prisma.requirement.findFirst({ where: { id, orgId }, select: { id: true } });
    if (!existing) throw ApiException.notFound('Requirement not found.');
    const r = await this.prisma.requirement.update({ where: { id }, data: { status: 'CLOSED' } });
    return toReq(r);
  }
  async removeRequirement(userId: string, id: string): Promise<{ ok: true }> {
    const { orgId } = await this.membership.requireOrg(userId);
    await this.prisma.requirement.deleteMany({ where: { id, orgId } });
    return { ok: true as const };
  }

  // ---- Compliance (org credentials + verifications) ----
  async credentials(userId: string): Promise<CredentialView[]> {
    const { orgId } = await this.membership.requireOrg(userId);
    const rows = await this.prisma.credential.findMany({
      where: { orgId },
      include: { verifications: { orderBy: { createdAt: 'desc' }, take: 1 } },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(toCredential);
  }
  async addCredential(userId: string, input: CredentialInputData): Promise<CredentialView> {
    const { orgId } = await this.membership.requireOrg(userId);
    const c = await this.prisma.credential.create({
      data: { orgId, type: input.type, identifier: input.identifier?.trim() || null, issuer: input.issuer?.trim() || null, expiresAt: input.expiresAt ? new Date(input.expiresAt) : null },
      include: { verifications: true },
    });
    return toCredential(c);
  }
  async removeCredential(userId: string, id: string): Promise<{ ok: true }> {
    const { orgId } = await this.membership.requireOrg(userId);
    await this.prisma.credential.deleteMany({ where: { id, orgId } });
    return { ok: true as const };
  }
  async verifications(userId: string): Promise<VerificationView[]> {
    const { orgId } = await this.membership.requireOrg(userId);
    const rows = await this.prisma.verification.findMany({
      where: { subjectOrgId: orgId },
      include: { credential: { select: { type: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((v) => ({ id: v.id, status: v.status, credentialType: v.credential?.type ?? null, reviewNote: v.reviewNote, reviewedAt: v.reviewedAt ? v.reviewedAt.toISOString() : null, createdAt: v.createdAt.toISOString() }));
  }
  async requestVerification(userId: string, credentialId: string): Promise<VerificationView> {
    const { orgId } = await this.membership.requireOrg(userId);
    const cred = await this.prisma.credential.findFirst({ where: { id: credentialId, orgId }, select: { id: true, type: true } });
    if (!cred) throw ApiException.notFound('Credential not found.');
    const v = await this.prisma.verification.create({ data: { subjectOrgId: orgId, credentialId, status: 'PENDING' } });
    return { id: v.id, status: v.status, credentialType: cred.type, reviewNote: v.reviewNote, reviewedAt: null, createdAt: v.createdAt.toISOString() };
  }
}

function periodEnd(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth() + 1, 1).toISOString().slice(0, 10);
}
function toSub(s: { planCode: string; status: Subscription['status']; currentPeriodEnd: string | null; paymentLast4: string | null; paymentBrand: string | null }): Subscription {
  return { planCode: s.planCode, status: s.status, currentPeriodEnd: s.currentPeriodEnd, paymentLast4: s.paymentLast4, paymentBrand: s.paymentBrand };
}
function toReq(r: { id: string; kind: Requirement['kind']; audience: Requirement['audience']; title: string; description: string | null; location: string | null; status: Requirement['status']; createdAt: Date }): Requirement {
  return { id: r.id, kind: r.kind, audience: r.audience, title: r.title, description: r.description, location: r.location, status: r.status, createdAt: r.createdAt.toISOString() };
}
function toCredential(c: { id: string; type: string; identifier: string | null; issuer: string | null; expiresAt: Date | null; createdAt: Date; verifications: { status: 'PENDING' | 'APPROVED' | 'REJECTED' }[] }): CredentialView {
  return {
    id: c.id,
    type: c.type,
    identifier: c.identifier,
    issuer: c.issuer,
    expiresAt: c.expiresAt ? c.expiresAt.toISOString() : null,
    document: null,
    verificationStatus: c.verifications[0]?.status ?? 'NONE',
    createdAt: c.createdAt.toISOString(),
  };
}
