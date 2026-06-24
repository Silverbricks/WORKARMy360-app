import { Body, Controller, Get, Post } from '@nestjs/common';
import { SupportTicketInputSchema } from '@workarmy/validation';
import type { SupportTicketInputData } from '@workarmy/validation';
import type { SupportTicket } from '@workarmy/types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { SupportService } from './support.service';

@Controller('support')
export class SupportController {
  constructor(private readonly support: SupportService) {}

  @Get('tickets')
  list(@CurrentUser() user: { sub: string }): Promise<SupportTicket[]> {
    return this.support.list(user.sub);
  }

  @Post('tickets')
  create(
    @CurrentUser() user: { sub: string },
    @Body(new ZodValidationPipe(SupportTicketInputSchema)) dto: SupportTicketInputData,
  ): Promise<SupportTicket> {
    return this.support.create(user.sub, dto);
  }
}
