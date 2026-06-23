import { createClient, WorkArmyApiError } from '@workarmy/sdk';

let accessToken: string | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

export const api = createClient({ baseUrl, getAccessToken: () => accessToken });

export const USERS_URL = process.env.NEXT_PUBLIC_USERS_URL ?? 'http://localhost:3000';

export { WorkArmyApiError };

const HINT_COOKIE = 'wa_auth';

export function setAuthHint(): void {
  if (typeof document !== 'undefined') {
    document.cookie = `${HINT_COOKIE}=1; path=/; max-age=2592000; samesite=lax`;
  }
}

export function clearAuthHint(): void {
  if (typeof document !== 'undefined') {
    document.cookie = `${HINT_COOKIE}=; path=/; max-age=0; samesite=lax`;
  }
}

export async function bootstrapSession(): Promise<boolean> {
  try {
    const { accessToken: token } = await api.auth.refresh();
    setAccessToken(token);
    return true;
  } catch {
    setAccessToken(null);
    return false;
  }
}
