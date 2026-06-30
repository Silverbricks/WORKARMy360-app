import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { ConfigService } from './config.service';
import { PlatformEventsService } from './platform-events.service';

/** Company Builder config substrate (Module Marketplace, templates, resolved config) + event seam. */
@Module({
  imports: [AuditModule],
  providers: [ConfigService, PlatformEventsService],
  exports: [ConfigService, PlatformEventsService],
})
export class PlatformModule {}
