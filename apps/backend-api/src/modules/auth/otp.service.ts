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

@Injectable()
export class OtpService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
  ) {}

  /** Generate, store (hashed), and email a verification OTP. Returns its expiry. */
  async issue(user: { id: string; email: string }): Promise<Date> {
    const windowStart = new Date(Date.now() - OTP_RESEND_WINDOW_SECONDS * 1000);
    const recent = await this.prisma.otpCode.count({
      where: {
        userId: user.id,
        purpose: 'EMAIL_VERIFICATION',
        createdAt: { gte: windowStart },
      },
    });
    if (recent >= MAX_OTP_SENDS_PER_WINDOW) {
      throw ApiException.tooMany('Too many codes requested. Please try again later.', 'OTP_RATE_LIMITED');
    }

    const code = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_TTL_SECONDS * 1000);

    // Supersede any outstanding codes, then store the new one.
    await this.prisma.otpCode.updateMany({
      where: { userId: user.id, purpose: 'EMAIL_VERIFICATION', consumedAt: null },
      data: { consumedAt: new Date() },
    });
    await this.prisma.otpCode.create({
      data: { userId: user.id, codeHash: hashOtp(code), expiresAt },
    });

    await this.email.sendOtp(user.email, code);
    return expiresAt;
  }

  /** Validate a submitted code; consumes it on success. Throws otherwise. */
  async verify(userId: string, code: string): Promise<void> {
    const otp = await this.prisma.otpCode.findFirst({
      where: { userId, purpose: 'EMAIL_VERIFICATION', consumedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    if (!otp) throw ApiException.badRequest('OTP_INVALID', 'Enter the code we emailed you.');
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
