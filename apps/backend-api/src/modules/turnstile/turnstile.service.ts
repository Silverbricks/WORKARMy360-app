import { Injectable, Logger } from '@nestjs/common';
import { env } from '../../config/env';

/** Cloudflare Turnstile verification. No-op (passes) when disabled in dev. */
@Injectable()
export class TurnstileService {
  private readonly logger = new Logger('Turnstile');

  async verify(token: string | undefined, ip: string | null): Promise<boolean> {
    if (!env.TURNSTILE_ENABLED) return true;
    if (!token) return false;

    const body = new URLSearchParams();
    body.append('secret', env.TURNSTILE_SECRET ?? '');
    body.append('response', token);
    if (ip) body.append('remoteip', ip);

    try {
      const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        body,
      });
      if (!res.ok) return false;
      const data = (await res.json()) as { success?: boolean };
      return data.success === true;
    } catch (error) {
      this.logger.error(`Turnstile verify failed: ${String(error)}`);
      return false;
    }
  }
}
