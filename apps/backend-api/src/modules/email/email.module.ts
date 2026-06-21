import { Module } from '@nestjs/common';
import { env } from '../../config/env';
import { EmailService } from './email.service';
import { EMAIL_PROVIDER } from './email.types';
import { ConsoleEmailProvider } from './providers/console.provider';
import { ResendEmailProvider } from './providers/resend.provider';

@Module({
  providers: [
    {
      provide: EMAIL_PROVIDER,
      useFactory: () =>
        env.EMAIL_PROVIDER === 'resend' && env.RESEND_API_KEY
          ? new ResendEmailProvider(env.RESEND_API_KEY, env.EMAIL_FROM)
          : new ConsoleEmailProvider(),
    },
    EmailService,
  ],
  exports: [EmailService],
})
export class EmailModule {}
