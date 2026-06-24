import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { FeedbackInputSchema, GroupInputSchema } from '@workarmy/validation';
import type { FeedbackInputData, GroupInputData } from '@workarmy/validation';
import type { Feedback, Group, KnowledgeArticle, KnowledgeSummary, OkResponse } from '@workarmy/types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CommunityService } from './community.service';

@Controller()
export class CommunityController {
  constructor(private readonly community: CommunityService) {}

  @Get('knowledge')
  knowledge(@Query('category') category?: string): Promise<KnowledgeSummary[]> {
    return this.community.knowledge(category);
  }

  @Get('knowledge/:slug')
  article(@Param('slug') slug: string): Promise<KnowledgeArticle> {
    return this.community.article(slug);
  }

  @Get('groups')
  groups(@CurrentUser() user: { sub: string }): Promise<Group[]> {
    return this.community.groups(user.sub);
  }

  @Get('groups/me')
  myGroups(@CurrentUser() user: { sub: string }): Promise<Group[]> {
    return this.community.myGroups(user.sub);
  }

  @Post('groups')
  createGroup(
    @CurrentUser() user: { sub: string },
    @Body(new ZodValidationPipe(GroupInputSchema)) dto: GroupInputData,
  ): Promise<Group> {
    return this.community.createGroup(user.sub, dto);
  }

  @Post('groups/:id/join')
  join(@CurrentUser() user: { sub: string }, @Param('id') id: string): Promise<OkResponse> {
    return this.community.join(user.sub, id);
  }

  @Post('groups/:id/leave')
  leave(@CurrentUser() user: { sub: string }, @Param('id') id: string): Promise<OkResponse> {
    return this.community.leave(user.sub, id);
  }

  @Post('feedback')
  submitFeedback(
    @CurrentUser() user: { sub: string },
    @Body(new ZodValidationPipe(FeedbackInputSchema)) dto: FeedbackInputData,
  ): Promise<Feedback> {
    return this.community.submitFeedback(user.sub, dto);
  }

  @Get('feedback/me')
  myFeedback(@CurrentUser() user: { sub: string }): Promise<Feedback[]> {
    return this.community.myFeedback(user.sub);
  }
}
