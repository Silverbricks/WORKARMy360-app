import { z } from 'zod';
import { ACCOUNT_TYPES, PROVIDER_ACCOUNT_TYPES, type AccountType } from '@workarmy/types';
import { auEmail, auMobile, otpCode, personName, strongPassword } from './primitives';

const accountTypeEnum = z.enum(ACCOUNT_TYPES as unknown as [AccountType, ...AccountType[]]);

export const RegisterSchema = z
  .object({
    firstName: personName,
    lastName: personName,
    email: auEmail,
    password: strongPassword,
    mobile: auMobile,
    accountType: accountTypeEnum,
    companyName: z.string().trim().min(1, 'Company name is required').max(120).optional(),
    turnstileToken: z.string().optional(),
  })
  .superRefine((val, ctx) => {
    if (PROVIDER_ACCOUNT_TYPES.includes(val.accountType) && !val.companyName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['companyName'],
        message: 'Company name is required',
      });
    }
  });

export const VerifyEmailSchema = z.object({
  email: auEmail,
  code: otpCode,
});

export const VerifyMobileSchema = z.object({
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
export type VerifyMobileInput = z.infer<typeof VerifyMobileSchema>;
export type ResendOtpInput = z.infer<typeof ResendOtpSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
