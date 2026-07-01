import { Module } from '@nestjs/common';
import { PlatformModule } from '../platform/platform.module';
import { PlannerController } from './planner.controller';
import { PlannerService } from './planner.service';
import { PlannerConflictService } from './planner-conflict.service';
import { WeatherService } from './weather.service';

@Module({
  imports: [PlatformModule],
  controllers: [PlannerController],
  providers: [PlannerService, PlannerConflictService, WeatherService],
})
export class PlannerModule {}
