import { Injectable } from '@nestjs/common';
import type { PersonDetail, PersonProfile, WorkExperience } from '@workarmy/types';
import type {
  DbPersonProfile,
  DbWorkExperience,
  PersonProfileUpdateInput,
  WorkExperienceInputData,
} from './persons.types';
import { PrismaService } from '../../prisma/prisma.service';
import { MembershipService } from '../../common/membership/membership.service';
import { ApiException } from '../../common/errors/api-exception';

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
      experiences: person.experiences.map(toExperience),
    };
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
    completeness: p.completeness,
  };
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
