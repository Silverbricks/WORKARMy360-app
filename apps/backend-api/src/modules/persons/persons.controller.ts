import { Body, Controller, Delete, Get, Param, Patch, Post, Put } from '@nestjs/common';
import { PersonProfileUpdateSchema, WorkExperienceInputSchema } from '@workarmy/validation';
import type { OkResponse, PersonDetail, PersonProfile, WorkExperience } from '@workarmy/types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { PersonsService } from './persons.service';
import type { PersonProfileUpdateInput, WorkExperienceInputData } from './persons.types';

@Controller('persons')
export class PersonsController {
  constructor(private readonly persons: PersonsService) {}

  @Get('me')
  getMe(@CurrentUser() user: { sub: string }): Promise<PersonDetail> {
    return this.persons.getMe(user.sub);
  }

  @Put('me/profile')
  updateProfile(
    @CurrentUser() user: { sub: string },
    @Body(new ZodValidationPipe(PersonProfileUpdateSchema)) dto: PersonProfileUpdateInput,
  ): Promise<PersonProfile> {
    return this.persons.updateProfile(user.sub, dto);
  }

  @Post('me/experience')
  addExperience(
    @CurrentUser() user: { sub: string },
    @Body(new ZodValidationPipe(WorkExperienceInputSchema)) dto: WorkExperienceInputData,
  ): Promise<WorkExperience> {
    return this.persons.addExperience(user.sub, dto);
  }

  @Patch('me/experience/:id')
  updateExperience(
    @CurrentUser() user: { sub: string },
    @Param('id') id: string,
    @Body(new ZodValidationPipe(WorkExperienceInputSchema.partial())) dto: Partial<WorkExperienceInputData>,
  ): Promise<WorkExperience> {
    return this.persons.updateExperience(user.sub, id, dto);
  }

  @Delete('me/experience/:id')
  deleteExperience(@CurrentUser() user: { sub: string }, @Param('id') id: string): Promise<OkResponse> {
    return this.persons.deleteExperience(user.sub, id);
  }
}
