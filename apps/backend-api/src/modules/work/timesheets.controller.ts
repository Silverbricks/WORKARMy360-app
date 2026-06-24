import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import type { OkResponse, TimesheetStatus, TimesheetView } from '@workarmy/types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TimesheetsService } from './timesheets.service';

@Controller('timesheets')
export class TimesheetsController {
  constructor(private readonly timesheets: TimesheetsService) {}

  @Get('me')
  mine(@CurrentUser() user: { sub: string }): Promise<TimesheetView[]> {
    return this.timesheets.mine(user.sub);
  }

  @Post('generate')
  generate(@CurrentUser() user: { sub: string }): Promise<TimesheetView> {
    return this.timesheets.generate(user.sub);
  }

  @Get()
  forOrg(
    @CurrentUser() user: { sub: string },
    @Query('status') status?: string,
  ): Promise<TimesheetView[]> {
    return this.timesheets.forOrg(user.sub, status as TimesheetStatus | undefined);
  }

  @Post(':id/approve')
  approve(@CurrentUser() user: { sub: string }, @Param('id') id: string): Promise<OkResponse> {
    return this.timesheets.setStatus(user.sub, id, 'APPROVED');
  }

  @Post(':id/reject')
  reject(@CurrentUser() user: { sub: string }, @Param('id') id: string): Promise<OkResponse> {
    return this.timesheets.setStatus(user.sub, id, 'REJECTED');
  }
}
