import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { CredentialInputSchema, VerificationRequestSchema } from '@workarmy/validation';
import type { CredentialView, OkResponse, VerificationView } from '@workarmy/types';
import type { CredentialInputData, VerificationRequestData } from '@workarmy/validation';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CredentialsService } from './credentials.service';

@Controller('persons')
export class CredentialsController {
  constructor(private readonly credentials: CredentialsService) {}

  @Get('me/credentials')
  list(@CurrentUser() user: { sub: string }): Promise<CredentialView[]> {
    return this.credentials.list(user.sub);
  }

  @Post('me/credentials')
  add(
    @CurrentUser() user: { sub: string },
    @Body(new ZodValidationPipe(CredentialInputSchema)) dto: CredentialInputData,
  ): Promise<CredentialView> {
    return this.credentials.add(user.sub, dto);
  }

  @Delete('me/credentials/:id')
  remove(@CurrentUser() user: { sub: string }, @Param('id') id: string): Promise<OkResponse> {
    return this.credentials.remove(user.sub, id);
  }

  @Get('me/verifications')
  verifications(@CurrentUser() user: { sub: string }): Promise<VerificationView[]> {
    return this.credentials.verifications(user.sub);
  }

  @Post('me/verifications')
  requestVerification(
    @CurrentUser() user: { sub: string },
    @Body(new ZodValidationPipe(VerificationRequestSchema)) dto: VerificationRequestData,
  ): Promise<VerificationView> {
    return this.credentials.requestVerification(user.sub, dto.credentialId);
  }
}
