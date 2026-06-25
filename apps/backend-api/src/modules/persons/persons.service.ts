import { Injectable } from '@nestjs/common';
import { allocateWaId } from '@workarmy/database';
import type {
  AvailabilityCard,
  BecomeProviderInput,
  EmployerSummary,
  OrgSummary,
  PersonDetail,
  PersonPreferences,
  PersonProfile,
  UserSettings,
  UserSettingsUpdate,
  WorkExperience,
} from '@workarmy/types';
import type {
  AvailabilityCardUpdateData,
  DbPersonProfile,
  DbWorkExperience,
  PersonPreferencesUpdateInput,
  PersonProfileUpdateInput,
  WorkExperienceInputData,
} from './persons.types';
import { PrismaService } from '../../prisma/prisma.service';
import { MembershipService } from '../../common/membership/membership.service';
import { ApiException } from '../../common/errors/api-exception';
import { env } from '../../config/env';

/** Fields that count toward profile completeness (a UX metric, not compliance). */
const COMPLETENESS_FIELDS = [
  'firstName',
  'lastName',
  'mobile',
  'dateOfBirth',
  'addressLine',
  'suburb',
  'state',
  'postcode',
  'headline',
  'about',
  'skills',
  'industries',
  'availability',
  'hireStatus',
] as const;

@Injectable()
export class PersonsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly membership: MembershipService,
  ) {}

  async getMe(userId: string): Promise<PersonDetail> {
    const personId = await this.membership.requirePerson(userId);
    const person = await this.prisma.person.findUnique({
      where: { id: personId },
      include: {
        user: { select: { email: true } },
        profile: true,
        experiences: { orderBy: [{ current: 'desc' }, { startDate: 'desc' }] },
      },
    });
    if (!person) throw ApiException.notFound('Profile not found.');
    return {
      waId: person.waId,
      accountType: person.accountType,
      firstName: person.firstName,
      lastName: person.lastName,
      mobile: person.mobile,
      email: person.user.email,
      profile: person.profile ? toProfile(person.profile) : null,
      preferences: person.profile ? toPreferences(person.profile) : null,
      experiences: person.experiences.map(toExperience),
    };
  }

  async becomeProvider(userId: string, input: BecomeProviderInput): Promise<OrgSummary> {
    const ctx = await this.membership.getContext(userId);
    if (!ctx.personId) throw ApiException.unauthorized();
    if (ctx.orgId) {
      throw ApiException.badRequest('VALIDATION_ERROR', 'You already have a provider organisation.');
    }
    const personId = ctx.personId;
    const approved = !env.ORG_VERIFICATION_REQUIRED;
    const org = await this.prisma.$transaction(async (tx) => {
      const waId = await allocateWaId(tx);
      return tx.organisation.create({
        data: {
          waId,
          accountType: input.accountType,
          name: input.companyName,
          verificationStatus: approved ? 'APPROVED' : 'PENDING',
          verifiedAt: approved ? new Date() : null,
          members: { create: { personId, role: 'owner' } },
          profile: { create: {} },
          verifications: { create: { status: approved ? 'APPROVED' : 'PENDING' } },
        },
      });
    });
    return {
      id: org.id,
      waId: org.waId,
      accountType: org.accountType,
      name: org.name,
      role: 'owner',
      verificationStatus: org.verificationStatus,
    };
  }

  async employers(userId: string): Promise<EmployerSummary[]> {
    const personId = await this.membership.requirePerson(userId);
    const [assignments, hired] = await Promise.all([
      this.prisma.shiftAssignment.findMany({
        where: { personId },
        include: { shift: { include: { organisation: true } } },
      }),
      this.prisma.jobApplication.findMany({
        where: { personId, stage: 'HIRED' },
        include: { job: { include: { organisation: true } } },
      }),
    ]);
    const now = new Date();
    const map = new Map<string, EmployerSummary>();
    for (const a of assignments) {
      const o = a.shift.organisation;
      const e =
        map.get(o.id) ??
        { orgId: o.id, name: o.name, accountType: o.accountType, current: false, shiftsCount: 0 };
      e.shiftsCount += 1;
      if (a.shift.endAt >= now && a.shift.status !== 'CANCELLED') e.current = true;
      map.set(o.id, e);
    }
    for (const h of hired) {
      const o = h.job.organisation;
      const e =
        map.get(o.id) ??
        { orgId: o.id, name: o.name, accountType: o.accountType, current: true, shiftsCount: 0 };
      e.current = true;
      map.set(o.id, e);
    }
    return [...map.values()];
  }

  async setHireStatus(userId: string, hireStatus: string): Promise<{ ok: true }> {
    const personId = await this.membership.requirePerson(userId);
    await this.prisma.personProfile.upsert({
      where: { personId },
      update: { hireStatus },
      create: { personId, hireStatus, completeness: 0 },
    });
    return { ok: true as const };
  }

  async markComplete(userId: string): Promise<{ ok: true }> {
    const personId = await this.membership.requirePerson(userId);
    await this.prisma.person.update({ where: { id: personId }, data: { profileComplete: true } });
    return { ok: true as const };
  }

  async getAvailabilityCard(userId: string): Promise<AvailabilityCard> {
    const personId = await this.membership.requirePerson(userId);
    const profile = await this.prisma.personProfile.findUnique({ where: { personId } });
    return profile ? toCard(profile) : emptyCard();
  }

  async updateAvailabilityCard(
    userId: string,
    input: AvailabilityCardUpdateData,
  ): Promise<AvailabilityCard> {
    const personId = await this.membership.requirePerson(userId);
    const data = buildCardData(input);
    // Card is NOT part of completeness (Principle 4) — leave it untouched.
    const profile = await this.prisma.personProfile.upsert({
      where: { personId },
      update: data,
      create: { personId, completeness: 0, ...data },
    });
    return toCard(profile);
  }

  async getSettings(userId: string): Promise<UserSettings> {
    const s = await this.prisma.userSettings.findUnique({ where: { userId } });
    return s
      ? {
          notifyJobs: s.notifyJobs,
          notifyMessages: s.notifyMessages,
          notifyCompliance: s.notifyCompliance,
          profilePublic: s.profilePublic,
          language: s.language,
        }
      : {
          notifyJobs: true,
          notifyMessages: true,
          notifyCompliance: true,
          profilePublic: false,
          language: 'en-AU',
        };
  }

  async updateSettings(userId: string, input: UserSettingsUpdate): Promise<UserSettings> {
    const s = await this.prisma.userSettings.upsert({
      where: { userId },
      update: { ...input },
      create: { userId, ...input },
    });
    return {
      notifyJobs: s.notifyJobs,
      notifyMessages: s.notifyMessages,
      notifyCompliance: s.notifyCompliance,
      profilePublic: s.profilePublic,
      language: s.language,
    };
  }

  async setPhoto(userId: string, documentId: string): Promise<PersonProfile> {
    const personId = await this.membership.requirePerson(userId);
    const doc = await this.prisma.document.findFirst({
      where: { id: documentId, ownerPersonId: personId },
      select: { id: true },
    });
    if (!doc) throw ApiException.badRequest('VALIDATION_ERROR', 'Document not found.');
    const profile = await this.prisma.personProfile.upsert({
      where: { personId },
      update: { photoDocumentId: documentId },
      create: { personId, photoDocumentId: documentId, completeness: 0 },
    });
    return toProfile(profile);
  }

  async getPreferences(userId: string): Promise<PersonPreferences> {
    const personId = await this.membership.requirePerson(userId);
    const profile = await this.prisma.personProfile.findUnique({ where: { personId } });
    return profile ? toPreferences(profile) : emptyPreferences();
  }

  async updatePreferences(
    userId: string,
    input: PersonPreferencesUpdateInput,
  ): Promise<PersonPreferences> {
    const personId = await this.membership.requirePerson(userId);
    if (input.preferredLocations && input.preferredLocations.split(',').filter((s) => s.trim()).length > 3) {
      throw ApiException.badRequest('VALIDATION_ERROR', 'Choose at most 3 preferred locations.');
    }
    // Preferences are NOT part of completeness (Principle 4) — leave it untouched.
    const profile = await this.prisma.personProfile.upsert({
      where: { personId },
      update: { ...input },
      create: { personId, ...input, completeness: 0 },
    });
    return toPreferences(profile);
  }

  async updateProfile(userId: string, input: PersonProfileUpdateInput): Promise<PersonProfile> {
    const personId = await this.membership.requirePerson(userId);
    const completeness = computeCompleteness(input);
    const { firstName, lastName, mobile, ...profileFields } = input;

    const profile = await this.prisma.$transaction(async (tx) => {
      await tx.person.update({
        where: { id: personId },
        data: {
          firstName: firstName === '' ? null : firstName,
          lastName: lastName === '' ? null : lastName,
          mobile: mobile === '' ? null : mobile,
          profileComplete: completeness >= 80,
        },
      });
      return tx.personProfile.upsert({
        where: { personId },
        update: { ...profileFields, completeness },
        create: { personId, ...profileFields, completeness },
      });
    });
    return toProfile(profile);
  }

  async addExperience(userId: string, input: WorkExperienceInputData): Promise<WorkExperience> {
    const personId = await this.membership.requirePerson(userId);
    const created = await this.prisma.workExperience.create({
      data: {
        personId,
        employer: input.employer,
        position: input.position ?? null,
        employmentType: input.employmentType ?? null,
        location: input.location ?? null,
        startDate: input.startDate || null,
        endDate: input.endDate || null,
        current: input.current ?? false,
        summary: input.summary ?? null,
      },
    });
    return toExperience(created);
  }

  async updateExperience(
    userId: string,
    id: string,
    input: Partial<WorkExperienceInputData>,
  ): Promise<WorkExperience> {
    const personId = await this.membership.requirePerson(userId);
    const existing = await this.prisma.workExperience.findFirst({ where: { id, personId } });
    if (!existing) throw ApiException.notFound('Experience not found.');
    const updated = await this.prisma.workExperience.update({
      where: { id },
      data: toExperienceData(input),
    });
    return toExperience(updated);
  }

  async deleteExperience(userId: string, id: string) {
    const personId = await this.membership.requirePerson(userId);
    const existing = await this.prisma.workExperience.findFirst({ where: { id, personId } });
    if (!existing) throw ApiException.notFound('Experience not found.');
    await this.prisma.workExperience.delete({ where: { id } });
    return { ok: true as const };
  }
}

function computeCompleteness(data: PersonProfileUpdateInput): number {
  const filled = COMPLETENESS_FIELDS.filter((f) => {
    const v = (data as Record<string, unknown>)[f];
    return typeof v === 'string' && v.trim().length > 0;
  }).length;
  return Math.round((filled / COMPLETENESS_FIELDS.length) * 100);
}

function toExperienceData(input: Partial<WorkExperienceInputData>) {
  return {
    employer: input.employer,
    position: input.position ?? null,
    employmentType: input.employmentType ?? null,
    location: input.location ?? null,
    startDate: input.startDate || null,
    endDate: input.endDate || null,
    current: input.current,
    summary: input.summary ?? null,
  };
}

function toProfile(p: DbPersonProfile): PersonProfile {
  return {
    photoUrl: p.photoUrl,
    photoDocumentId: p.photoDocumentId,
    dateOfBirth: p.dateOfBirth,
    gender: p.gender,
    nationality: p.nationality,
    addressLine: p.addressLine,
    suburb: p.suburb,
    state: p.state,
    postcode: p.postcode,
    emergencyName: p.emergencyName,
    emergencyPhone: p.emergencyPhone,
    headline: p.headline,
    about: p.about,
    skills: p.skills,
    industries: p.industries,
    languages: p.languages,
    availability: p.availability,
    availableDays: p.availableDays,
    availableHours: p.availableHours,
    hireStatus: p.hireStatus,
    cardQualification: p.cardQualification,
    cardWorkType: p.cardWorkType,
    cardAvailableFrom: p.cardAvailableFrom,
    cardUrgentShifts: p.cardUrgentShifts,
    cardContactPreference: p.cardContactPreference,
    cardPublished: p.cardPublished,
    completeness: p.completeness,
  };
}

function toPreferences(p: DbPersonProfile): PersonPreferences {
  return {
    seekerCategory: p.seekerCategory,
    userTypes: p.userTypes,
    preferredLocations: p.preferredLocations,
    preferredIndustries: p.preferredIndustries,
    preferredJobTypes: p.preferredJobTypes,
    preferredPayMin: p.preferredPayMin,
    willingToRelocate: p.willingToRelocate,
  };
}

function emptyPreferences(): PersonPreferences {
  return {
    seekerCategory: null,
    userTypes: null,
    preferredLocations: null,
    preferredIndustries: null,
    preferredJobTypes: null,
    preferredPayMin: null,
    willingToRelocate: false,
  };
}

function toCard(p: DbPersonProfile): AvailabilityCard {
  return {
    photoDocumentId: p.photoDocumentId,
    qualification: p.cardQualification,
    suburb: p.suburb,
    state: p.state,
    availability: p.availability,
    workType: p.cardWorkType,
    availableFrom: p.cardAvailableFrom,
    urgentShifts: p.cardUrgentShifts,
    willingToRelocate: p.willingToRelocate,
    preferredIndustries: p.preferredIndustries,
    contactPreference: p.cardContactPreference,
    published: p.cardPublished,
  };
}

function emptyCard(): AvailabilityCard {
  return {
    photoDocumentId: null,
    qualification: null,
    suburb: null,
    state: null,
    availability: null,
    workType: null,
    availableFrom: null,
    urgentShifts: false,
    willingToRelocate: false,
    preferredIndustries: null,
    contactPreference: null,
    published: false,
  };
}

function buildCardData(input: AvailabilityCardUpdateData) {
  const data: Record<string, unknown> = {};
  if (input.qualification !== undefined) data.cardQualification = input.qualification || null;
  if (input.suburb !== undefined) data.suburb = input.suburb || null;
  if (input.state !== undefined) data.state = input.state || null;
  if (input.availability !== undefined) data.availability = input.availability || null;
  if (input.workType !== undefined) data.cardWorkType = input.workType || null;
  if (input.availableFrom !== undefined) data.cardAvailableFrom = input.availableFrom || null;
  if (input.urgentShifts !== undefined) data.cardUrgentShifts = input.urgentShifts;
  if (input.willingToRelocate !== undefined) data.willingToRelocate = input.willingToRelocate;
  if (input.preferredIndustries !== undefined) data.preferredIndustries = input.preferredIndustries || null;
  if (input.contactPreference !== undefined) data.cardContactPreference = input.contactPreference || null;
  if (input.published !== undefined) data.cardPublished = input.published;
  return data;
}

function toExperience(e: DbWorkExperience): WorkExperience {
  return {
    id: e.id,
    employer: e.employer,
    position: e.position,
    employmentType: e.employmentType,
    location: e.location,
    startDate: e.startDate,
    endDate: e.endDate,
    current: e.current,
    summary: e.summary,
  };
}
