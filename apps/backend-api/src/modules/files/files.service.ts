import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import { extname, join, resolve } from 'path';
import { randomUUID } from 'crypto';
import type { DocumentKind, DocumentView } from '@workarmy/types';
import { DOCUMENT_KINDS } from '@workarmy/types';
import type { Document as DbDocument } from '@workarmy/database';
import { PrismaService } from '../../prisma/prisma.service';
import { MembershipService } from '../../common/membership/membership.service';
import { ApiException } from '../../common/errors/api-exception';
import { env } from '../../config/env';

/** Minimal shape of a Multer-parsed upload (avoids a @types/multer dependency). */
export interface UploadedFileLike {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

const ALLOWED_EXT = ['.pdf', '.jpg', '.jpeg', '.png', '.webp', '.doc', '.docx'];

@Injectable()
export class FilesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly membership: MembershipService,
  ) {}

  async upload(userId: string, file: UploadedFileLike | undefined, kindRaw?: string): Promise<DocumentView> {
    const personId = await this.membership.requirePerson(userId);
    if (!file) throw ApiException.badRequest('VALIDATION_ERROR', 'No file uploaded.');
    const kind: DocumentKind = DOCUMENT_KINDS.includes(kindRaw as DocumentKind)
      ? (kindRaw as DocumentKind)
      : 'OTHER';
    const ext = extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXT.includes(ext)) {
      throw ApiException.badRequest('VALIDATION_ERROR', 'Unsupported file type.');
    }
    if (file.size > env.MAX_UPLOAD_MB * 1024 * 1024) {
      throw ApiException.badRequest('VALIDATION_ERROR', `File exceeds ${env.MAX_UPLOAD_MB}MB.`);
    }

    const dir = join(env.UPLOAD_DIR, personId);
    await fs.mkdir(dir, { recursive: true });
    const storageKey = join(personId, `${randomUUID()}${ext}`);
    await fs.writeFile(join(env.UPLOAD_DIR, storageKey), file.buffer);

    const doc = await this.prisma.document.create({
      data: {
        ownerPersonId: personId,
        uploadedByUserId: userId,
        kind,
        fileName: file.originalname.slice(0, 200),
        storageKey,
        mimeType: file.mimetype,
        sizeBytes: file.size,
      },
    });
    return toView(doc);
  }

  async listMine(userId: string): Promise<DocumentView[]> {
    const personId = await this.membership.requirePerson(userId);
    const docs = await this.prisma.document.findMany({
      where: { ownerPersonId: personId },
      orderBy: { createdAt: 'desc' },
    });
    return docs.map(toView);
  }

  async remove(userId: string, id: string): Promise<{ ok: true }> {
    const personId = await this.membership.requirePerson(userId);
    const doc = await this.prisma.document.findFirst({ where: { id, ownerPersonId: personId } });
    if (!doc) throw ApiException.notFound('File not found.');
    await fs.rm(join(env.UPLOAD_DIR, doc.storageKey)).catch(() => undefined);
    await this.prisma.document.delete({ where: { id } });
    return { ok: true as const };
  }

  /** Resolve a stored file for streaming (capability URL by unguessable uuid). */
  async resolve(id: string): Promise<{ absPath: string; mimeType: string | null; fileName: string }> {
    const doc = await this.prisma.document.findUnique({ where: { id } });
    if (!doc) throw ApiException.notFound('File not found.');
    return {
      absPath: resolve(env.UPLOAD_DIR, doc.storageKey),
      mimeType: doc.mimeType,
      fileName: doc.fileName,
    };
  }
}

function toView(d: DbDocument): DocumentView {
  return {
    id: d.id,
    kind: d.kind as DocumentView['kind'],
    fileName: d.fileName,
    mimeType: d.mimeType,
    sizeBytes: d.sizeBytes,
    createdAt: d.createdAt.toISOString(),
  };
}
