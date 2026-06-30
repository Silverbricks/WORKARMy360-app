import { Module } from '@nestjs/common';
import { PlatformModule } from '../platform/platform.module';
import { PlannerController } from './planner.controller';

@Module({
  imports: [PlatformModule],
  controllers: [PlannerController],
})
export class PlannerModule {}
