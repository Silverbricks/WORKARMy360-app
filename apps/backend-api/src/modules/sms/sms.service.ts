import { Inject, Injectable } from '@nestjs/common';
import { OTP_TTL_SECONDS } from '@workarmy/auth';
import { SMS_PROVIDER, type SmsProvider } from './sms.types';

/** Convert an AU-normalised mobile (0412345678) to E.164 (+61412345678) for sending. */
export function toE164(mobile: string): string {
  const m = mobile.replace(/\s+/g, '');
  if (m.startsWith('+')) return m;
  if (m.startsWith('0')) return `+61${m.slice(1)}`;
  return `+${m}`;
}

@Injectable()
export class SmsService {
  constructor(@Inject(SMS_PROVIDER) private readonly provider: SmsProvider) {}

  async sendOtp(to: string, code: string): Promise<void> {
    const minutes = Math.round(OTP_TTL_SECONDS / 60);
    await this.provider.send({
      to: toE164(to),
      body: `${code} is your WorkArmy verification code. It expires in ${minutes} minutes.`,
    });
  }
}
