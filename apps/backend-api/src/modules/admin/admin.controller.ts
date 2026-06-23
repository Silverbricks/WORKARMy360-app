import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ReviewSchema } from '@workarmy/validation';
import type {
  AdminStats,
  MemberDirectoryItem,
  ModerationJob,
  OkResponse,
  Paginated,
  ReviewInput,
  VerificationItem,
  VerificationStatus,
} from '@workarmy/types';
import { AdminGuard } from '../../common/guards/admin.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { AdminService } from './admin.service';

@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('stats')
  stats(): Promise<AdminStats> {
    return this.admin.stats();
  }

  @Get('members')
  members(
    @Query('q') q = '',
    @Query('page') page = '1',
  ): Promise<Paginated<MemberDirectoryItem>> {
    return this.admin.members(q, Number(page) || 1);
  }

  @Get('verifications')
  verifications(@Query('status') status = 'PENDING'): Promise<VerificationItem[]> {
    return this.admin.verifications(status as VerificationStatus);
  }

  @Post('verifications/:id/approve')
  approve(
    @CurrentUser() user: { sub: string },
    @Param('id') id: string,
    @Body(new ZodValidationPipe(ReviewSchema)) dto: ReviewInput,
  ): Promise<OkResponse> {
    return this.admin.review(user.sub, id, 'APPROVED', dto.note);
  }

  @Post('verifications/:id/reject')
  reject(
    @CurrentUser() user: { sub: string },
    @Param('id') id: string,
    @Body(new ZodValidationPipe(ReviewSchema)) dto: ReviewInput,
  ): Promise<OkResponse> {
    return this.admin.review(user.sub, id, 'REJECTED', dto.note);
  }

  @Get('jobs')
  jobs(@Query('status') status = ''): Promise<ModerationJob[]> {
    return this.admin.jobs(status);
  }

  @Post('jobs/:id/close')
  closeJob(@CurrentUser() user: { sub: string }, @Param('id') id: string): Promise<OkResponse> {
    return this.admin.closeJob(user.sub, id);
  }
}
