import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { WorkReadinessModule } from '../work-readiness/work-readiness.module';
import { ApplicationsController } from './applications.controller';
import { ApplicationsService } from './applications.service';

@Module({
  imports: [AuditModule, WorkReadinessModule],
  controllers: [ApplicationsController],
  providers: [ApplicationsService],
})
export class ApplicationsModule {}
