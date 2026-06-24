import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { JobBrowseQuerySchema, JobInputSchema } from '@workarmy/validation';
import type { Job, JobListing, OkResponse, Paginated } from '@workarmy/types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { JobsService } from './jobs.service';
import type { JobBrowseQueryData, JobInputData } from './jobs.types';

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobs: JobsService) {}

  @Get()
  browse(
    @CurrentUser() user: { sub: string },
    @Query(new ZodValidationPipe(JobBrowseQuerySchema)) query: JobBrowseQueryData,
  ): Promise<Paginated<JobListing>> {
    return this.jobs.browse(user.sub, query);
  }

  @Get('me')
  mine(@CurrentUser() user: { sub: string }): Promise<Job[]> {
    return this.jobs.mine(user.sub);
  }

  // Declared before ':id' so "saved" isn't captured as a job id.
  @Get('saved')
  saved(@CurrentUser() user: { sub: string }): Promise<JobListing[]> {
    return this.jobs.saved(user.sub);
  }

  @Get(':id')
  get(@Param('id') id: string): Promise<JobListing> {
    return this.jobs.get(id);
  }

  @Post(':id/save')
  save(@CurrentUser() user: { sub: string }, @Param('id') id: string): Promise<OkResponse> {
    return this.jobs.save(user.sub, id);
  }

  @Delete(':id/save')
  unsave(@CurrentUser() user: { sub: string }, @Param('id') id: string): Promise<OkResponse> {
    return this.jobs.unsave(user.sub, id);
  }

  @Post()
  create(
    @CurrentUser() user: { sub: string },
    @Body(new ZodValidationPipe(JobInputSchema)) dto: JobInputData,
  ): Promise<Job> {
    return this.jobs.create(user.sub, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: { sub: string },
    @Param('id') id: string,
    @Body(new ZodValidationPipe(JobInputSchema)) dto: JobInputData,
  ): Promise<Job> {
    return this.jobs.update(user.sub, id, dto);
  }

  @Post(':id/publish')
  publish(@CurrentUser() user: { sub: string }, @Param('id') id: string): Promise<Job> {
    return this.jobs.publish(user.sub, id);
  }

  @Post(':id/close')
  close(@CurrentUser() user: { sub: string }, @Param('id') id: string): Promise<Job> {
    return this.jobs.close(user.sub, id);
  }
}
