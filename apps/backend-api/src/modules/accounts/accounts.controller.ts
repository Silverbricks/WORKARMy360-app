import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import {
  BusinessDocInputSchema,
  PayRunInputSchema,
  PieceRateInputSchema,
  type BusinessDocInputData,
  type PayRunInputData,
  type PieceRateInputData,
} from '@workarmy/validation';
import { z } from 'zod';
import type { BusinessDocStatus, PayRunStatus } from '@workarmy/types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { AccountsService } from './accounts.service';

const PayRunStatusSchema = z.object({ status: z.enum(['DRAFT', 'FINALISED', 'PAID']) });
const DocStatusSchema = z.object({ status: z.enum(['DRAFT', 'SENT', 'ACCEPTED', 'PAID', 'DECLINED', 'VOID']) });

@Controller()
export class AccountsController {
  constructor(private readonly accounts: AccountsService) {}

  @Get('pay-runs')
  listPayRuns(@CurrentUser() user: { sub: string }) {
    return this.accounts.listPayRuns(user.sub);
  }
  @Post('pay-runs')
  buildPayRun(@CurrentUser() user: { sub: string }, @Body(new ZodValidationPipe(PayRunInputSchema)) body: PayRunInputData) {
    return this.accounts.buildPayRun(user.sub, body);
  }
  @Post('pay-runs/:id/status')
  setPayRunStatus(
    @CurrentUser() user: { sub: string },
    @Param('id') id: string,
    @Body(new ZodValidationPipe(PayRunStatusSchema)) body: { status: PayRunStatus },
  ) {
    return this.accounts.setPayRunStatus(user.sub, id, body.status);
  }

  @Get('business-docs')
  listDocs(@CurrentUser() user: { sub: string }) {
    return this.accounts.listDocs(user.sub);
  }
  @Post('business-docs')
  createDoc(@CurrentUser() user: { sub: string }, @Body(new ZodValidationPipe(BusinessDocInputSchema)) body: BusinessDocInputData) {
    return this.accounts.createDoc(user.sub, body);
  }
  @Post('business-docs/:id/status')
  setDocStatus(
    @CurrentUser() user: { sub: string },
    @Param('id') id: string,
    @Body(new ZodValidationPipe(DocStatusSchema)) body: { status: BusinessDocStatus },
  ) {
    return this.accounts.setDocStatus(user.sub, id, body.status);
  }
  @Delete('business-docs/:id')
  removeDoc(@CurrentUser() user: { sub: string }, @Param('id') id: string) {
    return this.accounts.removeDoc(user.sub, id);
  }

  @Get('piece-rates')
  listPieceRates(@CurrentUser() user: { sub: string }) {
    return this.accounts.listPieceRates(user.sub);
  }
  @Post('piece-rates')
  createPieceRate(@CurrentUser() user: { sub: string }, @Body(new ZodValidationPipe(PieceRateInputSchema)) body: PieceRateInputData) {
    return this.accounts.createPieceRate(user.sub, body);
  }
  @Delete('piece-rates/:id')
  removePieceRate(@CurrentUser() user: { sub: string }, @Param('id') id: string) {
    return this.accounts.removePieceRate(user.sub, id);
  }
}
