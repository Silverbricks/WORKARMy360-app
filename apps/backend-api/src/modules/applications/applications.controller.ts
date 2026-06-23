import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApplyInputSchema, StageChangeSchema } from '@workarmy/validation';
import type {
  Applicant,
  ApplicationEvent,
  ApplyInput,
  JobApplication,
  MyApplication,
  StageChangeInput,
} from '@workarmy/types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { ApplicationsService } from './applications.service';

@Controller()
export class ApplicationsController {
  constructor(private readonly applications: ApplicationsService) {}

  @Post('jobs/:id/apply')
  apply(
    @CurrentUser() user: { sub: string },
    @Param('id') jobId: string,
    @Body(new ZodValidationPipe(ApplyInputSchema)) dto: ApplyInput,
  ): Promise<JobApplication> {
    return this.applications.apply(user.sub, jobId, dto);
  }

  @Get('jobs/:id/applications')
  forJob(@CurrentUser() user: { sub: string }, @Param('id') jobId: string): Promise<Applicant[]> {
    return this.applications.forJob(user.sub, jobId);
  }

  @Get('applications/me')
  mine(@CurrentUser() user: { sub: string }): Promise<MyApplication[]> {
    return this.applications.mine(user.sub);
  }

  @Patch('applications/:id/stage')
  changeStage(
    @CurrentUser() user: { sub: string },
    @Param('id') id: string,
    @Body(new ZodValidationPipe(StageChangeSchema)) dto: StageChangeInput,
  ): Promise<JobApplication> {
    return this.applications.changeStage(user.sub, id, dto);
  }

  @Get('applications/:id/events')
  events(@CurrentUser() user: { sub: string }, @Param('id') id: string): Promise<ApplicationEvent[]> {
    return this.applications.events(user.sub, id);
  }
}
