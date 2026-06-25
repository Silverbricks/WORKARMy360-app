import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import {
  QrInputSchema,
  SiteInputSchema,
  TaskInputSchema,
  TaskStatusSchema,
  VisitorInputSchema,
  type QrInputData,
  type SiteInputData,
  type TaskInputData,
  type TaskStatusData,
  type VisitorInputData,
} from '@workarmy/validation';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { OperationsService } from './operations.service';

@Controller()
export class OperationsController {
  constructor(private readonly ops: OperationsService) {}

  @Get('sites')
  listSites(@CurrentUser() user: { sub: string }) {
    return this.ops.listSites(user.sub);
  }
  @Post('sites')
  createSite(@CurrentUser() user: { sub: string }, @Body(new ZodValidationPipe(SiteInputSchema)) body: SiteInputData) {
    return this.ops.createSite(user.sub, body);
  }
  @Delete('sites/:id')
  removeSite(@CurrentUser() user: { sub: string }, @Param('id') id: string) {
    return this.ops.removeSite(user.sub, id);
  }

  @Get('tasks')
  listTasks(@CurrentUser() user: { sub: string }) {
    return this.ops.listTasks(user.sub);
  }
  @Post('tasks')
  createTask(@CurrentUser() user: { sub: string }, @Body(new ZodValidationPipe(TaskInputSchema)) body: TaskInputData) {
    return this.ops.createTask(user.sub, body);
  }
  @Post('tasks/:id/status')
  setTaskStatus(
    @CurrentUser() user: { sub: string },
    @Param('id') id: string,
    @Body(new ZodValidationPipe(TaskStatusSchema)) body: TaskStatusData,
  ) {
    return this.ops.setTaskStatus(user.sub, id, body.status);
  }

  @Get('qr-codes')
  listQr(@CurrentUser() user: { sub: string }) {
    return this.ops.listQr(user.sub);
  }
  @Post('qr-codes')
  createQr(@CurrentUser() user: { sub: string }, @Body(new ZodValidationPipe(QrInputSchema)) body: QrInputData) {
    return this.ops.createQr(user.sub, body);
  }

  @Get('visitors')
  listVisitors(@CurrentUser() user: { sub: string }) {
    return this.ops.listVisitors(user.sub);
  }
  @Post('visitors')
  checkIn(@CurrentUser() user: { sub: string }, @Body(new ZodValidationPipe(VisitorInputSchema)) body: VisitorInputData) {
    return this.ops.checkInVisitor(user.sub, body);
  }
  @Post('visitors/:id/checkout')
  checkOut(@CurrentUser() user: { sub: string }, @Param('id') id: string) {
    return this.ops.checkOutVisitor(user.sub, id);
  }
}
