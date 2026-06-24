import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { ServiceListingInputSchema } from '@workarmy/validation';
import type { ServiceListingInputData } from '@workarmy/validation';
import type { OkResponse, ServiceCategory, ServiceListing } from '@workarmy/types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { ServicesService } from './services.service';

@Controller('services')
export class ServicesController {
  constructor(private readonly services: ServicesService) {}

  @Get()
  list(
    @CurrentUser() user: { sub: string },
    @Query('category') category?: string,
  ): Promise<ServiceListing[]> {
    return this.services.list(user.sub, category as ServiceCategory | undefined);
  }

  @Post()
  create(
    @CurrentUser() user: { sub: string },
    @Body(new ZodValidationPipe(ServiceListingInputSchema)) dto: ServiceListingInputData,
  ): Promise<ServiceListing> {
    return this.services.create(user.sub, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: { sub: string }, @Param('id') id: string): Promise<OkResponse> {
    return this.services.remove(user.sub, id);
  }
}
