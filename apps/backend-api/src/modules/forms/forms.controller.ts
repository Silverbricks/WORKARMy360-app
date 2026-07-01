import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import {
  FormInputSchema,
  FormSubmissionInputSchema,
  type FormInputData,
  type FormSubmissionInputData,
} from '@workarmy/validation';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { FormsService } from './forms.service';

@Controller()
export class FormsController {
  constructor(private readonly forms: FormsService) {}

  @Get('forms')
  list(@CurrentUser() user: { sub: string }) {
    return this.forms.list(user.sub);
  }

  @Post('forms')
  create(@CurrentUser() user: { sub: string }, @Body(new ZodValidationPipe(FormInputSchema)) body: FormInputData) {
    return this.forms.create(user.sub, body);
  }

  @Patch('forms/:id')
  update(
    @CurrentUser() user: { sub: string },
    @Param('id') id: string,
    @Body(new ZodValidationPipe(FormInputSchema)) body: FormInputData,
  ) {
    return this.forms.update(user.sub, id, body);
  }

  @Post('forms/:id/publish')
  publish(@CurrentUser() user: { sub: string }, @Param('id') id: string) {
    return this.forms.publish(user.sub, id);
  }

  @Delete('forms/:id')
  remove(@CurrentUser() user: { sub: string }, @Param('id') id: string) {
    return this.forms.remove(user.sub, id);
  }

  @Get('forms/:id/submissions')
  submissions(@CurrentUser() user: { sub: string }, @Param('id') id: string) {
    return this.forms.listSubmissions(user.sub, id);
  }

  @Post('forms/:id/submissions')
  submit(
    @CurrentUser() user: { sub: string },
    @Param('id') id: string,
    @Body(new ZodValidationPipe(FormSubmissionInputSchema)) body: FormSubmissionInputData,
  ) {
    return this.forms.submit(user.sub, id, body);
  }
}
