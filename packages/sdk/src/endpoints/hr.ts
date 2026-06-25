import type {
  HrOverview,
  LeaveInput,
  LeaveRequest,
  LeaveStatus,
  OnboardingCase,
  OnboardingInput,
  OnboardingStatus,
  PerformanceReview,
  PerformanceReviewInput,
  Warning,
  WarningInput,
} from '@workarmy/types';
import type { HttpClient } from '../http';

export function createHrClient(http: HttpClient) {
  return {
    overview: () => http.request<HrOverview>('/hr/overview'),
    leave: {
      list: () => http.request<LeaveRequest[]>('/hr/leave'),
      create: (body: LeaveInput) => http.request<LeaveRequest>('/hr/leave', { method: 'POST', body }),
      decide: (id: string, body: { status: Exclude<LeaveStatus, 'REQUESTED'> }) =>
        http.request<LeaveRequest>(`/hr/leave/${id}/decision`, { method: 'POST', body }),
    },
    reviews: {
      list: () => http.request<PerformanceReview[]>('/hr/reviews'),
      create: (body: PerformanceReviewInput) =>
        http.request<PerformanceReview>('/hr/reviews', { method: 'POST', body }),
    },
    onboarding: {
      list: () => http.request<OnboardingCase[]>('/hr/onboarding'),
      create: (body: OnboardingInput) =>
        http.request<OnboardingCase>('/hr/onboarding', { method: 'POST', body }),
      setStatus: (id: string, body: { status: OnboardingStatus }) =>
        http.request<OnboardingCase>(`/hr/onboarding/${id}/status`, { method: 'POST', body }),
    },
    warnings: {
      list: () => http.request<Warning[]>('/hr/warnings'),
      create: (body: WarningInput) => http.request<Warning>('/hr/warnings', { method: 'POST', body }),
    },
  };
}

export type HrClient = ReturnType<typeof createHrClient>;
