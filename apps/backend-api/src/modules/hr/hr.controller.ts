import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import {
  LeaveDecisionSchema,
  LeaveInputSchema,
  OnboardingInputSchema,
  OnboardingStatusSchema,
  PerformanceReviewInputSchema,
  WarningInputSchema,
  type LeaveDecisionData,
  type LeaveInputData,
  type OnboardingInputData,
  type OnboardingStatusData,
  type PerformanceReviewInputData,
  type WarningInputData,
} from '@workarmy/validation';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { HrService } from './hr.service';

@Controller('hr')
export class HrController {
  constructor(private readonly hr: HrService) {}

  @Get('overview')
  overview(@CurrentUser() user: { sub: string }) {
    return this.hr.overview(user.sub);
  }

  @Get('leave')
  listLeave(@CurrentUser() user: { sub: string }) {
    return this.hr.listLeave(user.sub);
  }
  @Post('leave')
  createLeave(@CurrentUser() user: { sub: string }, @Body(new ZodValidationPipe(LeaveInputSchema)) body: LeaveInputData) {
    return this.hr.createLeave(user.sub, body);
  }
  @Post('leave/:id/decision')
  decideLeave(
    @CurrentUser() user: { sub: string },
    @Param('id') id: string,
    @Body(new ZodValidationPipe(LeaveDecisionSchema)) body: LeaveDecisionData,
  ) {
    return this.hr.decideLeave(user.sub, id, body.status);
  }

  @Get('reviews')
  listReviews(@CurrentUser() user: { sub: string }) {
    return this.hr.listReviews(user.sub);
  }
  @Post('reviews')
  createReview(
    @CurrentUser() user: { sub: string },
    @Body(new ZodValidationPipe(PerformanceReviewInputSchema)) body: PerformanceReviewInputData,
  ) {
    return this.hr.createReview(user.sub, body);
  }

  @Get('onboarding')
  listOnboarding(@CurrentUser() user: { sub: string }) {
    return this.hr.listOnboarding(user.sub);
  }
  @Post('onboarding')
  createOnboarding(
    @CurrentUser() user: { sub: string },
    @Body(new ZodValidationPipe(OnboardingInputSchema)) body: OnboardingInputData,
  ) {
    return this.hr.createOnboarding(user.sub, body);
  }
  @Post('onboarding/:id/status')
  setOnboardingStatus(
    @CurrentUser() user: { sub: string },
    @Param('id') id: string,
    @Body(new ZodValidationPipe(OnboardingStatusSchema)) body: OnboardingStatusData,
  ) {
    return this.hr.setOnboardingStatus(user.sub, id, body.status);
  }

  @Get('warnings')
  listWarnings(@CurrentUser() user: { sub: string }) {
    return this.hr.listWarnings(user.sub);
  }
  @Post('warnings')
  createWarning(
    @CurrentUser() user: { sub: string },
    @Body(new ZodValidationPipe(WarningInputSchema)) body: WarningInputData,
  ) {
    return this.hr.createWarning(user.sub, body);
  }
}
