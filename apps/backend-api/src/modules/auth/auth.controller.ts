import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  ForgotPasswordSchema,
  LoginSchema,
  RegisterSchema,
  ResendOtpSchema,
  ResetPasswordSchema,
  VerifyEmailSchema,
  VerifyMobileSchema,
} from '@workarmy/validation';
import type {
  AuthTokenResponse,
  MeResponse,
  OkResponse,
  RegisterResponse,
  ResendOtpResponse,
} from '@workarmy/types';
import type { CookieOptions, Request, Response } from 'express';
import { env, REFRESH_COOKIE_NAME } from '../../config/env';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { ApiException } from '../../common/errors/api-exception';
import { requestContext } from '../../common/http-context';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { UsersService } from '../users/users.service';
import { TurnstileService } from '../turnstile/turnstile.service';
import { AuthService } from './auth.service';
import type { IssuedRefresh } from './session.service';

function cookies(req: Request): Record<string, string> {
  return (req as Request & { cookies?: Record<string, string> }).cookies ?? {};
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly users: UsersService,
    private readonly turnstile: TurnstileService,
  ) {}

  private refreshCookieOptions(expires?: Date): CookieOptions {
    const options: CookieOptions = {
      httpOnly: true,
      secure: env.COOKIE_SECURE,
      sameSite: env.COOKIE_SAMESITE,
      path: '/',
    };
    if (env.COOKIE_DOMAIN) options.domain = env.COOKIE_DOMAIN;
    if (expires) options.expires = expires;
    return options;
  }

  private setRefreshCookie(res: Response, refresh: IssuedRefresh): void {
    res.cookie(REFRESH_COOKIE_NAME, refresh.token, this.refreshCookieOptions(refresh.expiresAt));
  }

  private clearRefreshCookie(res: Response): void {
    res.clearCookie(REFRESH_COOKIE_NAME, this.refreshCookieOptions());
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('register')
  async register(
    @Body(new ZodValidationPipe(RegisterSchema)) dto: import('@workarmy/validation').RegisterInput,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<RegisterResponse> {
    const ctx = requestContext(req);
    const ok = await this.turnstile.verify(dto.turnstileToken, ctx.ip);
    if (!ok) throw ApiException.badRequest('TURNSTILE_FAILED', 'Bot check failed. Please try again.');
    const { tokens, ...rest } = await this.auth.register(dto, ctx);
    this.setRefreshCookie(res, tokens.refresh);
    return { ...rest, accessToken: tokens.accessToken };
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('verify-email')
  async verifyEmail(
    @Body(new ZodValidationPipe(VerifyEmailSchema)) dto: import('@workarmy/validation').VerifyEmailInput,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthTokenResponse> {
    const tokens = await this.auth.verifyEmail(dto, requestContext(req));
    this.setRefreshCookie(res, tokens.refresh);
    return { accessToken: tokens.accessToken };
  }

  @Public()
  @Throttle({ default: { limit: 3, ttl: 3_600_000 } })
  @Post('resend-otp')
  async resendOtp(
    @Body(new ZodValidationPipe(ResendOtpSchema)) dto: import('@workarmy/validation').ResendOtpInput,
  ): Promise<ResendOtpResponse> {
    return this.auth.resendOtp(dto);
  }

  @Public()
  @Throttle({ default: { limit: 3, ttl: 3_600_000 } })
  @Post('send-mobile-otp')
  async sendMobileOtp(
    @Body(new ZodValidationPipe(ResendOtpSchema)) dto: import('@workarmy/validation').ResendOtpInput,
  ): Promise<ResendOtpResponse> {
    return this.auth.sendMobileOtp(dto);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('verify-mobile')
  async verifyMobile(
    @Body(new ZodValidationPipe(VerifyMobileSchema)) dto: import('@workarmy/validation').VerifyMobileInput,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthTokenResponse> {
    const tokens = await this.auth.verifyMobile(dto, requestContext(req));
    this.setRefreshCookie(res, tokens.refresh);
    return { accessToken: tokens.accessToken };
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('login')
  async login(
    @Body(new ZodValidationPipe(LoginSchema)) dto: import('@workarmy/validation').LoginInput,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthTokenResponse> {
    const tokens = await this.auth.login(dto, requestContext(req));
    this.setRefreshCookie(res, tokens.refresh);
    return { accessToken: tokens.accessToken };
  }

  @Public()
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthTokenResponse> {
    const tokens = await this.auth.refresh(cookies(req)[REFRESH_COOKIE_NAME], requestContext(req));
    this.setRefreshCookie(res, tokens.refresh);
    return { accessToken: tokens.accessToken };
  }

  @Public()
  @Post('logout')
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<OkResponse> {
    await this.auth.logout(cookies(req)[REFRESH_COOKIE_NAME], requestContext(req));
    this.clearRefreshCookie(res);
    return { ok: true };
  }

  @Public()
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @Post('forgot-password')
  async forgotPassword(
    @Body(new ZodValidationPipe(ForgotPasswordSchema)) dto: import('@workarmy/validation').ForgotPasswordInput,
    @Req() req: Request,
  ): Promise<OkResponse> {
    await this.auth.forgotPassword(dto, requestContext(req));
    return { ok: true };
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('reset-password')
  async resetPassword(
    @Body(new ZodValidationPipe(ResetPasswordSchema)) dto: import('@workarmy/validation').ResetPasswordInput,
    @Req() req: Request,
  ): Promise<OkResponse> {
    await this.auth.resetPassword(dto, requestContext(req));
    return { ok: true };
  }

  @Get('me')
  async me(@CurrentUser() user: { sub: string }): Promise<MeResponse> {
    return this.users.getMe(user.sub);
  }
}
