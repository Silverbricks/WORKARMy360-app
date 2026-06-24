import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { SendMessageSchema, StartConversationSchema } from '@workarmy/validation';
import type { SendMessageData, StartConversationData } from '@workarmy/validation';
import type { ConversationThread, ConversationView } from '@workarmy/types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { MessagesService } from './messages.service';

@Controller()
export class MessagesController {
  constructor(private readonly messages: MessagesService) {}

  // --- worker ---
  @Get('messages')
  list(@CurrentUser() user: { sub: string }): Promise<ConversationView[]> {
    return this.messages.listForPerson(user.sub);
  }

  @Post('messages/start')
  start(
    @CurrentUser() user: { sub: string },
    @Body(new ZodValidationPipe(StartConversationSchema)) dto: StartConversationData,
  ): Promise<ConversationThread> {
    return this.messages.startFromPerson(user.sub, dto.orgWaId, dto.body);
  }

  @Get('messages/:id')
  thread(@CurrentUser() user: { sub: string }, @Param('id') id: string): Promise<ConversationThread> {
    return this.messages.threadForPerson(user.sub, id);
  }

  @Post('messages/:id/send')
  send(
    @CurrentUser() user: { sub: string },
    @Param('id') id: string,
    @Body(new ZodValidationPipe(SendMessageSchema)) dto: SendMessageData,
  ): Promise<ConversationThread> {
    return this.messages.sendFromPerson(user.sub, id, dto.body);
  }

  // --- provider ---
  @Get('org-messages')
  orgList(@CurrentUser() user: { sub: string }): Promise<ConversationView[]> {
    return this.messages.listForOrg(user.sub);
  }

  @Get('org-messages/:id')
  orgThread(@CurrentUser() user: { sub: string }, @Param('id') id: string): Promise<ConversationThread> {
    return this.messages.threadForOrg(user.sub, id);
  }

  @Post('org-messages/:id/send')
  orgSend(
    @CurrentUser() user: { sub: string },
    @Param('id') id: string,
    @Body(new ZodValidationPipe(SendMessageSchema)) dto: SendMessageData,
  ): Promise<ConversationThread> {
    return this.messages.sendFromOrg(user.sub, id, dto.body);
  }
}
