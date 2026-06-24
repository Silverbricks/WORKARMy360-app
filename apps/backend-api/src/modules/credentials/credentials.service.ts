import { Injectable } from '@nestjs/common';
import type { CredentialView, DocumentView, VerificationView } from '@workarmy/types';
import { Prisma } from '@workarmy/database';
import type { CredentialInputData } from '@workarmy/validation';
import { PrismaService } from '../../prisma/prisma.service';
import { MembershipService } from '../../common/membership/membership.service';
import { ApiException } from '../../common/errors/api-exception';

type CredentialRow = Prisma.CredentialGetPayload<{
  include: { document: true; verifications: true };
}>;
type VerificationRow = Prisma.VerificationGetPayload<{ include: { credential: true } }>;

const withCredential = {
  document: true,
  verifications: { orderBy: { createdAt: 'desc' as const }, take: 1 },
};

@Injectable()
export class CredentialsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly membership: MembershipService,
  ) {}

  async list(userId: string): Promise<CredentialView[]> {
    const personId = await this.membership.requirePerson(userId);
    const rows = await this.prisma.credential.findMany({
      where: { personId },
      orderBy: { createdAt: 'desc' },
      include: withCredential,
    });
    return rows.map(toCredentialView);
  }

  async add(userId: string, input: CredentialInputData): Promise<CredentialView> {
    const personId = await this.membership.requirePerson(userId);
    if (input.documentId) {
      const doc = await this.prisma.document.findFirst({
        where: { id: input.documentId, ownerPersonId: personId },
        select: { id: true },
      });
      if (!doc) throw ApiException.badRequest('VALIDATION_ERROR', 'Document not found.');
    }
    const cred = await this.prisma.credential.create({
      data: {
        personId,
        type: input.type,
        identifier: input.identifier || null,
        issuer: input.issuer || null,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
        documentId: input.documentId || null,
      },
      include: withCredential,
    });
    return toCredentialView(cred);
  }

  async remove(userId: string, id: string): Promise<{ ok: true }> {
    const personId = await this.membership.requirePerson(userId);
    const existing = await this.prisma.credential.findFirst({ where: { id, personId } });
    if (!existing) throw ApiException.notFound('Credential not found.');
    await this.prisma.credential.delete({ where: { id } });
    return { ok: true as const };
  }

  async verifications(userId: string): Promise<VerificationView[]> {
    const personId = await this.membership.requirePerson(userId);
    const rows = await this.prisma.verification.findMany({
      where: { subjectPersonId: personId },
      orderBy: { createdAt: 'desc' },
      include: { credential: true },
    });
    return rows.map(toVerificationView);
  }

  async requestVerification(userId: string, credentialId: string): Promise<VerificationView> {
    const personId = await this.membership.requirePerson(userId);
    const cred = await this.prisma.credential.findFirst({ where: { id: credentialId, personId } });
    if (!cred) throw ApiException.notFound('Credential not found.');
    const pending = await this.prisma.verification.findFirst({
      where: { subjectPersonId: personId, credentialId, status: 'PENDING' },
      include: { credential: true },
    });
    if (pending) return toVerificationView(pending);
    const v = await this.prisma.verification.create({
      data: { subjectPersonId: personId, credentialId, status: 'PENDING' },
      include: { credential: true },
    });
    return toVerificationView(v);
  }
}

function toCredentialView(c: CredentialRow): CredentialView {
  const d = c.document;
  return {
    id: c.id,
    type: c.type,
    identifier: c.identifier,
    issuer: c.issuer,
    expiresAt: c.expiresAt ? c.expiresAt.toISOString().slice(0, 10) : null,
    document: d
      ? {
          id: d.id,
          kind: d.kind as DocumentView['kind'],
          fileName: d.fileName,
          mimeType: d.mimeType,
          sizeBytes: d.sizeBytes,
          createdAt: d.createdAt.toISOString(),
        }
      : null,
    verificationStatus: c.verifications[0]?.status ?? 'NONE',
    createdAt: c.createdAt.toISOString(),
  };
}

function toVerificationView(v: VerificationRow): VerificationView {
  return {
    id: v.id,
    status: v.status,
    credentialType: v.credential?.type ?? null,
    reviewNote: v.reviewNote,
    reviewedAt: v.reviewedAt ? v.reviewedAt.toISOString() : null,
    createdAt: v.createdAt.toISOString(),
  };
}
