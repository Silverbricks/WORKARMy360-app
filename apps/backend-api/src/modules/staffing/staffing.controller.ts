import { Body, Controller, Get, Post } from '@nestjs/common';
import {
  DispatchInputSchema,
  StaffRequestInputSchema,
  type DispatchInputData,
  type StaffRequestInputData,
} from '@workarmy/validation';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { StaffingService } from './staffing.service';

@Controller()
export class StaffingController {
  constructor(private readonly staffing: StaffingService) {}

  @Get('staff-requests')
  listRequests(@CurrentUser() user: { sub: string }) {
    return this.staffing.listRequests(user.sub);
  }

  @Post('staff-requests')
  createRequest(
    @CurrentUser() user: { sub: string },
    @Body(new ZodValidationPipe(StaffRequestInputSchema)) body: StaffRequestInputData,
  ) {
    return this.staffing.createRequest(user.sub, body);
  }

  @Get('dispatches')
  listDispatches(@CurrentUser() user: { sub: string }) {
    return this.staffing.listDispatches(user.sub);
  }

  @Post('dispatches')
  createDispatch(
    @CurrentUser() user: { sub: string },
    @Body(new ZodValidationPipe(DispatchInputSchema)) body: DispatchInputData,
  ) {
    return this.staffing.createDispatch(user.sub, body);
  }
}
