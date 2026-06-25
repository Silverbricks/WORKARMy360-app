import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import {
  ProviderEngagementInputSchema,
  QuoteRequestInputSchema,
  type ProviderEngagementInputData,
  type QuoteRequestInputData,
} from '@workarmy/validation';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { NetworkService } from './network.service';

@Controller()
export class NetworkController {
  constructor(private readonly network: NetworkService) {}

  @Get('provider-directory')
  directory(@CurrentUser() user: { sub: string }) {
    return this.network.directory(user.sub);
  }

  @Get('provider-engagements')
  listEngagements(@CurrentUser() user: { sub: string }) {
    return this.network.listEngagements(user.sub);
  }
  @Post('provider-engagements')
  createEngagement(
    @CurrentUser() user: { sub: string },
    @Body(new ZodValidationPipe(ProviderEngagementInputSchema)) body: ProviderEngagementInputData,
  ) {
    return this.network.createEngagement(user.sub, body);
  }
  @Post('provider-engagements/:id/toggle')
  toggleEngagement(@CurrentUser() user: { sub: string }, @Param('id') id: string) {
    return this.network.toggleEngagement(user.sub, id);
  }
  @Delete('provider-engagements/:id')
  removeEngagement(@CurrentUser() user: { sub: string }, @Param('id') id: string) {
    return this.network.removeEngagement(user.sub, id);
  }

  @Get('quote-requests')
  listQuotes(@CurrentUser() user: { sub: string }) {
    return this.network.listQuotes(user.sub);
  }
  @Post('quote-requests')
  createQuote(
    @CurrentUser() user: { sub: string },
    @Body(new ZodValidationPipe(QuoteRequestInputSchema)) body: QuoteRequestInputData,
  ) {
    return this.network.createQuote(user.sub, body);
  }

  @Get('reports')
  reports(@CurrentUser() user: { sub: string }) {
    return this.network.reports(user.sub);
  }
}
