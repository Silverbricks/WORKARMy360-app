import { Logger } from '@nestjs/common';
import type { SmsMessage, SmsProvider } from '../sms.types';

/**
 * Production provider — sends via the Twilio REST API.
 * `from` may be a phone number, an alphanumeric sender ID (e.g. "WorkArmy", AU only),
 * or a Messaging Service SID (starts with "MG").
 */
export class TwilioSmsProvider implements SmsProvider {
  private readonly logger = new Logger('Sms');

  constructor(
    private readonly accountSid: string,
    private readonly authToken: string,
    private readonly from: string,
  ) {}

  async send(message: SmsMessage): Promise<void> {
    const params = new URLSearchParams({ To: message.to, Body: message.body });
    if (this.from.startsWith('MG')) params.set('MessagingServiceSid', this.from);
    else params.set('From', this.from);

    const auth = Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64');
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      },
    );

    if (!res.ok) {
      const detail = await res.text();
      this.logger.error(`Twilio failed (${res.status}): ${detail}`);
      throw new Error('Failed to send SMS');
    }
  }
}
