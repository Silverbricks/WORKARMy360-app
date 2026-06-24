import { Controller, Get, Param, Post } from '@nestjs/common';
import type { Notification, OkResponse } from '@workarmy/types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  list(@CurrentUser() user: { sub: string }): Promise<Notification[]> {
    return this.notifications.list(user.sub);
  }

  @Post('read-all')
  markAllRead(@CurrentUser() user: { sub: string }): Promise<OkResponse> {
    return this.notifications.markAllRead(user.sub);
  }

  @Post(':id/read')
  markRead(@CurrentUser() user: { sub: string }, @Param('id') id: string): Promise<OkResponse> {
    return this.notifications.markRead(user.sub, id);
  }
}
