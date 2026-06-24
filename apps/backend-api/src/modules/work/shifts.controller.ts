import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { AssignInputSchema, ClockInputSchema, ShiftInputSchema } from '@workarmy/validation';
import type { AssignInputData, ClockInputData, ShiftInputData } from '@workarmy/validation';
import type {
  AssignmentView,
  AttendanceView,
  OkResponse,
  Shift,
  ShiftWithAssignments,
  WorkerShift,
} from '@workarmy/types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { ShiftsService } from './shifts.service';

@Controller('shifts')
export class ShiftsController {
  constructor(private readonly shifts: ShiftsService) {}

  @Get()
  list(@CurrentUser() user: { sub: string }): Promise<ShiftWithAssignments[]> {
    return this.shifts.list(user.sub);
  }

  @Post()
  create(
    @CurrentUser() user: { sub: string },
    @Body(new ZodValidationPipe(ShiftInputSchema)) dto: ShiftInputData,
  ): Promise<Shift> {
    return this.shifts.create(user.sub, dto);
  }

  @Get('me')
  mine(@CurrentUser() user: { sub: string }): Promise<WorkerShift[]> {
    return this.shifts.mine(user.sub);
  }

  @Delete('assignments/:id')
  unassign(@CurrentUser() user: { sub: string }, @Param('id') id: string): Promise<OkResponse> {
    return this.shifts.unassign(user.sub, id);
  }

  @Post('assignments/:id/confirm')
  confirm(@CurrentUser() user: { sub: string }, @Param('id') id: string): Promise<OkResponse> {
    return this.shifts.confirm(user.sub, id);
  }

  @Post('assignments/:id/clock-in')
  clockIn(
    @CurrentUser() user: { sub: string },
    @Param('id') id: string,
    @Body(new ZodValidationPipe(ClockInputSchema)) dto: ClockInputData,
  ): Promise<AttendanceView> {
    return this.shifts.clockIn(user.sub, id, dto);
  }

  @Post('assignments/:id/clock-out')
  clockOut(
    @CurrentUser() user: { sub: string },
    @Param('id') id: string,
    @Body(new ZodValidationPipe(ClockInputSchema)) dto: ClockInputData,
  ): Promise<AttendanceView> {
    return this.shifts.clockOut(user.sub, id, dto);
  }

  @Post('assignments/:id/swap')
  swap(@CurrentUser() user: { sub: string }, @Param('id') id: string): Promise<OkResponse> {
    return this.shifts.requestSwap(user.sub, id);
  }

  @Post(':id/cancel')
  cancel(@CurrentUser() user: { sub: string }, @Param('id') id: string): Promise<Shift> {
    return this.shifts.cancel(user.sub, id);
  }

  @Post(':id/assign')
  assign(
    @CurrentUser() user: { sub: string },
    @Param('id') id: string,
    @Body(new ZodValidationPipe(AssignInputSchema)) dto: AssignInputData,
  ): Promise<AssignmentView> {
    return this.shifts.assign(user.sub, id, dto.waId);
  }
}
