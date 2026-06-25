import { Global, Module } from '@nestjs/common';
import { env } from '../../config/env';
import { SmsService } from './sms.service';
import { SMS_PROVIDER } from './sms.types';
import { ConsoleSmsProvider } from './providers/console.provider';
import { TwilioSmsProvider } from './providers/twilio.provider';

@Global()
@Module({
  providers: [
    {
      provide: SMS_PROVIDER,
      useFactory: () =>
        env.SMS_PROVIDER === 'twilio' &&
        env.TWILIO_ACCOUNT_SID &&
        env.TWILIO_AUTH_TOKEN &&
        env.TWILIO_FROM
          ? new TwilioSmsProvider(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN, env.TWILIO_FROM)
          : new ConsoleSmsProvider(),
    },
    SmsService,
  ],
  exports: [SmsService],
})
export class SmsModule {}
