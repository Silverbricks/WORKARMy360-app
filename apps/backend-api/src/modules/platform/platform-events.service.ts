import { Injectable } from '@nestjs/common';
import type { AuditAction, Prisma } from '@workarmy/database';
import { AuditService } from '../audit/audit.service';

/**
 * Event seam. v1 just records an audit entry; this is where the future
 * Notification Builder, webhooks (API Builder) and analytics fan out from a
 * single emit(). Keeping publish/cascade flows calling emit() now means those
 * builders attach later without touching the planner.
 */
@Injectable()
export class PlatformEventsService {
  constructor(private readonly audit: AuditService) {}

  async emit(action: AuditAction, userId: string | null, metadata: Prisma.InputJsonValue): Promise<void> {
    await this.audit.record(action, { userId, metadata });
  }
}
