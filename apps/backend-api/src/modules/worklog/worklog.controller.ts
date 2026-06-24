import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { WorkLogInputSchema } from '@workarmy/validation';
import type { WorkLogInputData } from '@workarmy/validation';
import type { OkResponse, WorkLog } from '@workarmy/types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { WorkLogService } from './worklog.service';

@Controller('worklog')
export class WorkLogController {
  constructor(private readonly worklog: WorkLogService) {}

  @Get()
  list(@CurrentUser() user: { sub: string }): Promise<WorkLog[]> {
    return this.worklog.list(user.sub);
  }

  @Post()
  create(
    @CurrentUser() user: { sub: string },
    @Body(new ZodValidationPipe(WorkLogInputSchema)) dto: WorkLogInputData,
  ): Promise<WorkLog> {
    return this.worklog.create(user.sub, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: { sub: string }, @Param('id') id: string): Promise<OkResponse> {
    return this.worklog.remove(user.sub, id);
  }
}
