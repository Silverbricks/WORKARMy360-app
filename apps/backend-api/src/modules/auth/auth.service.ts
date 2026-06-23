import { Injectable } from '@nestjs/common';
import {
  generateOpaqueToken,
  hashPassword,
  hashToken,
  LOCKOUT_SECONDS,
  MAX_FAILED_LOGINS,
  RESET_TTL_SECONDS,
  signAccessToken,
  verifyPassword,
} from '@workarmy/auth';
import { allocateWaId } from '@workarmy/database';
import { PROVIDER_ACCOUNT_TYPES } from '@workarmy/types';
import type {
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResendOtpInput,
  ResetPasswordInput,
  VerifyEmailInput,
} from '@workarmy/validation';
import { env } from '../../config/env';
import { ApiException } from '../../common/errors/api-exception';
import type { RequestContext } from '../../common/http-context';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { EmailService } from '../email/email.service';
import { UsersService } from '../users/users.service';
import { OtpService } from './otp.service';
import { SessionService, type IssuedRefresh } from './session.service';

export interface AuthTokens {
  accessToken: string;
  refresh: IssuedRefresh;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UsersService,
    private readonly otp: OtpService,
    private readonly sessions: SessionService,
    private readonly audit: AuditService,
    private readonly email: EmailService,
  ) {}

  private signAccess(user: { id: string; email: string }): string {
    return signAccessToken(
      { sub: user.id, email: user.email },
      env.JWT_ACCESS_SECRET,
      env.ACCESS_TOKEN_TTL,
    );
  }

  private async issueTokens(user: { id: string; email: string }, ctx: RequestContext): Promise<AuthTokens> {
    const refresh = await this.sessions.issue(user.id, ctx);
    return { accessToken: this.signAccess(user), refresh };
  }

  async register(dto: RegisterInput, ctx: RequestContext) {
    const existing = await this.users.findByEmail(dto.email);
    if (existing) {
      throw ApiException.conflict('EMAIL_TAKEN', 'An account with this email already exists.');
    }

    const passwordHash = await hashPassword(dto.password);
    const isProvider = PROVIDER_ACCOUNT_TYPES.includes(dto.accountType);

    const { user, person, org } = await this.prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({ data: { email: dto.email, passwordHash } });
      await tx.authIdentity.create({
        data: { userId: createdUser.id, provider: 'LOCAL', providerUserId: dto.email },
      });
      const personWaId = await allocateWaId(tx);
      const createdPerson = await tx.person.create({
        data: {
          userId: createdUser.id,
          waId: personWaId,
          accountType: dto.accountType,
          firstName: dto.firstName,
          lastName: dto.lastName,
          mobile: dto.mobile,
        },
      });

      let createdOrg = null;
      if (isProvider) {
        const orgWaId = await allocateWaId(tx);
        createdOrg = await tx.organisation.create({
          data: {
            waId: orgWaId,
            accountType: dto.accountType,
            name: dto.companyName ?? `${dto.firstName} ${dto.lastName}`,
            members: { create: { personId: createdPerson.id, role: 'owner' } },
            profile: { create: {} },
            verifications: { create: { status: 'PENDING' } },
          },
        });
      }
      return { user: createdUser, person: createdPerson, org: createdOrg };
    });

    const otpExpiresAt = await this.otp.issue(user);

    await this.audit.record('USER_REGISTERED', {
      userId: user.id,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
      metadata: { accountType: dto.accountType, waId: person.waId },
    });
    if (org) {
      await this.audit.record('ORG_CREATED', {
        userId: user.id,
        ip: ctx.ip,
        metadata: { orgId: org.id, waId: org.waId },
      });
    }
    await this.audit.record('OTP_SENT', { userId: user.id, ip: ctx.ip });

    return { userId: user.id, waId: person.waId, otpExpiresAt: otpExpiresAt.toISOString() };
  }

  async resendOtp(dto: ResendOtpInput) {
    const user = await this.users.findByEmail(dto.email);
    // Don't reveal whether the email exists or is already verified.
    if (!user || user.emailVerified) {
      return { otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString() };
    }
    const otpExpiresAt = await this.otp.issue(user);
    await this.audit.record('OTP_SENT', { userId: user.id });
    return { otpExpiresAt: otpExpiresAt.toISOString() };
  }

  async verifyEmail(dto: VerifyEmailInput, ctx: RequestContext): Promise<AuthTokens> {
    const user = await this.users.findByEmail(dto.email);
    if (!user) throw ApiException.badRequest('OTP_INVALID', 'Enter the code we emailed you.');

    await this.otp.verify(user.id, dto.code);

    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true, status: 'ACTIVE' },
    });

    await this.audit.record('EMAIL_VERIFIED', { userId: user.id, ip: ctx.ip });
    await this.audit.record('LOGIN_SUCCESS', { userId: user.id, ip: ctx.ip, userAgent: ctx.userAgent });
    return this.issueTokens(updated, ctx);
  }

  async login(dto: LoginInput, ctx: RequestContext): Promise<AuthTokens> {
    const user = await this.users.findByEmail(dto.email);
    if (!user || !user.passwordHash) {
      throw ApiException.unauthorized('Incorrect email or password.', 'INVALID_CREDENTIALS');
    }
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw ApiException.unauthorized(
        'Account temporarily locked after too many attempts. Try again shortly.',
        'ACCOUNT_LOCKED',
      );
    }

    const ok = await verifyPassword(dto.password, user.passwordHash);
    if (!ok) {
      const attempts = user.failedLoginAttempts + 1;
      const locked = attempts >= MAX_FAILED_LOGINS;
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: locked ? 0 : attempts,
          lockedUntil: locked ? new Date(Date.now() + LOCKOUT_SECONDS * 1000) : user.lockedUntil,
        },
      });
      await this.audit.record('LOGIN_FAILED', { userId: user.id, ip: ctx.ip });
      if (locked) {
        await this.audit.record('ACCOUNT_LOCKED', { userId: user.id, ip: ctx.ip });
        throw ApiException.unauthorized(
          'Account temporarily locked after too many attempts. Try again shortly.',
          'ACCOUNT_LOCKED',
        );
      }
      throw ApiException.unauthorized('Incorrect email or password.', 'INVALID_CREDENTIALS');
    }

    if (!user.emailVerified) {
      throw ApiException.unauthorized('Please verify your email to continue.', 'EMAIL_NOT_VERIFIED');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
    });
    await this.audit.record('LOGIN_SUCCESS', { userId: user.id, ip: ctx.ip, userAgent: ctx.userAgent });
    return this.issueTokens(user, ctx);
  }

  async refresh(rawToken: string | undefined, ctx: RequestContext): Promise<AuthTokens> {
    if (!rawToken) throw ApiException.unauthorized('Session expired. Please log in again.', 'TOKEN_EXPIRED');
    const { userId, refresh } = await this.sessions.rotate(rawToken, ctx);
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw ApiException.unauthorized();
    await this.audit.record('TOKEN_REFRESHED', { userId, ip: ctx.ip });
    return { accessToken: this.signAccess(user), refresh };
  }

  async logout(rawToken: string | undefined, ctx: RequestContext): Promise<void> {
    if (rawToken) {
      await this.sessions.revoke(rawToken);
      await this.audit.record('LOGOUT', { ip: ctx.ip });
    }
  }

  async forgotPassword(dto: ForgotPasswordInput, ctx: RequestContext): Promise<void> {
    const user = await this.users.findByEmail(dto.email);
    if (!user) return; // never reveal whether the email exists

    const token = generateOpaqueToken();
    const expiresAt = new Date(Date.now() + RESET_TTL_SECONDS * 1000);
    await this.prisma.passwordReset.create({
      data: { userId: user.id, tokenHash: hashToken(token), expiresAt },
    });

    const resetUrl = `${env.APP_USERS_URL.replace(/\/$/, '')}/reset-password?token=${token}`;
    await this.email.sendPasswordReset(user.email, resetUrl);
    await this.audit.record('PASSWORD_RESET_REQUESTED', { userId: user.id, ip: ctx.ip });
  }

  async resetPassword(dto: ResetPasswordInput, ctx: RequestContext): Promise<void> {
    const record = await this.prisma.passwordReset.findUnique({
      where: { tokenHash: hashToken(dto.token) },
    });
    if (!record || record.usedAt) {
      throw ApiException.badRequest('TOKEN_INVALID', 'This reset link is invalid or already used.');
    }
    if (record.expiresAt < new Date()) {
      throw ApiException.badRequest('TOKEN_EXPIRED', 'This reset link has expired. Request a new one.');
    }

    const passwordHash = await hashPassword(dto.password);
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash, failedLoginAttempts: 0, lockedUntil: null },
      }),
      this.prisma.passwordReset.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
    ]);
    // Revoke existing sessions so a leaked session can't outlive a reset.
    await this.sessions.revokeAllForUser(record.userId);
    await this.audit.record('PASSWORD_RESET_COMPLETED', { userId: record.userId, ip: ctx.ip });
  }
}
