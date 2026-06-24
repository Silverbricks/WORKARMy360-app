import { Module } from '@nestjs/common';
import { WorkReadinessModule } from '../work-readiness/work-readiness.module';
import { ShiftsController } from './shifts.controller';
import { ShiftsService } from './shifts.service';
import { TimesheetsController } from './timesheets.controller';
import { TimesheetsService } from './timesheets.service';
import { PayslipsController } from './payslips.controller';
import { PayslipsService } from './payslips.service';

@Module({
  imports: [WorkReadinessModule],
  controllers: [ShiftsController, TimesheetsController, PayslipsController],
  providers: [ShiftsService, TimesheetsService, PayslipsService],
})
export class WorkModule {}
