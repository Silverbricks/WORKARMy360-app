import { Module } from '@nestjs/common';
import { WorkReadinessController } from './work-readiness.controller';
import { WorkReadinessService } from './work-readiness.service';

@Module({
  controllers: [WorkReadinessController],
  providers: [WorkReadinessService],
  exports: [WorkReadinessService],
})
export class WorkReadinessModule {}
