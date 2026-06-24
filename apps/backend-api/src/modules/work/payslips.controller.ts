import { Body, Controller, Get, Post } from '@nestjs/common';
import { PayslipInputSchema } from '@workarmy/validation';
import type { PayslipInputData } from '@workarmy/validation';
import type { Payslip } from '@workarmy/types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { PayslipsService } from './payslips.service';

@Controller('payslips')
export class PayslipsController {
  constructor(private readonly payslips: PayslipsService) {}

  @Get('me')
  mine(@CurrentUser() user: { sub: string }): Promise<Payslip[]> {
    return this.payslips.mine(user.sub);
  }

  @Get()
  forOrg(@CurrentUser() user: { sub: string }): Promise<Payslip[]> {
    return this.payslips.forOrg(user.sub);
  }

  @Post()
  issue(
    @CurrentUser() user: { sub: string },
    @Body(new ZodValidationPipe(PayslipInputSchema)) dto: PayslipInputData,
  ): Promise<Payslip> {
    return this.payslips.issue(user.sub, dto);
  }
}
