import type {
  AuthTokenResponse,
  ForgotPasswordRequest,
  LoginRequest,
  MeResponse,
  OkResponse,
  RegisterRequest,
  RegisterResponse,
  ResendOtpRequest,
  ResendOtpResponse,
  ResetPasswordRequest,
  VerifyEmailRequest,
} from '@workarmy/types';
import type { HttpClient } from '../http';

export function createAuthClient(http: HttpClient) {
  return {
    register: (body: RegisterRequest) =>
      http.request<RegisterResponse>('/auth/register', { method: 'POST', body }),

    verifyEmail: (body: VerifyEmailRequest) =>
      http.request<AuthTokenResponse>('/auth/verify-email', { method: 'POST', body }),

    resendOtp: (body: ResendOtpRequest) =>
      http.request<ResendOtpResponse>('/auth/resend-otp', { method: 'POST', body }),

    login: (body: LoginRequest) =>
      http.request<AuthTokenResponse>('/auth/login', { method: 'POST', body }),

    refresh: () => http.request<AuthTokenResponse>('/auth/refresh', { method: 'POST' }),

    logout: () => http.request<OkResponse>('/auth/logout', { method: 'POST' }),

    forgotPassword: (body: ForgotPasswordRequest) =>
      http.request<OkResponse>('/auth/forgot-password', { method: 'POST', body }),

    resetPassword: (body: ResetPasswordRequest) =>
      http.request<OkResponse>('/auth/reset-password', { method: 'POST', body }),

    me: () => http.request<MeResponse>('/auth/me', { method: 'GET' }),
  };
}

export type AuthClient = ReturnType<typeof createAuthClient>;
