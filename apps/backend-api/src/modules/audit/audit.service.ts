import { Injectable, Logger } from '@nestjs/common';
import type { AuditAction, Prisma } from '@workarmy/database';
import { PrismaService } from '../../prisma/prisma.service';

interface AuditOptions {
  userId?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  metadata?: Prisma.InputJsonValue;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger('Audit');

  constructor(private readonly prisma: PrismaService) {}

  /** Best-effort audit write — never throws into the request path. */
  async record(action: AuditAction, opts: AuditOptions = {}): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          action,
          userId: opts.userId ?? null,
          ipAddress: opts.ip ?? null,
          userAgent: opts.userAgent ?? null,
          metadata: opts.metadata,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to write audit log (${action}): ${String(error)}`);
    }
  }
}
