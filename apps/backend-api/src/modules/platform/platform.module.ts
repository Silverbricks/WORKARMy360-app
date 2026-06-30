import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { ConfigService } from './config.service';

/** Company Builder config substrate (Module Marketplace, templates, resolved config). */
@Module({
  imports: [AuditModule],
  providers: [ConfigService],
  exports: [ConfigService],
})
export class PlatformModule {}
