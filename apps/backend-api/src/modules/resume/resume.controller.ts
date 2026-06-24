import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { ResumeShareSchema, ResumeUpdateSchema } from '@workarmy/validation';
import type { PublicResume, ResumeView } from '@workarmy/types';
import type { ResumeUpdateData } from '@workarmy/validation';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { ResumeService } from './resume.service';

@Controller()
export class ResumeController {
  constructor(private readonly resume: ResumeService) {}

  @Get('persons/me/resume')
  getMe(@CurrentUser() user: { sub: string }): Promise<ResumeView> {
    return this.resume.getMe(user.sub);
  }

  @Put('persons/me/resume')
  update(
    @CurrentUser() user: { sub: string },
    @Body(new ZodValidationPipe(ResumeUpdateSchema)) dto: ResumeUpdateData,
  ): Promise<ResumeView> {
    return this.resume.update(user.sub, dto);
  }

  @Post('persons/me/resume/share')
  setShare(
    @CurrentUser() user: { sub: string },
    @Body(new ZodValidationPipe(ResumeShareSchema)) dto: { isPublic: boolean },
  ): Promise<ResumeView> {
    return this.resume.setShare(user.sub, dto.isPublic);
  }

  @Public()
  @Get('public/resume/:token')
  publicResume(@Param('token') token: string): Promise<PublicResume> {
    return this.resume.publicByToken(token);
  }
}
