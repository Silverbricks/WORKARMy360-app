import { Injectable } from '@nestjs/common';
import {
  compareOtp,
  generateOtp,
  hashOtp,
  MAX_OTP_ATTEMPTS,
  MAX_OTP_SENDS_PER_WINDOW,
  OTP_RESEND_WINDOW_SECONDS,
  OTP_TTL_SECONDS,
} from '@workarmy/auth';
import { PrismaService } from '../../prisma/prisma.service';
import { ApiException } from '../../common/errors/api-exception';
import { EmailService } from '../email/email.service';
import { SmsService } from '../sms/sms.service';

export type OtpChannel = 'EMAIL' | 'SMS';
const purposeFor = (channel: OtpChannel) =>
  channel === 'SMS' ? 'MOBILE_VERIFICATION' : 'EMAIL_VERIFICATION';

@Injectable()
export class OtpService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
    private readonly sms: SmsService,
  ) {}

  /** Generate, store (hashed), and send a verification OTP over a channel. Returns its expiry. */
  async issue(
    user: { id: string; email: string; mobile?: string | null },
    channel: OtpChannel = 'EMAIL',
  ): Promise<Date> {
    if (channel === 'SMS' && !user.mobile) {
      throw ApiException.badRequest('VALIDATION_ERROR', 'No mobile number on file to text.');
    }
    const purpose = purposeFor(channel);
    const windowStart = new Date(Date.now() - OTP_RESEND_WINDOW_SECONDS * 1000);
    const recent = await this.prisma.otpCode.count({
      where: { userId: user.id, purpose, createdAt: { gte: windowStart } },
    });
    if (recent >= MAX_OTP_SENDS_PER_WINDOW) {
      throw ApiException.tooMany('Too many codes requested. Please try again later.', 'OTP_RATE_LIMITED');
    }

    const code = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_TTL_SECONDS * 1000);

    // Supersede any outstanding codes on this channel, then store the new one.
    await this.prisma.otpCode.updateMany({
      where: { userId: user.id, purpose, consumedAt: null },
      data: { consumedAt: new Date() },
    });
    await this.prisma.otpCode.create({
      data: { userId: user.id, codeHash: hashOtp(code), expiresAt, channel, purpose },
    });

    if (channel === 'SMS') await this.sms.sendOtp(user.mobile as string, code);
    else await this.email.sendOtp(user.email, code);
    return expiresAt;
  }

  /** Validate a submitted code on a channel; consumes it on success. Throws otherwise. */
  async verify(userId: string, code: string, channel: OtpChannel = 'EMAIL'): Promise<void> {
    const purpose = purposeFor(channel);
    const sentVia = channel === 'SMS' ? 'texted you' : 'emailed you';
    const otp = await this.prisma.otpCode.findFirst({
      where: { userId, purpose, consumedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    if (!otp) throw ApiException.badRequest('OTP_INVALID', `Enter the code we ${sentVia}.`);
    if (otp.expiresAt < new Date()) {
      throw ApiException.badRequest('OTP_EXPIRED', 'That code has expired. Request a new one.');
    }
    if (otp.attempts >= MAX_OTP_ATTEMPTS) {
      throw ApiException.tooMany('Too many attempts. Request a new code.', 'OTP_RATE_LIMITED');
    }
    if (!compareOtp(code, otp.codeHash)) {
      await this.prisma.otpCode.update({
        where: { id: otp.id },
        data: { attempts: { increment: 1 } },
      });
      throw ApiException.badRequest('OTP_INVALID', 'Incorrect code. Please try again.');
    }

    await this.prisma.otpCode.update({
      where: { id: otp.id },
      data: { consumedAt: new Date() },
    });
  }
}
