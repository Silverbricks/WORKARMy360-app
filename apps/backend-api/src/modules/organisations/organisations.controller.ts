import { Body, Controller, Delete, Get, Param, Patch, Post, Put } from '@nestjs/common';
import { ContactInputSchema, OrgProfileUpdateSchema } from '@workarmy/validation';
import type { Contact, OkResponse, OrganisationDetail, OrgProfile } from '@workarmy/types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { OrganisationsService } from './organisations.service';
import type { ContactInputData, OrgProfileUpdateInput } from './organisations.types';

@Controller('organisations')
export class OrganisationsController {
  constructor(private readonly organisations: OrganisationsService) {}

  @Get('me')
  getMe(@CurrentUser() user: { sub: string }): Promise<OrganisationDetail> {
    return this.organisations.getMe(user.sub);
  }

  @Put('me/profile')
  updateProfile(
    @CurrentUser() user: { sub: string },
    @Body(new ZodValidationPipe(OrgProfileUpdateSchema)) dto: OrgProfileUpdateInput,
  ): Promise<OrgProfile> {
    return this.organisations.updateProfile(user.sub, dto);
  }

  @Post('me/contacts')
  addContact(
    @CurrentUser() user: { sub: string },
    @Body(new ZodValidationPipe(ContactInputSchema)) dto: ContactInputData,
  ): Promise<Contact> {
    return this.organisations.addContact(user.sub, dto);
  }

  @Patch('me/contacts/:id')
  updateContact(
    @CurrentUser() user: { sub: string },
    @Param('id') id: string,
    @Body(new ZodValidationPipe(ContactInputSchema.partial())) dto: Partial<ContactInputData>,
  ): Promise<Contact> {
    return this.organisations.updateContact(user.sub, id, dto);
  }

  @Delete('me/contacts/:id')
  deleteContact(@CurrentUser() user: { sub: string }, @Param('id') id: string): Promise<OkResponse> {
    return this.organisations.deleteContact(user.sub, id);
  }
}
