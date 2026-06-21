import { Inject, Injectable } from '@nestjs/common';
import { OTP_TTL_SECONDS } from '@workarmy/auth';
import { EMAIL_PROVIDER, type EmailProvider } from './email.types';

@Injectable()
export class EmailService {
  constructor(@Inject(EMAIL_PROVIDER) private readonly provider: EmailProvider) {}

  async sendOtp(to: string, code: string): Promise<void> {
    const minutes = Math.round(OTP_TTL_SECONDS / 60);
    const text = `Your WorkArmy verification code is ${code}.\nIt expires in ${minutes} minutes.\nIf you didn't request this, you can ignore this email.`;
    await this.provider.send({
      to,
      subject: `${code} is your WorkArmy code`,
      text,
      html: `<p>Your WorkArmy verification code is <strong style="font-size:20px">${code}</strong>.</p><p>It expires in ${minutes} minutes.</p><p>If you didn't request this, you can ignore this email.</p>`,
    });
  }

  async sendPasswordReset(to: string, resetUrl: string): Promise<void> {
    const text = `Reset your WorkArmy password using this link:\n${resetUrl}\nThe link expires in 15 minutes. If you didn't request this, you can ignore this email.`;
    await this.provider.send({
      to,
      subject: 'Reset your WorkArmy password',
      text,
      html: `<p>Reset your WorkArmy password using the link below.</p><p><a href="${resetUrl}">Reset password</a></p><p>The link expires in 15 minutes. If you didn't request this, you can ignore this email.</p>`,
    });
  }
}
