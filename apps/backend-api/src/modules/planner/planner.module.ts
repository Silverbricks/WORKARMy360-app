import { Module } from '@nestjs/common';
import { PlatformModule } from '../platform/platform.module';
import { PlannerController } from './planner.controller';
import { PlannerService } from './planner.service';

@Module({
  imports: [PlatformModule],
  controllers: [PlannerController],
  providers: [PlannerService],
})
export class PlannerModule {}
