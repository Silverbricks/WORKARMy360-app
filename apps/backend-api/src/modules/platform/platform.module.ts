import { Module } from '@nestjs/common';
import { ConfigService } from './config.service';

/** Company Builder config substrate (Module Marketplace, templates, resolved config). */
@Module({
  providers: [ConfigService],
  exports: [ConfigService],
})
export class PlatformModule {}
