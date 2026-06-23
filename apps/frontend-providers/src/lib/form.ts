import type { ZodError } from 'zod';
import { WorkArmyApiError } from '@workarmy/sdk';

export type FieldErrors = Record<string, string>;

export function zodFieldErrors(error: ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_';
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export function apiFieldErrors(error: unknown): FieldErrors {
  const out: FieldErrors = {};
  if (error instanceof WorkArmyApiError && error.details) {
    for (const [key, messages] of Object.entries(error.details)) {
      if (messages?.[0]) out[key] = messages[0];
    }
  }
  return out;
}

export function errorMessage(error: unknown): string {
  if (error instanceof WorkArmyApiError) return error.message;
  return 'Something went wrong. Please try again.';
}
