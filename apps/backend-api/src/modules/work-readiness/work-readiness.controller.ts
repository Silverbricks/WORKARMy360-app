import { Body, Controller, Get, Post, Put } from '@nestjs/common';
import {
  TaxLodgementInputSchema,
  TaxShareInputSchema,
  WorkReadinessUpdateSchema,
} from '@workarmy/validation';
import type { TaxLodgement, TaxShare, WorkReadiness } from '@workarmy/types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { WorkReadinessService } from './work-readiness.service';
import type {
  TaxLodgementInputData,
  TaxShareInputData,
  WorkReadinessUpdateData,
} from './work-readiness.types';

@Controller('work-readiness')
export class WorkReadinessController {
  constructor(private readonly workReadiness: WorkReadinessService) {}

  @Get()
  get(@CurrentUser() user: { sub: string }): Promise<WorkReadiness> {
    return this.workReadiness.get(user.sub);
  }

  @Put()
  update(
    @CurrentUser() user: { sub: string },
    @Body(new ZodValidationPipe(WorkReadinessUpdateSchema)) dto: WorkReadinessUpdateData,
  ): Promise<WorkReadiness> {
    return this.workReadiness.update(user.sub, dto);
  }

  @Get('lodgements')
  listLodgements(@CurrentUser() user: { sub: string }): Promise<TaxLodgement[]> {
    return this.workReadiness.listLodgements(user.sub);
  }

  @Post('lodgements')
  addLodgement(
    @CurrentUser() user: { sub: string },
    @Body(new ZodValidationPipe(TaxLodgementInputSchema)) dto: TaxLodgementInputData,
  ): Promise<TaxLodgement> {
    return this.workReadiness.addLodgement(user.sub, dto);
  }

  @Get('shares')
  listShares(@CurrentUser() user: { sub: string }): Promise<TaxShare[]> {
    return this.workReadiness.listShares(user.sub);
  }

  @Post('shares')
  addShare(
    @CurrentUser() user: { sub: string },
    @Body(new ZodValidationPipe(TaxShareInputSchema)) dto: TaxShareInputData,
  ): Promise<TaxShare> {
    return this.workReadiness.addShare(user.sub, dto);
  }
}
