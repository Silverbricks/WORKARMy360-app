import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { InvoiceInputSchema } from '@workarmy/validation';
import type { Invoice, OkResponse } from '@workarmy/types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { InvoicesService } from './invoices.service';
import type { InvoiceInputData } from './invoices.types';

@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoices: InvoicesService) {}

  @Get()
  list(@CurrentUser() user: { sub: string }): Promise<Invoice[]> {
    return this.invoices.list(user.sub);
  }

  @Post()
  create(
    @CurrentUser() user: { sub: string },
    @Body(new ZodValidationPipe(InvoiceInputSchema)) dto: InvoiceInputData,
  ): Promise<Invoice> {
    return this.invoices.create(user.sub, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: { sub: string }, @Param('id') id: string): Promise<OkResponse> {
    return this.invoices.remove(user.sub, id);
  }

  @Post(':id/paid')
  markPaid(@CurrentUser() user: { sub: string }, @Param('id') id: string): Promise<Invoice> {
    return this.invoices.markPaid(user.sub, id);
  }
}
