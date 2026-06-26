import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import {
  BusinessCardSchema,
  CredentialInputSchema,
  PaymentMethodSchema,
  RequirementInputSchema,
  SubscribeSchema,
  VerificationRequestSchema,
  type BusinessCardData,
  type CredentialInputData,
  type PaymentMethodData,
  type RequirementInputData,
  type SubscribeData,
  type VerificationRequestData,
} from '@workarmy/validation';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { BusinessService } from './business.service';

@Controller()
export class BusinessController {
  constructor(private readonly business: BusinessService) {}

  @Get('plans')
  plans() {
    return this.business.plans();
  }

  @Get('subscription')
  getSubscription(@CurrentUser() user: { sub: string }) {
    return this.business.getSubscription(user.sub);
  }
  @Post('subscription')
  subscribe(@CurrentUser() user: { sub: string }, @Body(new ZodValidationPipe(SubscribeSchema)) body: SubscribeData) {
    return this.business.subscribe(user.sub, body.planCode);
  }
  @Post('subscription/cancel')
  cancel(@CurrentUser() user: { sub: string }) {
    return this.business.cancel(user.sub);
  }
  @Post('subscription/payment')
  setPayment(@CurrentUser() user: { sub: string }, @Body(new ZodValidationPipe(PaymentMethodSchema)) body: PaymentMethodData) {
    return this.business.setPayment(user.sub, body);
  }
  @Get('member-invoices')
  memberInvoices(@CurrentUser() user: { sub: string }) {
    return this.business.memberInvoices(user.sub);
  }

  @Get('business-card')
  getCard(@CurrentUser() user: { sub: string }) {
    return this.business.getCard(user.sub);
  }
  @Put('business-card')
  updateCard(@CurrentUser() user: { sub: string }, @Body(new ZodValidationPipe(BusinessCardSchema)) body: BusinessCardData) {
    return this.business.updateCard(user.sub, body);
  }

  @Get('requirements')
  listRequirements(@CurrentUser() user: { sub: string }) {
    return this.business.listRequirements(user.sub);
  }
  @Post('requirements')
  createRequirement(@CurrentUser() user: { sub: string }, @Body(new ZodValidationPipe(RequirementInputSchema)) body: RequirementInputData) {
    return this.business.createRequirement(user.sub, body);
  }
  @Post('requirements/:id/close')
  closeRequirement(@CurrentUser() user: { sub: string }, @Param('id') id: string) {
    return this.business.closeRequirement(user.sub, id);
  }
  @Delete('requirements/:id')
  removeRequirement(@CurrentUser() user: { sub: string }, @Param('id') id: string) {
    return this.business.removeRequirement(user.sub, id);
  }

  @Get('org-credentials')
  credentials(@CurrentUser() user: { sub: string }) {
    return this.business.credentials(user.sub);
  }
  @Post('org-credentials')
  addCredential(@CurrentUser() user: { sub: string }, @Body(new ZodValidationPipe(CredentialInputSchema)) body: CredentialInputData) {
    return this.business.addCredential(user.sub, body);
  }
  @Delete('org-credentials/:id')
  removeCredential(@CurrentUser() user: { sub: string }, @Param('id') id: string) {
    return this.business.removeCredential(user.sub, id);
  }
  @Get('org-verifications')
  verifications(@CurrentUser() user: { sub: string }) {
    return this.business.verifications(user.sub);
  }
  @Post('org-verifications')
  requestVerification(@CurrentUser() user: { sub: string }, @Body(new ZodValidationPipe(VerificationRequestSchema)) body: VerificationRequestData) {
    return this.business.requestVerification(user.sub, body.credentialId);
  }
}
