import { Logger } from '@nestjs/common';
import type { SmsMessage, SmsProvider } from '../sms.types';

/** Dev provider — prints the SMS (incl. OTP) to the server log. */
export class ConsoleSmsProvider implements SmsProvider {
  private readonly logger = new Logger('Sms');

  async send(message: SmsMessage): Promise<void> {
    this.logger.log(
      `\n┌─ SMS (dev) ───────────────────────────────\n` +
        `│ To:   ${message.to}\n` +
        `│ Body: ${message.body}\n` +
        `└───────────────────────────────────────────`,
    );
  }
}
