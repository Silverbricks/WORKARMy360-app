import { Injectable } from '@nestjs/common';
import type { Contact, OrganisationDetail, OrgProfile } from '@workarmy/types';
import type {
  ContactInputData,
  DbContact,
  DbProfile,
  OrgProfileUpdateInput,
} from './organisations.types';
import { PrismaService } from '../../prisma/prisma.service';
import { MembershipService } from '../../common/membership/membership.service';
import { ApiException } from '../../common/errors/api-exception';

const PROFILE_FIELDS = [
  'legalName',
  'tradingName',
  'abn',
  'industry',
  'workforceSize',
  'about',
  'addressLine',
  'suburb',
  'state',
  'postcode',
] as const;

@Injectable()
export class OrganisationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly membership: MembershipService,
  ) {}

  async getMe(userId: string): Promise<OrganisationDetail> {
    const { orgId } = await this.membership.requireOrg(userId);
    const org = await this.prisma.organisation.findUnique({
      where: { id: orgId },
      include: { profile: true, contacts: { orderBy: { createdAt: 'asc' } } },
    });
    if (!org) throw ApiException.notFound('Organisation not found.');
    return {
      id: org.id,
      waId: org.waId,
      accountType: org.accountType,
      name: org.name,
      verificationStatus: org.verificationStatus,
      verifiedAt: org.verifiedAt ? org.verifiedAt.toISOString() : null,
      profile: org.profile ? toProfile(org.profile) : null,
      contacts: org.contacts.map(toContact),
    };
  }

  async updateProfile(userId: string, input: OrgProfileUpdateInput): Promise<OrgProfile> {
    const { orgId } = await this.membership.requireOrg(userId);
    const completeness = computeCompleteness(input);
    const profile = await this.prisma.orgProfile.upsert({
      where: { orgId },
      update: { ...input, completeness },
      create: { orgId, ...input, completeness },
    });
    return toProfile(profile);
  }

  async addContact(userId: string, input: ContactInputData): Promise<Contact> {
    const { orgId } = await this.membership.requireOrg(userId);
    const created = await this.prisma.$transaction(async (tx) => {
      if (input.isPrimary) {
        await tx.contact.updateMany({ where: { orgId, isPrimary: true }, data: { isPrimary: false } });
      }
      return tx.contact.create({
        data: {
          orgId,
          firstName: input.firstName,
          lastName: input.lastName,
          position: input.position ?? null,
          email: input.email ? input.email : null,
          phone: input.phone ?? null,
          roleTag: input.roleTag ?? null,
          isPrimary: !!input.isPrimary,
          isBilling: !!input.isBilling,
          isEmergency: !!input.isEmergency,
          isSignatory: !!input.isSignatory,
        },
      });
    });
    return toContact(created);
  }

  async updateContact(userId: string, id: string, input: Partial<ContactInputData>): Promise<Contact> {
    const { orgId } = await this.membership.requireOrg(userId);
    const existing = await this.prisma.contact.findFirst({ where: { id, orgId } });
    if (!existing) throw ApiException.notFound('Contact not found.');
    const updated = await this.prisma.$transaction(async (tx) => {
      if (input.isPrimary) {
        await tx.contact.updateMany({
          where: { orgId, isPrimary: true, NOT: { id } },
          data: { isPrimary: false },
        });
      }
      return tx.contact.update({
        where: { id },
        data: {
          firstName: input.firstName,
          lastName: input.lastName,
          position: input.position,
          email: input.email === '' ? null : input.email,
          phone: input.phone,
          roleTag: input.roleTag,
          isPrimary: input.isPrimary,
          isBilling: input.isBilling,
          isEmergency: input.isEmergency,
          isSignatory: input.isSignatory,
        },
      });
    });
    return toContact(updated);
  }

  async deleteContact(userId: string, id: string) {
    const { orgId } = await this.membership.requireOrg(userId);
    const existing = await this.prisma.contact.findFirst({ where: { id, orgId } });
    if (!existing) throw ApiException.notFound('Contact not found.');
    await this.prisma.contact.delete({ where: { id } });
    return { ok: true as const };
  }
}

function computeCompleteness(data: OrgProfileUpdateInput): number {
  const filled = PROFILE_FIELDS.filter((f) => {
    const v = (data as Record<string, unknown>)[f];
    return typeof v === 'string' && v.trim().length > 0;
  }).length;
  return Math.round((filled / PROFILE_FIELDS.length) * 100);
}

function toProfile(p: DbProfile): OrgProfile {
  return {
    legalName: p.legalName,
    tradingName: p.tradingName,
    abn: p.abn,
    structure: p.structure,
    industry: p.industry,
    workforceSize: p.workforceSize,
    about: p.about,
    website: p.website,
    addressLine: p.addressLine,
    suburb: p.suburb,
    state: p.state,
    postcode: p.postcode,
    region: p.region,
    completeness: p.completeness,
  };
}

function toContact(c: DbContact): Contact {
  return {
    id: c.id,
    firstName: c.firstName,
    lastName: c.lastName,
    position: c.position,
    email: c.email,
    phone: c.phone,
    roleTag: c.roleTag,
    isPrimary: c.isPrimary,
    isBilling: c.isBilling,
    isEmergency: c.isEmergency,
    isSignatory: c.isSignatory,
  };
}
