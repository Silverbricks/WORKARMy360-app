import { Controller, Get } from '@nestjs/common';
import type { DashboardSummary } from '@workarmy/types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get('summary')
  summary(@CurrentUser() user: { sub: string }): Promise<DashboardSummary> {
    return this.dashboard.summary(user.sub);
  }
}
