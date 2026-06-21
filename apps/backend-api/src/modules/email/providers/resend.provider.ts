import { Logger } from '@nestjs/common';
import type { EmailMessage, EmailProvider } from '../email.types';

/** Production provider — sends via the Resend HTTP API. */
export class ResendEmailProvider implements EmailProvider {
  private readonly logger = new Logger('Email');

  constructor(
    private readonly apiKey: string,
    private readonly from: string,
  ) {}

  async send(message: EmailMessage): Promise<void> {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: this.from,
        to: message.to,
        subject: message.subject,
        html: message.html,
        text: message.text,
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      this.logger.error(`Resend failed (${res.status}): ${detail}`);
      throw new Error('Failed to send email');
    }
  }
}
