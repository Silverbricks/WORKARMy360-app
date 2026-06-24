import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import type {
  CoverLetter,
  DocumentView,
  PublicResume,
  ResumeView,
  WorkExperience,
} from '@workarmy/types';
import { Prisma } from '@workarmy/database';
import type { Resume as DbResume } from '@workarmy/database';
import type { ResumeUpdateData } from '@workarmy/validation';
import { PrismaService } from '../../prisma/prisma.service';
import { MembershipService } from '../../common/membership/membership.service';
import { ApiException } from '../../common/errors/api-exception';

function newToken(): string {
  return randomBytes(12).toString('hex');
}

@Injectable()
export class ResumeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly membership: MembershipService,
  ) {}

  private async ensure(personId: string): Promise<DbResume> {
    const existing = await this.prisma.resume.findUnique({ where: { personId } });
    if (existing) return existing;
    return this.prisma.resume.create({ data: { personId, shareToken: newToken() } });
  }

  async getMe(userId: string): Promise<ResumeView> {
    const personId = await this.membership.requirePerson(userId);
    return this.toView(await this.ensure(personId));
  }

  async update(userId: string, input: ResumeUpdateData): Promise<ResumeView> {
    const personId = await this.membership.requirePerson(userId);
    await this.ensure(personId);
    if (input.documentId) {
      const doc = await this.prisma.document.findFirst({
        where: { id: input.documentId, ownerPersonId: personId },
        select: { id: true },
      });
      if (!doc) throw ApiException.badRequest('VALIDATION_ERROR', 'Document not found.');
    }
    const r = await this.prisma.resume.update({
      where: { personId },
      data: {
        headline: input.headline ?? undefined,
        summary: input.summary ?? undefined,
        coverLetters:
          input.coverLetters === undefined
            ? undefined
            : (input.coverLetters as unknown as Prisma.InputJsonValue),
        documentId: input.documentId === undefined ? undefined : input.documentId,
      },
    });
    return this.toView(r);
  }

  async setShare(userId: string, isPublic: boolean): Promise<ResumeView> {
    const personId = await this.membership.requirePerson(userId);
    await this.ensure(personId);
    const r = await this.prisma.resume.update({ where: { personId }, data: { isPublic } });
    return this.toView(r);
  }

  async publicByToken(token: string): Promise<PublicResume> {
    const r = await this.prisma.resume.findUnique({
      where: { shareToken: token },
      include: {
        person: {
          include: {
            profile: true,
            experiences: { orderBy: [{ current: 'desc' }, { startDate: 'desc' }] },
            credentials: { include: { verifications: { orderBy: { createdAt: 'desc' }, take: 1 } } },
          },
        },
      },
    });
    if (!r || !r.isPublic) throw ApiException.notFound('Resume not found.');
    const p = r.person;
    return {
      waId: p.waId,
      firstName: p.firstName,
      lastName: p.lastName,
      headline: r.headline,
      summary: r.summary,
      photoDocumentId: p.profile?.photoDocumentId ?? null,
      resumeDocumentId: r.documentId,
      skills: p.profile?.skills ?? null,
      experiences: p.experiences.map(toExperience),
      credentials: p.credentials.map((c) => ({
        type: c.type,
        verified: c.verifications[0]?.status === 'APPROVED',
      })),
    };
  }

  private async toView(r: DbResume): Promise<ResumeView> {
    let document: ResumeView['document'] = null;
    if (r.documentId) {
      const d = await this.prisma.document.findUnique({ where: { id: r.documentId } });
      if (d) {
        document = {
          id: d.id,
          kind: d.kind as DocumentView['kind'],
          fileName: d.fileName,
          mimeType: d.mimeType,
          sizeBytes: d.sizeBytes,
          createdAt: d.createdAt.toISOString(),
        };
      }
    }
    return {
      headline: r.headline,
      summary: r.summary,
      coverLetters: (r.coverLetters as unknown as CoverLetter[] | null) ?? [],
      document,
      shareToken: r.shareToken,
      isPublic: r.isPublic,
    };
  }
}

function toExperience(e: {
  id: string;
  employer: string;
  position: string | null;
  employmentType: string | null;
  location: string | null;
  startDate: string | null;
  endDate: string | null;
  current: boolean;
  summary: string | null;
}): WorkExperience {
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
