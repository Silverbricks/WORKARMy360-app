import { createClient, WorkArmyApiError } from '@workarmy/sdk';

/** Access token lives in memory only (never localStorage). Refresh rides in the
 * httpOnly cookie set by the backend and is replayed via credentials:'include'. */
let accessToken: string | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

export const api = createClient({ baseUrl, getAccessToken: () => accessToken });

/** Public download URL for an uploaded file (capability URL by document id). */
export function fileDownloadUrl(id: string): string {
  return `${baseUrl.replace(/\/$/, '')}/files/${id}/download`;
}

export const PROVIDERS_URL = process.env.NEXT_PUBLIC_PROVIDERS_URL ?? 'http://localhost:3001';

export { WorkArmyApiError };

// A non-httpOnly hint cookie so middleware can gate /dashboard instantly. It is
// NOT security — the backend enforces real auth on every API call.
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

/** Exchange the refresh cookie for a fresh access token on app load. */
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
