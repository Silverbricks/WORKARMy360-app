import { z } from 'zod';
import { ACCOUNT_TYPES, type AccountType } from '@workarmy/types';
import { auEmail, auMobile, otpCode, personName, strongPassword } from './primitives';

const accountTypeEnum = z.enum(ACCOUNT_TYPES as unknown as [AccountType, ...AccountType[]]);

export const RegisterSchema = z.object({
  firstName: personName,
  lastName: personName,
  email: auEmail,
  password: strongPassword,
  mobile: auMobile,
  accountType: accountTypeEnum,
  turnstileToken: z.string().optional(),
});

export const VerifyEmailSchema = z.object({
  email: auEmail,
  code: otpCode,
});

export const ResendOtpSchema = z.object({
  email: auEmail,
});

export const LoginSchema = z.object({
  email: auEmail,
  // Don't enforce strength on login — only that something was supplied.
  password: z.string().min(1, 'Password is required'),
});

export const ForgotPasswordSchema = z.object({
  email: auEmail,
});

export const ResetPasswordSchema = z.object({
  token: z.string().min(10, 'Invalid reset token'),
  password: strongPassword,
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type VerifyEmailInput = z.infer<typeof VerifyEmailSchema>;
export type ResendOtpInput = z.infer<typeof ResendOtpSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
